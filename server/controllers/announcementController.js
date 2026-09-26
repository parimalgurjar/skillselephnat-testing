const Announcement = require("../models/Announcement");
const mongoose = require("mongoose");
const Batch = require("../models/Batch");
/* =====================================================
   GET ALL ANNOUNCEMENTS
   ADMIN ONLY

   Admin can see:
   - Published announcements
   - Draft announcements
   - All audiences
===================================================== */

const getAnnouncements = async (
  req,
  res
) => {
  try {
    const announcements =
      await Announcement.find()
        .populate(
          "createdBy",
          "name email"
        )
        .populate(
          "batchId",
          "name code batchTiming startTime endTime status"
        )
        .sort({
          pinned: -1,
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count:
        announcements.length,
      announcements,
    });

  } catch (error) {
    console.error(
      "Get Announcements Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching announcements",
    });
  }
};


/* =====================================================
   GET STUDENT ANNOUNCEMENTS
   STUDENT ONLY

   Student can see only:
   - PUBLISHED announcements
   - EVERYONE audience
   - STUDENTS audience

   Pinned announcements appear first.
===================================================== */

const getStudentAnnouncements = async (
  req,
  res
) => {
  try {
    const User = require("../models/User");

    const student = await User.findOne({
      _id: req.user._id,
      role: "STUDENT",
      isActive: true,
    })
      .select("batchId")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student not found or inactive",
      });
    }

    const announcements =
      await Announcement.find({
        status: "PUBLISHED",

        audience: {
          $in: [
            "EVERYONE",
            "STUDENTS",
          ],
        },

        $or: [
          {
            batchId: null,
          },

          {
            batchId: student.batchId,
          },
        ],
      })
        .populate(
          "createdBy",
          "name"
        )
        .populate(
          "batchId",
          "name code batchTiming startTime endTime"
        )
        .sort({
          pinned: -1,
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count:
        announcements.length,
      announcements,
    });

  } catch (error) {
    console.error(
      "Get Student Announcements Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching announcements",
    });
  }
};


/* =====================================================
   CREATE ANNOUNCEMENT
   ADMIN ONLY
===================================================== */

const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      description,
      audience,
      priority,
      pinned,
      status,
    } = req.body;

    /* ===============================================
       VALIDATION
    =============================================== */

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    /* ===============================================
       VALID ENUM VALUES
    =============================================== */

    const validAudiences = [
      "STUDENTS",
      "TEACHERS",
      "EVERYONE",
    ];

    const validPriorities = [
      "NORMAL",
      "IMPORTANT",
      "URGENT",
    ];

    const validStatuses = [
      "PUBLISHED",
      "DRAFT",
    ];

    if (
      audience &&
      !validAudiences.includes(audience)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid audience",
      });
    }

    if (
      priority &&
      !validPriorities.includes(priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority",
      });
    }

    if (
      status &&
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement status",
      });
    }

    /* ===============================================
       CREATE
    =============================================== */

    const announcement =
      await Announcement.create({
        title: title.trim(),

        description: description.trim(),

        audience:
          audience || "EVERYONE",

        priority:
          priority || "NORMAL",

        pinned:
          typeof pinned === "boolean"
            ? pinned
            : false,

        status:
          status || "PUBLISHED",

        createdBy: req.user._id,
      });

    return res.status(201).json({
      success: true,
      message:
        "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    console.error(
      "Create Announcement Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating announcement",
    });
  }
};


