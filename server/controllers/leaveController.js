
const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");
const Batch = require("../models/Batch");
const Attendance = require("../models/Attendance");
const Notification = require("../models/Notification");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const mongoose = require("mongoose");
/* =====================================================
   DATE HELPERS

   IMPORTANT:
   Match attendanceController.js getDateRange().
   Use server-local midnight for attendance dates.
===================================================== */

const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateOnly = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  if (formatDateOnly(date) !== value) {
    return null;
  }

  return date;
};

const getIndiaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  return parseDateOnly(
    `${values.year}-${values.month}-${values.day}`
  );
};

const getDateKey = (date) => {
  return formatDateOnly(new Date(date));
};

/* =====================================================
   NOTIFY ADMINS
===================================================== */

const notifyAdmins = async (leave, studentName) => {
  try {
    const admins = await User.find({
      role: "ADMIN",
      status: "ACTIVE",
      isActive: true,
    })
      .select("_id")
      .lean();

    if (!admins.length) return;

    const operations = admins.map((admin) => ({
      updateOne: {
        filter: {
          recipient: admin._id,
          eventKey: `LEAVE_REQUEST:${leave._id}`,
        },
        update: {
          $setOnInsert: {
            recipient: admin._id,
            eventKey: `LEAVE_REQUEST:${leave._id}`,
            title: "New leave request",
            message: `${studentName} submitted a leave request from ${formatDateOnly(
              leave.startDate
            )} to ${formatDateOnly(leave.endDate)}.`,
            link: "/admin/leaves",
            readAt: null,
          },
        },
        upsert: true,
      },
    }));

    await Notification.bulkWrite(operations, {
      ordered: false,
    });
  } catch (error) {
    console.error(
      "Leave Admin Notification Error:",
      error.message
    );
  }
};

/* =====================================================
   NOTIFY STUDENT
===================================================== */

const notifyStudent = async (leave, status) => {
  try {
    await Notification.updateOne(
      {
        recipient: leave.studentId,
        eventKey: `LEAVE_DECISION:${leave._id}`,
      },
      {
        $set: {
          title:
            status === "APPROVED"
              ? "Leave approved"
              : "Leave request rejected",

          message:
            status === "APPROVED"
              ? "Your leave request has been approved. Applicable class dates have been marked as LEAVE."
              : `Your leave request was rejected.${
                  leave.adminRemarks
                    ? ` Admin remarks: ${leave.adminRemarks}`
                    : ""
                }`,

          link: "/student/leaves",
          readAt: null,
        },

        $setOnInsert: {
          recipient: leave.studentId,
          eventKey: `LEAVE_DECISION:${leave._id}`,
        },
      },
      {
        upsert: true,
      }
    );
  } catch (error) {
    console.error(
      "Leave Student Notification Error:",
      error.message
    );
  }
};

/* =====================================================
   CREATE LEAVE REQUEST
   STUDENT ONLY

   POST /api/leaves

   FormData:
   startDate
   endDate
   reason
   proof (optional)
===================================================== */

exports.createLeaveRequest = async (req, res) => {
  try {
    const startDate = parseDateOnly(req.body.startDate);
    const endDate = parseDateOnly(req.body.endDate);
    const reason = String(req.body.reason || "").trim();

    if (!startDate || !endDate || endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid leave date range.",
      });
    }

    if (startDate < getIndiaToday()) {
      return res.status(400).json({
        success: false,
        message: "Past dates cannot be requested for leave.",
      });
    }

    if (!reason || reason.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Please enter a reason (maximum 1000 characters).",
      });
    }

    const student = await User.findOne({
      _id: req.user._id,
      role: "STUDENT",
      status: "ACTIVE",
      isActive: true,
    }).select("name batchId batchTiming");

    if (!student || !student.batchId) {
      return res.status(400).json({
        success: false,
        message:
          "Your active batch is not assigned. Please contact the administrator.",
      });
    }

    const batch = await Batch.findOne({
      _id: student.batchId,
      status: "ACTIVE",
    })
      .select("_id status batchTiming")
      .lean();

    if (!batch) {
      return res.status(400).json({
        success: false,
        message: "Your batch is not active.",
      });
    }

    // Prevent overlapping pending or approved requests.
    const overlappingRequest = await LeaveRequest.findOne({
      studentId: student._id,
      status: {
        $in: ["PENDING", "APPROVED"],
      },
      startDate: {
        $lte: endDate,
      },
      endDate: {
        $gte: startDate,
      },
    }).lean();

    if (overlappingRequest) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a pending or approved leave request overlapping these dates.",
      });
    }

    let attachment = {
      url: "",
      publicId: "",
      originalName: "",
      mimeType: "",
      size: 0,
    };

    if (req.file) {
      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        {
          folder: "skillselephant/leaves",
          resource_type: "auto",
          public_id: `leave-${student._id}-${Date.now()}`,
        }
      );

      attachment = {
        url: uploaded.secure_url || uploaded.url || "",
        publicId: uploaded.public_id || "",
        originalName:
          req.file.originalname || "Proof document",
        mimeType: req.file.mimetype || "",
        size: req.file.size || 0,
      };
    }

    const leave = await LeaveRequest.create({
      studentId: student._id,
      batchId: student.batchId,
      batchTiming:
        batch.batchTiming || student.batchTiming || "",
      startDate,
      endDate,
      reason,
      attachment,
      status: "PENDING",
    });

    await notifyAdmins(leave, student.name);

    const populatedLeave = await LeaveRequest.findById(
      leave._id
    )
      .populate(
        "studentId",
        "name email studentId batchTiming"
      )
      .populate(
        "batchId",
        "name batchTiming startTime endTime"
      )
      .lean();

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully.",
      leave: populatedLeave,
    });
  } catch (error) {
    console.error("Create Leave Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit leave request.",
    });
  }
};

