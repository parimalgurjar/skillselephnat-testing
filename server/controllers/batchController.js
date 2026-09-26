const Batch = require("../models/Batch");
const User = require("../models/User");
const mongoose = require("mongoose");
/* =====================================================
   HELPER - CANONICAL STUDENT COUNT

   PRIMARY:
   User.batchId -> Batch._id

   LEGACY FALLBACK:
   Only students without batchId can match batchTiming.
===================================================== */

const getStudentCountForBatch = async (
  batch,
  activeOnly = false
) => {
  const filter = {
    role: "STUDENT",

    $or: [
      {
        batchId: batch._id,
      },

      /*
        Legacy records only
      */
      {
        batchId: null,
        batchTiming: batch.batchTiming,
      },
    ],
  };

  if (activeOnly) {
    filter.isActive = true;
  }

  return User.countDocuments(filter);
};


/* =====================================================
   HELPER - VALIDATE ATTENDANCE TEACHERS
===================================================== */

const validateAttendanceTeachers = async (
  attendanceTeachers
) => {
  if (!Array.isArray(attendanceTeachers)) {
    return {
      success: false,
      message:
        "Attendance teachers must be an array",
    };
  }

  const uniqueTeacherIds = [
    ...new Set(
      attendanceTeachers
        .filter(Boolean)
        .map((id) => id.toString())
    ),
  ];
const invalidTeacherIds = uniqueTeacherIds.filter(
  (id) => !mongoose.isValidObjectId(id)
);

if (invalidTeacherIds.length > 0) {
  return {
    success: false,
    message: "One or more attendance teacher IDs are invalid",
  };
}
  /*
    Empty attendance teacher assignment
    is allowed.
  */

  if (uniqueTeacherIds.length === 0) {
    return {
      success: true,
      teacherIds: [],
    };
  }

  const teachers = await User.find({
    _id: {
      $in: uniqueTeacherIds,
    },

    role: "TEACHER",

    isActive: {
      $ne: false,
    },
  }).select("_id");

  if (
    teachers.length !==
    uniqueTeacherIds.length
  ) {
    return {
      success: false,
      message:
        "One or more selected attendance teachers are invalid",
    };
  }

  return {
    success: true,
    teacherIds: uniqueTeacherIds,
  };
};


/* =====================================================
   HELPER - NORMALIZE CLASS DAYS

   Supports:

   NEW FORMAT:
   ["MONDAY", "TUESDAY"]

   LEGACY FORMAT:
   "Monday - Friday"
   "Monday - Saturday"
   "Weekend Batch"

   This ensures old database values remain compatible
   with the new array-based schema.
===================================================== */

const normalizeClassDays = (classDays) => {
  if (!classDays) {
    return [];
  }

  const days = Array.isArray(classDays)
    ? classDays
    : [classDays];

  const validDays = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  const normalizedDays = [];

  days.forEach((day) => {
    if (!day) return;

    const value = String(day).trim();

    /* ================= LEGACY VALUES ================= */

    if (
      value.toLowerCase() ===
      "monday - friday"
    ) {
      normalizedDays.push(
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY"
      );

      return;
    }

    if (
      value.toLowerCase() ===
      "monday - saturday"
    ) {
      normalizedDays.push(
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY"
      );

      return;
    }

    if (
      value.toLowerCase() ===
      "weekend batch"
    ) {
      normalizedDays.push(
        "SATURDAY",
        "SUNDAY"
      );

      return;
    }

    /* ================= NEW FORMAT ================= */

    const upperValue =
      value.toUpperCase();

    if (
      validDays.includes(
        upperValue
      )
    ) {
      normalizedDays.push(
        upperValue
      );
    }
  });

  /*
    Remove duplicate values.
  */

  return [
    ...new Set(normalizedDays),
  ];
};


/* =====================================================
   GET ALL BATCHES
===================================================== */