/* =====================================================
   UPDATE ANNOUNCEMENT
   ADMIN ONLY
===================================================== */

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement =
      await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    /* ===============================================
       TITLE
    =============================================== */

    if (req.body.title !== undefined) {
      if (
        !req.body.title ||
        !req.body.title.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }

      announcement.title =
        req.body.title.trim();
    }

    /* ===============================================
       DESCRIPTION
    =============================================== */

    if (req.body.description !== undefined) {
      if (
        !req.body.description ||
        !req.body.description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Description cannot be empty",
        });
      }

      announcement.description =
        req.body.description.trim();
    }

    /* ===============================================
       AUDIENCE VALIDATION
    =============================================== */

    if (req.body.audience !== undefined) {
      const validAudiences = [
        "STUDENTS",
        "TEACHERS",
        "EVERYONE",
      ];

      if (
        !validAudiences.includes(
          req.body.audience
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid audience",
        });
      }

      announcement.audience =
        req.body.audience;
    }

    /* ===============================================
       PRIORITY VALIDATION
    =============================================== */

    if (req.body.priority !== undefined) {
      const validPriorities = [
        "NORMAL",
        "IMPORTANT",
        "URGENT",
      ];

      if (
        !validPriorities.includes(
          req.body.priority
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid priority",
        });
      }

      announcement.priority =
        req.body.priority;
    }

    /* ===============================================
       STATUS VALIDATION
    =============================================== */

    if (req.body.status !== undefined) {
      const validStatuses = [
        "PUBLISHED",
        "DRAFT",
      ];

      if (
        !validStatuses.includes(
          req.body.status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid announcement status",
        });
      }

      announcement.status =
        req.body.status;
    }

    /* ===============================================
       PINNED
    =============================================== */

    if (
      typeof req.body.pinned === "boolean"
    ) {
      announcement.pinned =
        req.body.pinned;
    }

    await announcement.save();

    return res.status(200).json({
      success: true,
      message:
        "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    console.error(
      "Update Announcement Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating announcement",
    });
  }
};


/* =====================================================
   DELETE ANNOUNCEMENT
   ADMIN ONLY
===================================================== */

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement =
      await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    await announcement.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Announcement deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Announcement Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting announcement",
    });
  }
};


/* =====================================================
   TOGGLE PIN ANNOUNCEMENT
   ADMIN ONLY
===================================================== */

const togglePinAnnouncement = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const announcement =
      await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    announcement.pinned =
      !announcement.pinned;

    await announcement.save();

    return res.status(200).json({
      success: true,

      message: announcement.pinned
        ? "Announcement pinned successfully"
        : "Announcement unpinned successfully",

      announcement,
    });
  } catch (error) {
    console.error(
      "Toggle Pin Announcement Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating announcement",
    });
  }
};
const getMyAnnouncements = async (
  req,
  res
) => {
  try {
    const announcements =
      await Announcement.find({
        createdBy:
          req.user._id,
      })
        .populate(
          "batchId",
          "name code batchTiming startTime endTime status"
        )
        .sort({
          pinned: -1,
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count:
        announcements.length,
      announcements,
    });

  } catch (error) {
    console.error(
      "Get My Announcements Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch your announcements",
    });
  }
};
const createTeacherAnnouncement = async (
  req,
  res
) => {
  try {
    const {
      title,
      description,
      batchId,
      pinned,
      priority,
    } = req.body;

    /* ===============================================
       VALIDATION
    =============================================== */

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Title is required",
      });
    }

    if (
      !description ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Description is required",
      });
    }
const validPriorities = [
  "NORMAL",
  "IMPORTANT",
  "URGENT",
];

if (
  priority !== undefined &&
  !validPriorities.includes(priority)
) {
  return res.status(400).json({
    success: false,
    message: "Invalid priority",
  });
}
    /* ===============================================
       VALIDATE BATCH
    =============================================== */

    let validBatchId = null;

    if (batchId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          batchId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid batch ID",
        });
      }

      const batch =
        await Batch.findById(batchId);

      if (!batch) {
        return res.status(404).json({
          success: false,
          message:
            "Selected batch not found",
        });
      }

      validBatchId =
        batch._id;
    }

    /* ===============================================
       CREATE
    =============================================== */

    const announcement =
      await Announcement.create({
        title:
          title.trim(),

        description:
          description.trim(),

        audience:
          "STUDENTS",

        /*
          CANONICAL RELATION
        */

        batchId:
          validBatchId,

        priority:
          priority || "NORMAL",

        pinned:
          typeof pinned ===
          "boolean"
            ? pinned
            : false,

        status:
          "PUBLISHED",

        createdBy:
          req.user._id,
      });

    /*
      Populate before response
    */

    await announcement.populate([
      {
        path: "batchId",
        select:
          "name code batchTiming startTime endTime",
      },
      {
        path: "createdBy",
        select:
          "name",
      },
    ]);

    return res.status(201).json({
      success: true,
      message:
        "Announcement created successfully",
      announcement,
    });

  } catch (error) {
    console.error(
      "Create Teacher Announcement Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create announcement",
    });
  }
};

/* =====================================================
   EXPORTS
===================================================== */


module.exports = {
  getAnnouncements,
  getStudentAnnouncements,

  getMyAnnouncements,

  createAnnouncement,
  createTeacherAnnouncement,

  updateAnnouncement,
  deleteAnnouncement,
  togglePinAnnouncement,
};