/* =====================================================
   GET STUDENT'S OWN LEAVE REQUESTS

   GET /api/leaves/my
===================================================== */

exports.getMyLeaveRequests = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({
      studentId: req.user._id,
    })
      .populate(
        "batchId",
        "name batchTiming startTime endTime"
      )
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      leaves,
    });
  } catch (error) {
    console.error("Get My Leave Requests Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch leave requests.",
    });
  }
};

/* =====================================================
   GET ALL LEAVE REQUESTS
   ADMIN ONLY

   GET /api/leaves
===================================================== */

exports.getAllLeaveRequests = async (req, res) => {
  try {
    const filter = {};

    if (
      ["PENDING", "APPROVED", "REJECTED"].includes(
        req.query.status
      )
    ) {
      filter.status = req.query.status;
    }

    const leaves = await LeaveRequest.find(filter)
      .populate(
        "studentId",
        "name email studentId phone batchTiming"
      )
      .populate(
        "batchId",
        "name batchTiming startTime endTime"
      )
      .populate("reviewedBy", "name")
      .sort({
        status: 1,
        createdAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      leaves,
    });
  } catch (error) {
    console.error("Get All Leave Requests Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch leave requests.",
    });
  }
};

/* =====================================================
   REVIEW LEAVE REQUEST
   ADMIN ONLY

   APPROVED:
   - Mark applicable class dates as LEAVE.
   - Never overwrite PRESENT.
   - Preserve existing markedBy and markedAt.
===================================================== */

exports.cancelMyLeaveRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave request ID.",
      });
    }

    // Student can cancel only their own PENDING request.
    const leave = await LeaveRequest.findOneAndDelete({
      _id: req.params.id,
      studentId: req.user._id,
      status: "PENDING",
    });

    if (!leave) {
      const existing = await LeaveRequest.findOne({
        _id: req.params.id,
        studentId: req.user._id,
      }).select("status").lean();

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Leave request not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message: `Only pending leave requests can be cancelled. Current status: ${existing.status}.`,
      });
    }

    // Remove pending admin notification.
    try {
      await Notification.deleteMany({
        eventKey: `LEAVE_REQUEST:${leave._id}`,
      });
    } catch (notificationError) {
      console.error(
        "Notification cleanup error:",
        notificationError.message
      );
    }

    return res.json({
      success: true,
      message: "Your pending leave request has been cancelled.",
    });

  } catch (error) {
    console.error("Cancel Leave Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel leave request.",
    });
  }
};


