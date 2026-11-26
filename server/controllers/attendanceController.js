const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Batch = require("../models/Batch");
const mongoose = require("mongoose");
const LeaveRequest = require("../models/LeaveRequest");
/* =====================================================
   CONSTANTS
===================================================== */

const ATTENDANCE_EDIT_HOURS = 96;

/* =====================================================
   HELPER - VALID MONGODB ID
===================================================== */

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/* =====================================================
   DATE RANGE HELPER
===================================================== */

const getDateRange = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);

  return {
    start: date,
    end: nextDate,
  };
};

/* =====================================================
   FORMAT SINGLE TIME
===================================================== */

const formatSingleTime = (time) => {
  if (!time) return "";

  const value = time
    .toString()
    .trim()
    .replace(".", ":");

  const parts = value.split(":");

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || "0", 10);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time;
  }

  const period =
    hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${hours}:${minutes
    .toString()
    .padStart(2, "0")} ${period}`;
};

/* =====================================================
   FORMAT BATCH TIMING
===================================================== */

const formatBatchTiming = (batch) => {
  if (!batch) return "";

  if (
    batch.startTime &&
    batch.endTime
  ) {
    return `${formatSingleTime(
      batch.startTime
    )} - ${formatSingleTime(
      batch.endTime
    )}`;
  }

  if (batch.batchTiming) {
    return batch.batchTiming;
  }

  return "";
};

/* =====================================================
   GET VALID BATCH

   Priority:
   1. batchId
   2. batchTiming (legacy)
===================================================== */

const getValidBatch = async (
  batchId,
  batchTiming,
  requireActive = true
) => {
  let batch = null;

  if (batchId) {
    if (!isValidObjectId(batchId)) {
      return {
        success: false,
        message: "Invalid batch ID",
      };
    }

    const filter = {
      _id: batchId,
    };

    if (requireActive) {
      filter.status = "ACTIVE";
    }

    batch = await Batch.findOne(filter)
      .lean();

    if (!batch) {
      return {
        success: false,
        message: requireActive
          ? "Selected batch was not found or is inactive"
          : "Selected batch was not found",
      };
    }

    return {
      success: true,
      batch,
    };
  }

  if (batchTiming?.trim()) {
    const filter = {
      batchTiming: batchTiming.trim(),
    };

    if (requireActive) {
      filter.status = "ACTIVE";
    }

    batch = await Batch.findOne(filter)
      .lean();

    if (!batch) {
      return {
        success: false,
        message: requireActive
          ? "Selected batch timing was not found or is inactive"
          : "Selected batch timing was not found",
      };
    }

    return {
      success: true,
      batch,
    };
  }

  return {
    success: false,
    message: "Please select a valid batch",
  };
};

/* =====================================================
   CHECK BATCH ATTENDANCE ACCESS

   ADMIN:
   Can access all batches

   TEACHER:
   Must be assigned inside Batch.attendanceTeachers
===================================================== */
const canManageBatchAttendance = (
  batch,
  user
) => {
  if (!batch || !user) {
    return false;
  }

  /* ===============================================
     ADMIN
     Can manage attendance for every batch
  =============================================== */

  if (user.role === "ADMIN") {
    return true;
  }

  /* ===============================================
     ONLY TEACHERS
  =============================================== */

  if (user.role !== "TEACHER") {
    return false;
  }

  const teacherId =
    user._id.toString();

  /* ===============================================
     MAIN EDUCATOR ACCESS
  =============================================== */

  const educatorId =
    batch.educator?._id?.toString() ||
    batch.educator?.toString();

  if (educatorId === teacherId) {
    return true;
  }

  /* ===============================================
     ATTENDANCE TEACHER ACCESS
  =============================================== */

  const attendanceTeachers =
    batch.attendanceTeachers || [];

  return attendanceTeachers.some(
    (teacher) => {
      const id =
        teacher?._id?.toString() ||
        teacher?.toString();

      return id === teacherId;
    }
  );
};

/* =====================================================
   GET EDITABLE UNTIL
===================================================== */

const getEditableUntil = (markedAt) => {
  if (!markedAt) {
    return null;
  }

  return new Date(
    new Date(markedAt).getTime() +
      ATTENDANCE_EDIT_HOURS *
        60 *
        60 *
        1000
  );
};

/* =====================================================
   GET ATTENDANCE EDIT META
===================================================== */

const getAttendanceEditMeta = (
  attendanceRecords,
  req
) => {
  if (!attendanceRecords.length) {
    return {
      isMarked: false,
      markedBy: null,
      markedAt: null,
      editableUntil: null,
      isOwner: false,
      isLocked: false,
      canEdit: true,
    };
  }

  const firstRecord =
    attendanceRecords[0];

  const currentUserId =
    req.user._id.toString();

  const isAdmin =
    req.user.role === "ADMIN";

  const markedById =
    firstRecord.markedBy?._id
      ? firstRecord.markedBy._id.toString()
      : firstRecord.markedBy?.toString();

  const isOwner =
    markedById === currentUserId;

  const markedAt =
    firstRecord.markedAt ||
    firstRecord.createdAt ||
    null;

  const editableUntil =
    getEditableUntil(markedAt);

  const isLocked =
    editableUntil
      ? new Date() >= editableUntil
      : false;



  /* ADMIN CAN ALWAYS EDIT */

 let canEdit = false;

/* ADMIN CAN ALWAYS EDIT */
if (isAdmin) {
  canEdit = true;
}

/* ANY ASSIGNED TEACHER CAN EDIT WITHIN 96 HOURS */
else if (!isLocked) {
  canEdit = true;
}

  return {
    isMarked: true,

    markedBy:
      firstRecord.markedBy
        ? {
            _id:
              firstRecord.markedBy._id,

            name:
              firstRecord.markedBy.name,

            role:
              firstRecord.markedBy.role,
          }
        : null,

    markedAt,

    editableUntil,

    isOwner,

    isLocked,

    canEdit,
  };
};

/* =====================================================
   ADMIN - GET ATTENDANCE DATA
===================================================== */


const getAttendance = async (req, res) => {
  try {
    const { batchId, batchTiming, date, search } = req.query;

    if (search !== undefined && typeof search !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search must be a string",
      });
    }

    const filter = {};

    if (date) {
      const dateRange = getDateRange(date);

      if (!dateRange) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }

      filter.date = {
        $gte: dateRange.start,
        $lt: dateRange.end,
      };
    }

    if (batchId || batchTiming) {
      const validation = await getValidBatch(
        batchId,
        batchTiming,
        false
      );

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      filter.batchId = validation.batch._id;
    }

    // Only currently active students with an assigned batch.
    const studentFilter = {
      role: "STUDENT",
      isActive: true,
      batchId: { $exists: true, $ne: null },
    };

    if (filter.batchId) {
      studentFilter.batchId = filter.batchId;
    }

    const activeStudents = await User.find(studentFilter)
  .select("_id name email phone avatar batchId batchTiming")
  .lean();

    if (!activeStudents.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        records: [],
      });
    }

    const currentBatchMap = new Map(
      activeStudents.map((student) => [
        student._id.toString(),
        student.batchId.toString(),
      ])
    );

    const attendanceRecords = await Attendance.find({
      ...filter,
      studentId: {
        $in: activeStudents.map((student) => student._id),
      },
    })
      .populate({
        path: "studentId",
        select: "name email phone avatar batchId batchTiming",
        populate: {
          path: "batchId",
          select: "name code batchTiming startTime endTime",
        },
      })
      .populate({
        path: "batchId",
        select: "name code batchTiming startTime endTime",
      })
      .populate("markedBy", "name role")
      .sort({
        date: -1,
        markedAt: -1,
        createdAt: -1,
      })
      .lean();

    // Ignore attendance belonging to an old batch.
    // Keep only the current batch record of each active student.
    const uniqueRecords = new Map();

    for (const record of attendanceRecords) {
      if (!record.studentId || !record.batchId) continue;

      const studentId = record.studentId._id.toString();
      const attendanceBatchId = record.batchId._id.toString();
      const currentBatchId = currentBatchMap.get(studentId);

      if (!currentBatchId || currentBatchId !== attendanceBatchId) {
        continue;
      }

      if (uniqueRecords.has(studentId)) {
        continue;
      }

      uniqueRecords.set(studentId, record);
    }

    let filteredRecords = Array.from(uniqueRecords.values());

    if (search?.trim()) {
      const searchValue = search.trim().toLowerCase();

      filteredRecords = filteredRecords.filter((record) => {
        const name = record.studentId?.name || "";
        const email = record.studentId?.email || "";

        return (
          name.toLowerCase().includes(searchValue) ||
          email.toLowerCase().includes(searchValue)
        );
      });
    }

    const recordsByStudent = new Map();

const formattedRecords = filteredRecords.map((record) => {
  const batch = record.batchId || record.studentId?.batchId || null;

  const formatted = {
    _id: record._id,

    student: record.studentId
      ? {
          _id: record.studentId._id,
          name: record.studentId.name,
          email: record.studentId.email,
          phone: record.studentId.phone,
          avatar: record.studentId.avatar || "",
        }
      : null,

    batch: batch
      ? {
          _id: batch._id,
          name: batch.name || "",
          code: batch.code || "",
          batchTiming: batch.batchTiming || "",
          displayTiming: formatBatchTiming(batch),
        }
      : null,

    batchId: batch?._id || null,
    batchTiming: batch?.batchTiming || record.batchTiming || "",
    date: record.date,
    status: record.status,
    markedAt: record.markedAt || record.createdAt || null,

    markedBy: record.markedBy
      ? {
          _id: record.markedBy._id,
          name: record.markedBy.name,
          role: record.markedBy.role,
        }
      : null,
  };

  if (formatted.student?._id) {
    recordsByStudent.set(
      formatted.student._id.toString(),
      formatted
    );
  }

  return formatted;
});

// Include complete active student roster
const batchIds = [
  ...new Set(
    activeStudents
      .map((student) => student.batchId?.toString())
      .filter(Boolean)
  ),
];

const batches = await Batch.find({
  _id: { $in: batchIds },
})
  .select("name code batchTiming startTime endTime")
  .lean();

const batchMap = new Map(
  batches.map((batch) => [
    batch._id.toString(),
    batch,
  ])
);

let records = activeStudents.map((student) => {
  const studentId = student._id.toString();

  const existing = recordsByStudent.get(studentId);

  if (existing) return existing;

  const batchId = student.batchId?.toString();
  const batch = batchMap.get(batchId) || null;

  return {
    _id: `unmarked-${studentId}`,

    student: {
      _id: student._id,
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      avatar: student.avatar || "",
    },

    batch: batch
      ? {
          _id: batch._id,
          name: batch.name || "",
          code: batch.code || "",
          batchTiming: batch.batchTiming || student.batchTiming || "",
          displayTiming: formatBatchTiming(batch),
        }
      : {
          _id: student.batchId,
          name: "",
          code: "",
          batchTiming: student.batchTiming || "",
          displayTiming: student.batchTiming || "",
        },

    batchId: student.batchId,
    batchTiming: student.batchTiming || batch?.batchTiming || "",
    date: date ? getDateRange(date).start : new Date(),
    status: "NOT_MARKED",
    markedAt: null,
    markedBy: null,
  };
});

if (search?.trim()) {
  const searchValue = search.trim().toLowerCase();

  records = records.filter((record) => {
    const name = record.student?.name || "";
    const email = record.student?.email || "";

    return (
      name.toLowerCase().includes(searchValue) ||
      email.toLowerCase().includes(searchValue)
    );
  });
}

    return res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("Get Attendance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching attendance",
    });
  }
};


/* =====================================================
   ADMIN - GET ATTENDANCE STATS
===================================================== */


const getAttendanceStats = async (req, res) => {
  try {
    const { date, batchId } = req.query;

    if (batchId && !isValidObjectId(batchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
    }

    const dateRange = getDateRange(date || new Date());

    if (!dateRange) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Count only active students with an assigned current batch.
    const studentFilter = {
      role: "STUDENT",
      isActive: true,
      batchId: { $exists: true, $ne: null },
    };

    if (batchId) {
      studentFilter.batchId = batchId;
    }

    const activeStudents = await User.find(studentFilter)
      .select("_id batchId")
      .lean();

    const totalStudents = activeStudents.length;

    if (!totalStudents) {
      return res.status(200).json({
        success: true,
        stats: {
          totalStudents: 0,
          presentToday: 0,
          absentToday: 0,
          leaveToday: 0,
          unmarkedStudents: 0,
          averageAttendance: 0,
        },
      });
    }

    const currentBatchMap = new Map(
      activeStudents.map((student) => [
        student._id.toString(),
        student.batchId.toString(),
      ])
    );

    const dateFilter = {
      date: {
        $gte: dateRange.start,
        $lt: dateRange.end,
      },
      studentId: {
        $in: activeStudents.map((student) => student._id),
      },
    };

    if (batchId) {
      dateFilter.batchId = batchId;
    }

    const attendanceRecords = await Attendance.find(dateFilter)
      .select("studentId batchId status markedAt createdAt")
      .sort({
        markedAt: -1,
        createdAt: -1,
      })
      .lean();

    // One attendance record per active student, for their current batch.
    const uniqueAttendance = new Map();

    for (const record of attendanceRecords) {
      if (!record.studentId || !record.batchId) continue;

      const studentId = record.studentId.toString();
      const attendanceBatchId = record.batchId.toString();
      const currentBatchId = currentBatchMap.get(studentId);

      if (!currentBatchId || currentBatchId !== attendanceBatchId) {
        continue;
      }

      if (!uniqueAttendance.has(studentId)) {
        uniqueAttendance.set(studentId, record);
      }
    }

    let presentToday = 0;
    let absentToday = 0;
    let leaveToday = 0;

    for (const record of uniqueAttendance.values()) {
      if (record.status === "PRESENT") {
        presentToday++;
      } else if (record.status === "ABSENT") {
        absentToday++;
      } else if (record.status === "LEAVE") {
        leaveToday++;
      }
    }

    const totalRecords = uniqueAttendance.size;

    // Leave counts as absent for attendance percentage.
    const eligibleRecords =
      presentToday + absentToday + leaveToday;

    const averageAttendance =
      eligibleRecords > 0
        ? Math.round((presentToday / eligibleRecords) * 100)
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        presentToday,
        absentToday,
        leaveToday,
        unmarkedStudents: Math.max(
          totalStudents - totalRecords,
          0
        ),
        averageAttendance,
      },
    });
  } catch (error) {
    console.error("Attendance Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching attendance stats",
    });
  }
};


/* =====================================================
   TEACHER - GET MY ASSIGNED BATCHES
===================================================== */

/* =====================================================
   ADMIN / TEACHER - GET ACCESSIBLE BATCHES

   ADMIN:
   Can see all active batches

   TEACHER:
   Can only see batches where teacher exists
   in attendanceTeachers array
===================================================== */

const getMyBatches = async (
  req,
  res
) => {
  try {
    let filter = {};

    /* ===============================================
       TEACHER:
       ONLY ASSIGNED ATTENDANCE BATCHES
    =============================================== */

    if (req.user.role === "TEACHER") {
  filter.$or = [
    {
      educator: req.user._id,
    },
    {
      attendanceTeachers:
        req.user._id,
    },
  ];
}

    /* ===============================================
       ADMIN:
       NO EXTRA FILTER
       → ALL ACTIVE BATCHES
    =============================================== */

    const batches =
      await Batch.find(filter)
        .select(
          `
          name
          code
          batchTiming
          startTime
          endTime
          classDays
          attendanceTeachers
          status
          `
        )
        .sort({
          startTime: 1,
          name: 1,
        })
        .lean();

    /* ===============================================
       FORMAT RESPONSE
    =============================================== */

    const formattedBatches =
      batches.map(
        (batch) => ({
          _id: batch._id,

          name:
            batch.name || "",

          code:
            batch.code || "",

          batchTiming:
            batch.batchTiming || "",

          displayTiming:
            formatBatchTiming(batch),

          startTime:
            batch.startTime || "",

          endTime:
            batch.endTime || "",

          classDays:
            batch.classDays || [],

          status:
            batch.status || "ACTIVE",
        })
      );

    return res.status(200).json({
      success: true,

      count:
        formattedBatches.length,

      batches:
        formattedBatches,

      batchTimings:
        formattedBatches.map(
          (batch) =>
            batch.batchTiming
        ),
    });

  } catch (error) {
    console.error(
      "Get My Batches Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch attendance batches",
    });
  }
};

/* =====================================================
   TEACHER - GET STUDENTS FOR ATTENDANCE
===================================================== */

const getStudentsForAttendance =
  async (req, res) => {
    try {
      const {
        batchId,
        batchTiming,
        date,
      } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date is required",
        });
      }

      const dateRange =
        getDateRange(date);

      if (!dateRange) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid date format",
        });
      }

      /* RESOLVE BATCH */

      const batchValidation =
        await getValidBatch(
          batchId,
          batchTiming,
          false
        );

      if (!batchValidation.success) {
        return res.status(400).json({
          success: false,
          message:
            batchValidation.message,
        });
      }

      const selectedBatch =
        batchValidation.batch;

      /* CHECK ACCESS */

      const hasAccess =
        canManageBatchAttendance(
          selectedBatch,
          req.user
        );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message:
            "You are not assigned to manage attendance for this batch",
        });
      }

      /* GET STUDENTS */

      const students =
        await User.find({
          role: "STUDENT",
          batchId: selectedBatch._id,
          isActive: true,
        })
          .select(
            "name email phone avatar batchId batchTiming"
          )
          .sort({
            name: 1,
          })
          .lean();

      /* GET ATTENDANCE RECORDS */

      const attendanceRecords =
        await Attendance.find({
          batchId:
            selectedBatch._id,

          date: {
            $gte:
              dateRange.start,

            $lt:
              dateRange.end,
          },
        })
          .select(
            "studentId status markedBy markedAt createdAt"
          )
          .populate(
            "markedBy",
            "name role"
          )
          .sort({
            markedAt: 1,
            createdAt: 1,
          })
          .lean();

      /* ATTENDANCE MAP */

      const attendanceMap =
        new Map();

      attendanceRecords.forEach(
        (record) => {
          attendanceMap.set(
            record.studentId.toString(),
            record.status
          );
        }
      );

      /* EDIT META */

      const attendanceMeta =
        getAttendanceEditMeta(
          attendanceRecords,
          req
        );
// APPROVED LEAVE DATE CHECK
const approvedLeaves = await LeaveRequest.find({
  batchId: selectedBatch._id,
  status: "APPROVED",
  attendanceMarkedDates: {
    $gte: dateRange.start,
    $lt: dateRange.end,
  },
  studentId: {
    $in: students.map((student) => student._id),
  },
})
  .select("studentId")
  .lean();

const approvedLeaveStudentIds = new Set(
  approvedLeaves.map((leave) =>
    leave.studentId.toString()
  )
);
      /* FORMAT STUDENTS */
const formattedStudents = students.map((student) => {
  const studentId = student._id.toString();

  return {
    ...student,

    batchTiming: selectedBatch.batchTiming || "",

    attendanceStatus:
      attendanceMap.get(studentId) || null,

    isApprovedLeave:
      approvedLeaveStudentIds.has(studentId),
  };
});

      return res.status(200).json({
        success: true,

        attendanceMeta,

        batch: {
          _id:
            selectedBatch._id,

          name:
            selectedBatch.name || "",

          code:
            selectedBatch.code || "",

          batchTiming:
            selectedBatch.batchTiming ||
            "",

          displayTiming:
            formatBatchTiming(
              selectedBatch
            ),
        },

        count:
          formattedStudents.length,

        students:
          formattedStudents,
      });

    } catch (error) {
      console.error(
        "Get Attendance Students Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch students",
      });
    }
  };

/* =====================================================
   MARK BULK ATTENDANCE

   RULES:

   1. Admin can mark/edit anytime
   2. Only assigned teachers can mark attendance
   3. First teacher becomes attendance owner
   4. Original teacher can edit within 12 hours
   5. Other teachers cannot edit
===================================================== */

const markAttendance =
  async (req, res) => {
    try {
      const {
        batchId,
        batchTiming,
        date,
        attendance,
        studentId,
        status,
      } = req.body;

      /* DATE VALIDATION */

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date is required",
        });
      }

      const dateRange =
        getDateRange(date);

      if (!dateRange) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid date format",
        });
      }

      /* RESOLVE BATCH */

      const batchValidation =
        await getValidBatch(
          batchId,
          batchTiming
        );

      if (!batchValidation.success) {
        return res.status(400).json({
          success: false,
          message:
            batchValidation.message,
        });
      }

      const selectedBatch =
        batchValidation.batch;

      /* CHECK ACCESS */

      const hasAccess =
        canManageBatchAttendance(
          selectedBatch,
          req.user
        );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message:
            "You are not assigned to mark attendance for this batch",
        });
      }

      /* LEGACY SINGLE ATTENDANCE */

      let attendanceData =
        attendance;

      if (
        !Array.isArray(
          attendanceData
        ) &&
        studentId &&
        status
      ) {
        attendanceData = [
          {
            studentId,
            status,
          },
        ];
      }

      if (
        !Array.isArray(
          attendanceData
        ) ||
        attendanceData.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Attendance data is required",
        });
      }

      /* NORMALIZE */

      const normalizedAttendance =
        attendanceData.map(
          (item) => ({
            studentId:
              item.studentId,

            status:
              item.status?.toUpperCase(),
          })
        );

      /* DUPLICATE VALIDATION */

      const uniqueStudentIds =
        new Set(
          normalizedAttendance.map(
            (item) =>
              item.studentId?.toString()
          )
        );

      if (
        uniqueStudentIds.size !==
        normalizedAttendance.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Duplicate student attendance records are not allowed",
        });
      }

      /* RECORD VALIDATION */

      const invalidRecord =
        normalizedAttendance.find(
          (item) =>
            !item.studentId ||
            !isValidObjectId(
              item.studentId
            ) ||
           ![
  "PRESENT",
  "ABSENT",
  "LEAVE",
].includes(item.status)
        );

      if (invalidRecord) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid attendance record",
        });
      }

      const studentIds =
        normalizedAttendance.map(
          (item) =>
            item.studentId
        );

      /* VERIFY STUDENTS */

      const students =
        await User.find({
          _id: {
            $in: studentIds,
          },

          role: "STUDENT",

          batchId:
            selectedBatch._id,

          isActive: true,
        })
          .select("_id")
          .lean();

      if (
        students.length !==
        normalizedAttendance.length
      ) {
        return res.status(403).json({
          success: false,
          message:
            "One or more students do not belong to this batch",
        });

      }
      // PREVENT TEACHERS FROM CHANGING APPROVED LEAVES
if (req.user.role === "TEACHER") {
  const approvedLeaves = await LeaveRequest.find({
    batchId: selectedBatch._id,
    status: "APPROVED",
    attendanceMarkedDates: {
      $gte: dateRange.start,
      $lt: dateRange.end,
    },
    studentId: {
      $in: studentIds,
    },
  })
    .select("studentId")
    .lean();

  const protectedStudentIds = new Set(
    approvedLeaves.map((leave) =>
      leave.studentId.toString()
    )
  );

  const invalidChange = normalizedAttendance.some(
    (item) =>
      protectedStudentIds.has(item.studentId.toString()) &&
      item.status !== "LEAVE"
  );

  if (invalidChange) {
    return res.status(403).json({
      success: false,
      message:
        "Approved leave cannot be changed by teachers. Only admin can edit it.",
    });
  }

  const manualLeave = normalizedAttendance.some(
    (item) => item.status === "LEAVE"
  );

  if (manualLeave) {
    const approvedIds = new Set(
      approvedLeaves.map((leave) =>
        leave.studentId.toString()
      )
    );

    const unauthorizedLeave = normalizedAttendance.some(
      (item) =>
        item.status === "LEAVE" &&
        !approvedIds.has(item.studentId.toString())
    );

    if (unauthorizedLeave) {
      return res.status(403).json({
        success: false,
        message:
          "Teachers cannot manually mark leave. Leave must be approved by admin.",
      });
    }
  }
}
      const totalActiveStudents =
  await User.countDocuments({
    role: "STUDENT",
    batchId: selectedBatch._id,
    isActive: true,
  });

if (
  normalizedAttendance.length !==
  totalActiveStudents
) {
  return res.status(400).json({
    success: false,
    message:
      `Attendance must be submitted for all ${totalActiveStudents} active students`,
  });
}

      /* ===============================================
         CHECK EXISTING ATTENDANCE
      =============================================== */

    const existingAttendance =
  await Attendance.find({
    batchId: selectedBatch._id,
    status: {
      $in: ["PRESENT", "ABSENT", "LEAVE"],
    },
    date: {
      $gte: dateRange.start,
      $lt: dateRange.end,
    },
  })
          .select(
            "markedBy markedAt createdAt"
          )
          .sort({
            markedAt: 1,
            createdAt: 1,
          })
          .lean();

      

      /* ===============================================
         CHECK OWNERSHIP + LOCK
      =============================================== */

      /* ===============================================
   CHECK ATTENDANCE EDIT WINDOW
   Admin can edit anytime.
   Assigned teachers can edit within 96 hours.
=============================================== */

const isAdmin = req.user.role === "ADMIN";

if (existingAttendance.length > 0 && !isAdmin) {
  const originalRecord = existingAttendance[0];

  const originalMarkedAt =
    originalRecord.markedAt || originalRecord.createdAt;

  const editableUntil = getEditableUntil(originalMarkedAt);

  if (editableUntil && new Date() >= editableUntil) {
    return res.status(403).json({
      success: false,
      message:
        "Attendance editing time has expired. Teachers can edit attendance within 4 days.",
    });
  }
}
      /* ===============================================
         BULK UPSERT
      =============================================== */

      const markTime =
        new Date();

    const operations = normalizedAttendance.map((item) => {
  return {
    updateOne: {
      filter: {
        studentId: item.studentId,
        batchId: selectedBatch._id,
        date: dateRange.start,
      },

      update: {
        $set: {
          studentId: item.studentId,
          batchId: selectedBatch._id,
          batchTiming: selectedBatch.batchTiming || "",
          date: dateRange.start,
          status: item.status,
        },

        $setOnInsert: {
          markedBy: req.user._id,
          markedAt: markTime,
        },
      },

      upsert: true,
    },
  };
});

      const result =
        await Attendance.bulkWrite(
          operations
        );

      /* EDIT TIME */

      const baseMarkedAt =
        existingAttendance.length > 0
          ? (
              existingAttendance[0]
                .markedAt ||
              existingAttendance[0]
                .createdAt
            )
          : markTime;

      const editableUntil =
        getEditableUntil(
          baseMarkedAt
        );

      return res.status(200).json({
        success: true,

        message:
          existingAttendance.length > 0
            ? "Attendance updated successfully"
            : "Attendance marked successfully",

        result: {
          matched:
            result.matchedCount || 0,

          modified:
            result.modifiedCount || 0,

          upserted:
            result.upsertedCount || 0,
        },

        markedAt:
          baseMarkedAt,

        editableUntil,
      });

    } catch (error) {
      console.error(
        "Mark Attendance Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to save attendance",
      });
    }
  };

/* =====================================================
   STUDENT - GET OWN ATTENDANCE
===================================================== */
/* =====================================================
   STUDENT - GET OWN ATTENDANCE
===================================================== */

const getMyAttendance = async (req, res) => {
  try {
    /* =================================================
       GET STUDENT WITH ASSIGNED BATCH

       Important:
       Batch information should come from student's
       canonical batchId, NOT attendance records.
    ================================================= */

    const student = await User.findById(req.user._id)
      .select(
        "name email batchId batchTiming courseId teacherId"
      )
      .populate({
        path: "batchId",
        select:
          "name code batchTiming startTime endTime status",
      })
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    /* =================================================
       GET STUDENT ATTENDANCE
    ================================================= */

    const attendanceRecords = await Attendance.find({
      studentId: req.user._id,
    })
      .populate({
        path: "batchId",
        select:
          "name code batchTiming startTime endTime",
      })
      .sort({
        date: -1,
      })
      .lean();

    /* =================================================
       ATTENDANCE STATS
    ================================================= */



   const presentClasses = attendanceRecords.filter(
  (record) => record.status === "PRESENT"
).length;

const absentClasses = attendanceRecords.filter(
  (record) => record.status === "ABSENT"
).length;

const leaveClasses = attendanceRecords.filter(
  (record) => record.status === "LEAVE"
).length;


// Leave is counted as a missed class for attendance percentage.
const totalClasses =
  presentClasses + absentClasses + leaveClasses;

const attendancePercentage =
  totalClasses > 0
    ? Math.round((presentClasses / totalClasses) * 100)
    : 0;

    /* =================================================
       FORMAT STUDENT BATCH
    ================================================= */

    const assignedBatch = student.batchId
      ? {
          _id: student.batchId._id,

          name: student.batchId.name || "",

          code: student.batchId.code || "",

          batchTiming:
            student.batchId.batchTiming || "",

          startTime:
            student.batchId.startTime || "",

          endTime:
            student.batchId.endTime || "",

          displayTiming: formatBatchTiming(
            student.batchId
          ),

          status:
            student.batchId.status || "",
        }
      : null;

    /* =================================================
       FORMAT ATTENDANCE RECORDS
    ================================================= */

    const formattedAttendance =
      attendanceRecords.map((record) => ({
        ...record,

        batch: record.batchId
          ? {
              _id: record.batchId._id,

              name:
                record.batchId.name || "",

              code:
                record.batchId.code || "",

              batchTiming:
                record.batchId.batchTiming || "",

              displayTiming:
                formatBatchTiming(
                  record.batchId
                ),
            }
          : null,
      }));

    /* =================================================
       RESPONSE
    ================================================= */

    return res.status(200).json({
      success: true,

      /* STUDENT INFORMATION */

      student: {
        _id: student._id,

        name: student.name || "",

        email: student.email || "",

        batchTiming:
          student.batchTiming || "",

        courseId:
          student.courseId || null,

        teacherId:
          student.teacherId || null,
      },

      /* CANONICAL BATCH INFORMATION */

      batch: assignedBatch,

      /* ATTENDANCE STATISTICS */

      stats: {
        totalClasses,

        presentClasses,

        absentClasses,
          leaveClasses,

        attendancePercentage,

        requiredAttendance: 90,
      },

      /* ATTENDANCE HISTORY */

      attendance: formattedAttendance,
    });
  } catch (error) {
    console.error(
      "Get My Attendance Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch attendance",
    });
  }
};

/* =====================================================
   ADMIN / TEACHER - GET ATTENDANCE REPORT

   DATE RANGE + BATCH WISE

   ADMIN:
   Can access every batch

   TEACHER:
   Can access only assigned batches
===================================================== */

const getAttendanceReport =
  async (req, res) => {
    try {
      const {
        batchId,
        batchTiming,
        startDate,
        endDate,
      } = req.query;

      /* VALIDATE DATES */

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message:
            "Start date and end date are required",
        });
      }

      const start =
        new Date(startDate);

      const end =
        new Date(endDate);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid date format",
        });
      }

      start.setHours(
        0,
        0,
        0,
        0
      );

      end.setHours(
        23,
        59,
        59,
        999
      );

      if (start > end) {
        return res.status(400).json({
          success: false,
          message:
            "Start date cannot be greater than end date",
        });
      }

      /* RESOLVE BATCH */

      const batchValidation =
        await getValidBatch(
          batchId,
          batchTiming,
          false
        );

      if (!batchValidation.success) {
        return res.status(400).json({
          success: false,
          message:
            batchValidation.message,
        });
      }

      const batch =
        batchValidation.batch;

      /* CHECK ACCESS */

      const hasAccess =
        canManageBatchAttendance(
          batch,
          req.user
        );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to view attendance for this batch",
        });
      }

      /* GET ALL ACTIVE STUDENTS */

      const students =
        await User.find({
          role: "STUDENT",
          batchId: batch._id,
          isActive: true,
        })
          .select(
            "name email phone avatar"
          )
          .sort({
            name: 1,
          })
          .lean();

      /* GET ATTENDANCE RECORDS */

      const attendanceRecords =
        await Attendance.find({
          batchId:
            batch._id,

          date: {
            $gte: start,
            $lte: end,
          },
        })
          .select(
            "studentId status date"
          )
          .lean();

      /* UNIQUE CLASS DAYS */

      const uniqueClassDates =
        new Set();

      attendanceRecords.forEach(
        (record) => {
          if (record.date) {
            const recordDate = new Date(record.date);

const dateKey =
  `${recordDate.getFullYear()}-${String(
    recordDate.getMonth() + 1
  ).padStart(2, "0")}-${String(
    recordDate.getDate()
  ).padStart(2, "0")}`;

            uniqueClassDates.add(
              dateKey
            );
          }
        }
      );

      const totalClasses =
        uniqueClassDates.size;

      /* STUDENT ATTENDANCE MAP */

      const attendanceMap =
        new Map();

      attendanceRecords.forEach(
        (record) => {
          const studentId =
            record.studentId.toString();

          if (
            !attendanceMap.has(
              studentId
            )
          ) {
          attendanceMap.set(
  studentId,
  {
    present: 0,
    absent: 0,
    leave: 0,
    total: 0,
  }
);
          }

          const studentStats =
            attendanceMap.get(
              studentId
            );

          studentStats.total += 1;

          if (
            record.status === "PRESENT"
          ) {
            studentStats.present += 1;
          }

          if (
            record.status === "ABSENT"
          ) {
            studentStats.absent += 1;
          }
          if (
  record.status === "LEAVE"
) {
  studentStats.leave += 1;
}
        }
      );

      /* CREATE STUDENT REPORT */

      const studentReports =
        students.map(
          (student) => {
           const stats =
  attendanceMap.get(
    student._id.toString()
  ) || {
    present: 0,
    absent: 0,
    leave: 0,
    total: 0,
  };

     const eligibleClasses =
  stats.present + stats.absent + (stats.leave || 0);

const percentage =
  eligibleClasses > 0
    ? Number(
        (
          (stats.present / eligibleClasses) *
          100
        ).toFixed(2)
      )
    : 0;

            return {
              student: {
                _id:
                  student._id,

                name:
                  student.name,

                email:
                  student.email,

                phone:
                  student.phone,

                avatar:
                  student.avatar,
              },

              totalClasses,

              present:
                stats.present,

              absent:
                stats.absent,
                leave:
  stats.leave || 0,

              percentage,
            };
          }
        );

      /* SORT BY ATTENDANCE */

      studentReports.sort(
        (a, b) => {
          if (
            b.percentage !==
            a.percentage
          ) {
            return (
              b.percentage -
              a.percentage
            );
          }

          return a.student.name.localeCompare(
            b.student.name
          );
        }
      );

      /* REPORT SUMMARY */

      const totalStudents =
        studentReports.length;

      const students100 =
        studentReports.filter(
          (student) =>
            student.percentage === 100
        ).length;

      const students90Plus =
        studentReports.filter(
          (student) =>
            student.percentage >= 90
        ).length;

     const below90 =
  studentReports.filter(
    (student) =>
      student.percentage < 90
  ).length;

     // Total Present Classes
const totalPresent =
  studentReports.reduce(
    (sum, student) =>
      sum + student.present,
    0
  );

// Total Eligible Classes (Present + Absent)
// Total Eligible Classes (Present + Absent + Leave)
const totalEligibleAttendance =
  studentReports.reduce(
    (sum, student) =>
      sum +
      student.present +
      student.absent +
      (student.leave || 0),
    0
  );

// Batch Average Attendance
const batchAverageAttendance =
  totalEligibleAttendance > 0
    ? Number(
        (
          (totalPresent /
            totalEligibleAttendance) *
          100
        ).toFixed(2)
      )
    : 0;
      /* RESPONSE */

      return res.status(200).json({
        success: true,

        report: {
          batch: {
            _id: batch._id,

            name:
              batch.name || "",

            code:
              batch.code || "",

            batchTiming:
              batch.batchTiming || "",

            displayTiming:
              formatBatchTiming(batch),
          },

          dateRange: {
            startDate: start,
            endDate: end,
          },

          summary: {
            totalStudents,
            totalClasses,
            totalPresent,
            students100,
          students90Plus,
below90,
            batchAverageAttendance,
          },

          students:
            studentReports,
        },
      });

    } catch (error) {
      console.error(
        "Get Attendance Report Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to generate attendance report",
      });
    }
  };

/* =====================================================
   ADMIN - EXPORT ATTENDANCE BY DATE RANGE
===================================================== */

const exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate, batchId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const startRange = getDateRange(startDate);
    const endRange = getDateRange(endDate);

    if (!startRange || !endRange) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (startRange.start > endRange.start) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be greater than end date",
      });
    }

    const filter = {
      date: {
        $gte: startRange.start,
        $lt: endRange.end,
      },
    };

    // Optional batch filter
    if (batchId && batchId !== "All") {
      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch ID",
        });
      }

      filter.batchId = batchId;
    }

    const records = await Attendance.find(filter)
      .populate("studentId", "name email")
      .populate(
        "batchId",
        "name code batchTiming startTime endTime"
      )
      .sort({ date: 1 })
      .lean();

    const exportRecords = records.map((record) => ({
      studentName: record.studentId?.name || "",
      email: record.studentId?.email || "",
      batchName: record.batchId?.name || "",
      batchTiming: record.batchId?.batchTiming || "",
      date: record.date,
      status: record.status,
    }));

    return res.status(200).json({
      success: true,
      totalRecords: exportRecords.length,
      records: exportRecords,
    });

  } catch (error) {
    console.error("Export Attendance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to export attendance",
    });
  }
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
  getAttendance,
  getAttendanceStats,
  getMyBatches,
  getStudentsForAttendance,
  markAttendance,
  getMyAttendance,
  getAttendanceReport,
    exportAttendance,
};