const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate(
        "educator",
        "name email phone"
      )
      .populate(
        "attendanceTeachers",
        "name email phone role"
      )
      .sort({
        createdAt: -1,
      });

    const batchesWithStudents =
      await Promise.all(
        batches.map(async (batch) => {
          const batchData =
            batch.toObject();

          const studentCount =
            await getStudentCountForBatch(
              batch
            );

          return {
            ...batchData,

            students:
              studentCount,
          };
        })
      );

    return res.status(200).json({
      success: true,

      count:
        batchesWithStudents.length,

      batches:
        batchesWithStudents,
    });
  } catch (error) {
    console.error(
      "Get Batches Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* =====================================================
   PUBLIC GET ACTIVE BATCHES

   USED FOR STUDENT SIGNUP
===================================================== */

const getPublicBatches = async (
  req,
  res
) => {
  try {
    const batches =
      await Batch.find({
        status: "ACTIVE",
      })
        .select(
          `
          _id
          name
          code
          startTime
          endTime
          batchTiming
          capacity
          classDays
          `
        )
        .sort({
          startTime: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      batches,
    });
  } catch (error) {
    console.error(
      "Get Public Batches Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load batches",
    });
  }
};


/* =====================================================
   CREATE BATCH
===================================================== */

const createBatch = async (
  req,
  res
) => {
  try {
    const {
      name,
      code,
      educator,
      attendanceTeachers,
      capacity,
      startTime,
      endTime,
      batchTiming,
      classDays,
      startDate,
      status,
    } = req.body;

    /* ================= NORMALIZE CLASS DAYS ================= */

    const normalizedClassDays =
      normalizeClassDays(
        classDays
      );

    /* ================= VALIDATION ================= */

    if (
      !name ||
      !code ||
      !capacity ||
      !startTime ||
      !endTime ||
      normalizedClassDays.length === 0 ||
      !startDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please fill all required fields",
      });
    }

    /* ================= VALIDATE ATTENDANCE TEACHERS ================= */

    let validAttendanceTeachers = [];

    if (
      attendanceTeachers !== undefined
    ) {
      const validation =
        await validateAttendanceTeachers(
          attendanceTeachers
        );

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message:
            validation.message,
        });
      }

      validAttendanceTeachers =
        validation.teacherIds;
    }

    /* ================= BATCH TIMING ================= */

    const finalBatchTiming =
      batchTiming?.trim() ||
      `${startTime} - ${endTime}`;

    /* ================= DUPLICATE CODE ================= */

    const existingBatch =
      await Batch.findOne({
        code: code.trim().toUpperCase(),
      });

    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message:
          "Batch code already exists",
      });
    }

    /* ================= VALIDATE EDUCATOR ================= */