exports.reviewLeaveRequest = async (req, res) => {
  let session;

  try {
    const status = String(req.body.status || "").toUpperCase();
    const adminRemarks = String(req.body.adminRemarks || "").trim();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Choose approve or reject.",
      });
    }

    if (adminRemarks.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Remarks cannot exceed 1000 characters.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave request ID.",
      });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const leave = await LeaveRequest.findById(
      req.params.id
    ).session(session);

    if (!leave) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    if (leave.status !== "PENDING") {
      await session.abortTransaction();

      return res.status(409).json({
        success: false,
        message: `Request already ${leave.status.toLowerCase()}.`,
      });
    }

    let markedDates = [];

    if (status === "APPROVED") {
      // Verify student and original batch.
      const student = await User.findOne({
        _id: leave.studentId,
        role: "STUDENT",
        status: "ACTIVE",
        isActive: true,
      })
        .select("_id batchId")
        .session(session)
        .lean();

      if (
        !student ||
        !student.batchId ||
        String(student.batchId) !== String(leave.batchId)
      ) {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,
          message: "Student batch is no longer valid.",
        });
      }

      const batch = await Batch.findById(leave.batchId)
        .select("classDays batchTiming")
        .session(session)
        .lean();

      if (!batch) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          message: "Batch not found.",
        });
      }

      // Never assume every day is a class day.
      const validDays = [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ];

      const classDays = Array.isArray(batch.classDays)
        ? [...new Set(
            batch.classDays
              .map((day) => String(day).trim().toUpperCase())
              .filter((day) => validDays.includes(day))
          )]
        : [];

      if (classDays.length === 0) {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,
          message:
            "This batch has no class days configured. Update batch class days before approving leave.",
        });
      }

      const dayNames = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ];

      const scheduledDates = [];

      const cursor = new Date(leave.startDate);
      cursor.setHours(0, 0, 0, 0);

      const lastDate = new Date(leave.endDate);
      lastDate.setHours(0, 0, 0, 0);

      while (cursor <= lastDate) {
        if (classDays.includes(dayNames[cursor.getDay()])) {
          scheduledDates.push(new Date(cursor));
        }

        cursor.setDate(cursor.getDate() + 1);
      }

      if (scheduledDates.length === 0) {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,
          message: "No class days found in the selected leave period.",
        });
      }

      // Fetch existing attendance inside the transaction.
      const rangeStart = scheduledDates[0];

      const rangeEnd = new Date(
        scheduledDates[scheduledDates.length - 1]
      );

      rangeEnd.setDate(rangeEnd.getDate() + 1);

      const existingRecords = await Attendance.find({
        studentId: leave.studentId,
        batchId: leave.batchId,
        date: {
          $gte: rangeStart,
          $lt: rangeEnd,
        },
      })
        .session(session)
        .lean();

      const existingByDate = new Map();

      existingRecords.forEach((record) => {
        existingByDate.set(
          getDateKey(record.date),
          record
        );
      });

      const operations = [];

      for (const attendanceDate of scheduledDates) {
        const existing = existingByDate.get(
          getDateKey(attendanceDate)
        );

        // Never overwrite PRESENT.
        if (existing?.status === "PRESENT") {
          continue;
        }

        if (existing) {
          if (existing.status !== "LEAVE") {
            operations.push({
              updateOne: {
                filter: {
                  _id: existing._id,
                  status: { $ne: "PRESENT" },
                },
                update: {
                  $set: {
                    status: "LEAVE",
                  },
                },
              },
            });
          }
        } else {
          operations.push({
            updateOne: {
              filter: {
                studentId: leave.studentId,
                batchId: leave.batchId,
                date: attendanceDate,
              },
              update: {
                $setOnInsert: {
                  studentId: leave.studentId,
                  batchId: leave.batchId,
                  batchTiming: batch.batchTiming || "",
                  date: attendanceDate,
                  status: "LEAVE",
                  markedBy: req.user._id,
                  markedAt: new Date(),
                },
              },
              upsert: true,
            },
          });
        }

        markedDates.push(attendanceDate);
      }

      if (operations.length > 0) {
        await Attendance.bulkWrite(operations, {
          ordered: true,
          session,
        });
      }
    }

    // Leave decision and attendance changes commit together.
    const result = await LeaveRequest.updateOne(
      {
        _id: leave._id,
        status: "PENDING",
      },
      {
        $set: {
          status,
          adminRemarks,
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
          attendanceMarkedDates: markedDates,
        },
      },
      { session }
    );

    if (result.modifiedCount !== 1) {
      await session.abortTransaction();

      return res.status(409).json({
        success: false,
        message: "Leave request was already reviewed.",
      });
    }

    await session.commitTransaction();

    // Notify only after successful commit.
    await notifyStudent(
      {
        _id: leave._id,
        studentId: leave.studentId,
        adminRemarks,
      },
      status
    );

    const populatedLeave = await LeaveRequest.findById(
      leave._id
    )
      .populate("studentId", "name email studentId batchTiming")
      .populate("batchId", "name batchTiming startTime endTime")
      .populate("reviewedBy", "name")
      .lean();

    return res.json({
      success: true,
      message:
        status === "APPROVED"
          ? "Leave approved and applicable class dates marked as LEAVE."
          : "Leave request rejected.",
      leave: populatedLeave,
    });

  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Review Leave Error:", error);

    const transactionError =
      error.code === 20 ||
      /Transaction numbers are only allowed|replica set|does not support transactions/i.test(
        error.message || ""
      );

    return res.status(transactionError ? 503 : 500).json({
      success: false,
      message: transactionError
        ? "MongoDB transactions require an Atlas replica set or sharded cluster. No changes were committed."
        : "Unable to update leave request.",
    });

  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

