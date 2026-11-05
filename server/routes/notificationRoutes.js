const express = require("express");
const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const User = require("../models/User");
const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Har endpoint ke liye authenticated, active user required.
router.use(protect);

const isValidId = (value) =>
  typeof value === "string" &&
  /^[a-f\d]{24}$/i.test(value);

/* =====================================================
   GET NOTIFICATIONS + UNREAD COUNTS

   GET /api/notifications
   GET /api/notifications?before=NOTIFICATION_ID
===================================================== */

router.get("/", async (req, res) => {
  try {
    const { before } = req.query;

    if (
      before !== undefined &&
      !isValidId(before)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification cursor",
      });
    }

    const filter = {
      recipient: req.user._id,
    };

    if (before) {
      filter._id = {
        $lt: new mongoose.Types.ObjectId(before),
      };
    }

    const [
      rows,
      unreadCount,
      unreadGroups,
    ] = await Promise.all([
      Notification.find(filter)
        .sort({ _id: -1 })
        .limit(31)
        .select("title message link readAt createdAt")
        .lean(),

      Notification.countDocuments({
        recipient: req.user._id,
        readAt: null,
      }),

      Notification.aggregate([
        {
          $match: {
            recipient: req.user._id,
            readAt: null,
          },
        },
        {
          $group: {
            _id: "$link",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const notifications = rows.slice(0, 30);

    /*
      Example:
      /teacher/doubts/123 → /teacher/doubts

      Sidebar count ALL unread notifications se aayega,
      sirf latest 30 se nahi.
    */
    const unreadBySection = {};

    for (const group of unreadGroups) {
      const section = group._id
        .split("/")
        .slice(0, 3)
        .join("/");

      unreadBySection[section] =
        (unreadBySection[section] || 0) +
        group.count;
    }

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      unreadBySection,

      nextCursor:
        rows.length > 30
          ? String(notifications[29]._id)
          : null,
    });
  } catch (error) {
    console.error(
      "Get Notifications Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications",
    });
  }
});

/* =====================================================
   RESOLVE OLD SIGNUP NOTIFICATIONS

   Mark signup notifications read when user
   is no longer pending.
===================================================== */

router.patch("/resolve-signups", async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // Current admin's unread signup notifications
    const notifications = await Notification.find({
      recipient: req.user._id,
      eventKey: /^SIGNUP:/,
      readAt: null,
    })
      .select("_id eventKey")
      .lean();

    if (!notifications.length) {
      return res.status(200).json({
        success: true,
        modifiedCount: 0,
      });
    }

    // Extract registered user IDs from event keys
    const signupNotifications = notifications
      .map((notification) => {
        const match = notification.eventKey.match(
          /^SIGNUP:([a-f\d]{24}):created$/i
        );

        return match
          ? {
              notificationId: notification._id,
              userId: match[1],
            }
          : null;
      })
      .filter(Boolean);

    if (!signupNotifications.length) {
      return res.status(200).json({
        success: true,
        modifiedCount: 0,
      });
    }

    const userIds = signupNotifications.map(
      (item) => item.userId
    );

    // Find users who are still waiting for approval
    const pendingUsers = await User.find({
      _id: {
        $in: userIds,
      },
      status: "PENDING",
    })
      .select("_id")
      .lean();

    const pendingIds = new Set(
      pendingUsers.map((user) => String(user._id))
    );

    // Only resolve notifications for users
    // who are no longer pending.
    const resolvedNotificationIds =
      signupNotifications
        .filter(
          (item) => !pendingIds.has(item.userId)
        )
        .map((item) => item.notificationId);

    if (!resolvedNotificationIds.length) {
      return res.status(200).json({
        success: true,
        modifiedCount: 0,
      });
    }

    const result = await Notification.updateMany(
      {
        _id: {
          $in: resolvedNotificationIds,
        },
        recipient: req.user._id,
        readAt: null,
      },
      {
        $set: {
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount,
    });

  } catch (error) {
    console.error(
      "Resolve Signup Notifications Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to resolve signup notifications",
    });
  }
});
/* =====================================================
   MARK ALL EXISTING NOTIFICATIONS AS READ

   PATCH /api/notifications/read-all
   Body: { throughId }

   throughId ke baad aayi new notifications unread rahengi.
===================================================== */

router.patch("/read-all", async (req, res) => {
  try {
    const { throughId } = req.body || {};

    if (!isValidId(throughId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    await Notification.updateMany(
      {
        recipient: req.user._id,
        readAt: null,

        _id: {
          $lte: new mongoose.Types.ObjectId(throughId),
        },
      },
      {
        $set: {
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Mark All Notifications Read Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to mark notifications as read",
    });
  }
});

/* =====================================================
   MARK ONE CONVERSATION'S NOTIFICATIONS AS READ

   PATCH /api/notifications/read-conversation
   Body: { link, through }

   Sirf current user's matching conversation update hogi.
===================================================== */

router.patch(
  "/read-conversation",
  async (req, res) => {
    try {
      const { link, through } = req.body || {};

      const role = req.user.role.toLowerCase();
      const prefix = `/${role}/doubts/`;

      const cutoff =
        typeof through === "string"
          ? new Date(through)
          : null;

      const validRequest =
        ["student", "teacher"].includes(role) &&
        typeof link === "string" &&
        link.startsWith(prefix) &&
        isValidId(link.slice(prefix.length)) &&
        cutoff !== null &&
        !Number.isNaN(cutoff.getTime()) &&
        cutoff.getTime() <= Date.now();

      if (!validRequest) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversation read request",
        });
      }

      await Notification.updateMany(
        {
          recipient: req.user._id,
          link,
          readAt: null,

          createdAt: {
            $lte: cutoff,
          },
        },
        {
          $set: {
            readAt: new Date(),
          },
        }
      );

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error(
        "Mark Conversation Read Error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update conversation notifications",
      });
    }
  }
);

/* =====================================================
   MARK SINGLE NOTIFICATION AS READ

   PATCH /api/notifications/:id/read
===================================================== */

router.patch("/:id/read", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          recipient: req.user._id,
        },
        {
          $set: {
            readAt: new Date(),
          },
        },
        {
            returnDocument: "after",
        }
      ).select("_id");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Mark Notification Read Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to mark notification as read",
    });
  }
});

module.exports = router;