if (educator && !mongoose.isValidObjectId(educator)) {
  return res.status(400).json({
    success: false,
    message: "Invalid educator ID",
  });
}
    if (educator) {
      const teacher =
        await User.findOne({
          _id: educator,

          role: "TEACHER",

          isActive: {
            $ne: false,
          },
        });

      if (!teacher) {
        return res.status(400).json({
          success: false,
          message:
            "Selected educator is not valid",
        });
      }
    }

    /* ================= CREATE BATCH ================= */

    const batch =
      await Batch.create({
        name: name.trim(),

        code: code
          .trim()
          .toUpperCase(),

        educator:
          educator || null,

        attendanceTeachers:
          validAttendanceTeachers,

        capacity:
          Number(capacity),

        startTime,

        endTime,

        batchTiming:
          finalBatchTiming,

        /*
          Always save standardized
          weekday array.
        */
        classDays:
          normalizedClassDays,

        startDate,

        status:
          status || "ACTIVE",
      });

    /* ================= POPULATE ================= */

    const populatedBatch =
      await Batch.findById(
        batch._id
      )
        .populate(
          "educator",
          "name email phone"
        )
        .populate(
          "attendanceTeachers",
          "name email phone role"
        );

    return res.status(201).json({
      success: true,

      message:
        "Batch created successfully",

      batch: {
        ...populatedBatch.toObject(),

        students: 0,
      },
    });
  } catch (error) {
    console.error(
      "Create Batch Error:",
      error
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Batch code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* =====================================================
   UPDATE BATCH
===================================================== */

const updateBatch = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const batch =
      await Batch.findById(id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    /* =============================================
       VALIDATE ATTENDANCE TEACHERS
    ============================================= */

    let validatedAttendanceTeachers =
      null;

    if (
      req.body.attendanceTeachers !==
      undefined
    ) {
      const validation =
        await validateAttendanceTeachers(
          req.body.attendanceTeachers
        );

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message:
            validation.message,
        });
      }

      validatedAttendanceTeachers =
        validation.teacherIds;
    }

    /* ================= VALIDATE EDUCATOR ================= */

    if (
      req.body.educator !== undefined &&
      req.body.educator
    ) {
      const teacher =
        await User.findOne({
          _id:
            req.body.educator,

          role:
            "TEACHER",

          isActive: {
            $ne: false,
          },
        });

      if (!teacher) {
        return res.status(400).json({
          success: false,
          message:
            "Selected educator is not valid",
        });
      }
    }

    /* ================= CHECK DUPLICATE CODE ================= */

    if (
      req.body.code !== undefined &&
      req.body.code.trim().toUpperCase() !==
        batch.code
    ) {
      const existingCode =
        await Batch.findOne({
          code:
            req.body.code
              .trim()
              .toUpperCase(),

          _id: {
            $ne: batch._id,
          },
        });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message:
            "Batch code already exists",
        });
      }
    }

    /* ================= SAVE OLD TIMING ================= */

    const previousBatchTiming =
      batch.batchTiming;

    /* ================= FINAL TIME VALUES ================= */

    const updatedStartTime =
      req.body.startTime !== undefined
        ? req.body.startTime
        : batch.startTime;

    const updatedEndTime =
      req.body.endTime !== undefined
        ? req.body.endTime
        : batch.endTime;

    /*
      Use frontend generated AM/PM timing
      if provided.
    */

    const updatedBatchTiming =
      req.body.batchTiming?.trim() ||
      `${updatedStartTime} - ${updatedEndTime}`;

    /* ================= UPDATE NORMAL FIELDS ================= */

    const allowedFields = [
      "name",
      "code",
      "educator",
      "capacity",
      "startTime",
      "endTime",
      "startDate",
      "status",
    ];

    allowedFields.forEach(
      (field) => {
        if (
          req.body[field] !== undefined
        ) {
          if (
            field === "name"
          ) {
            batch[field] =
              req.body[field].trim();

          } else if (
            field === "code"
          ) {
            batch[field] =
              req.body[field]
                .trim()
                .toUpperCase();

          } else if (
            field === "capacity"
          ) {
            batch[field] =
              Number(req.body[field]);

          } else {
            batch[field] =
              req.body[field];
          }
        }
      }
    );

   

    if (
      req.body.classDays !==
      undefined
    ) {
      const normalizedClassDays =
        normalizeClassDays(
          req.body.classDays
        );

      if (
        normalizedClassDays.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select at least one class day",
        });
      }

      batch.classDays =
        normalizedClassDays;
    }

    /* ================= UPDATE ATTENDANCE TEACHERS ================= */

    if (
      validatedAttendanceTeachers !==
      null
    ) {
      batch.attendanceTeachers =
        validatedAttendanceTeachers;
    }

    /* ================= UPDATE TIMING ================= */

    batch.batchTiming =
      updatedBatchTiming;

    /* ================= SAVE ================= */

    await batch.save();

    /* =================================================
       SYNC STUDENTS USING CANONICAL batchId
    ================================================= */

    await User.updateMany(
      {
        role: "STUDENT",
        batchId: batch._id,
      },
      {
        $set: {
          batchTiming:
            updatedBatchTiming,
        },
      }
    );

    /* =================================================
       MIGRATE LEGACY STUDENTS
    ================================================= */

    if (
      previousBatchTiming &&
      previousBatchTiming !==
        updatedBatchTiming
    ) {
      await User.updateMany(
        {
          role: "STUDENT",

          batchId: null,

          batchTiming:
            previousBatchTiming,
        },
        {
          $set: {
            batchId:
              batch._id,

            batchTiming:
              updatedBatchTiming,
          },
        }
      );
    }

    /* ================= FETCH UPDATED BATCH ================= */

    const updatedBatch =
      await Batch.findById(
        batch._id
      )
        .populate(
          "educator",
          "name email phone"
        )
        .populate(
          "attendanceTeachers",
          "name email phone role"
        );

    /* ================= STUDENT COUNT ================= */

    const studentCount =
      await getStudentCountForBatch(
        updatedBatch
      );

    return res.status(200).json({
      success: true,

      message:
        "Batch updated successfully",

      batch: {
        ...updatedBatch.toObject(),

        students:
          studentCount,
      },
    });
  } catch (error) {
    console.error(
      "Update Batch Error:",
      error
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Batch code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* =====================================================
   DELETE BATCH
===================================================== */

const deleteBatch = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

if (!mongoose.isValidObjectId(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid batch ID",
  });
}

const batch = await Batch.findById(id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const assignedStudents =
      await getStudentCountForBatch(
        batch
      );

    if (assignedStudents > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete batch with assigned students",
      });
    }

    await Batch.findByIdAndDelete(
      id
    );

    return res.status(200).json({
      success: true,
      message:
        "Batch deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Batch Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* =====================================================
   GET BATCH STATS
===================================================== */

const getBatchStats = async (
  req,
  res
) => {
  try {
    const totalBatches =
      await Batch.countDocuments();

    const activeBatches =
      await Batch.countDocuments({
        status: "ACTIVE",
      });

    const totalStudents =
      await User.countDocuments({
        role: "STUDENT",
      });

    return res.status(200).json({
      success: true,

      stats: {
        totalBatches,
        activeBatches,
        totalStudents,
      },
    });
  } catch (error) {
    console.error(
      "Get Batch Stats Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* =====================================================
   GET BATCH BY TIMING

   LEGACY ENDPOINT
===================================================== */

const getBatchByTiming = async (
  req,
  res
) => {
  try {
    const {
      batchTiming,
    } = req.query;

    if (!batchTiming) {
      return res.status(400).json({
        success: false,
        message:
          "Batch timing is required",
      });
    }

    const batch =
      await Batch.findOne({
        batchTiming:
          batchTiming.trim(),
      })
        .populate(
          "educator",
          "name email phone"
        )
        .populate(
          "attendanceTeachers",
          "name email phone role"
        );

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const studentCount =
      await getStudentCountForBatch(
        batch,
        true
      );

    return res.status(200).json({
      success: true,

      batch: {
        ...batch.toObject(),
        studentCount,
      },
    });
  } catch (error) {
    console.error(
      "Get Batch By Timing Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch batch details",
    });
  }
};


/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
  getBatches,
  getPublicBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchStats,
  getBatchByTiming,
};

