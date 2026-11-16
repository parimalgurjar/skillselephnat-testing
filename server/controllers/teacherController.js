const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Task = require("../models/Task");
const Batch = require("../models/Batch");
const Doubt = require("../models/Doubt");
const DoubtMessage = require("../models/DoubtMessage");
const TaskReportSettings = require("../models/TaskReportSettings");
const StudentTaskProgress = require("../models/StudentTaskProgress");
const Announcement = require("../models/Announcement");
const StudentFee = require("../models/StudentFee");
/* =====================================================
   CREATE TEACHER
===================================================== */

const createTeacher = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      avatar,
      joiningDate,
      status,
      specializations,
    } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password must be valid",
      });
    }

    if (
      phone !== undefined &&
      phone !== null &&
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone must be a valid string",
      });
    }

    if (!Array.isArray(specializations)) {
      return res.status(400).json({
        success: false,
        message: "Specializations must be an array",
      });
    }

    const cleanedSpecializations = specializations
      .filter(
        (item) =>
          typeof item === "string" && item.trim() !== ""
      )
      .map((item) => item.trim());

    if (cleanedSpecializations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid specialization is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const teacherStatus = status || "ACTIVE";
    const isTeacherActive = teacherStatus === "ACTIVE";

    const teacher = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone?.trim() || "",
      role: "TEACHER",
      avatar: avatar?.trim() || "",
      specializations: cleanedSpecializations,
      joiningDate: joiningDate || null,
      status: teacherStatus,
      isActive: isTeacherActive,
    });

    return res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        role: teacher.role,
        avatar: teacher.avatar,
        specializations: teacher.specializations,
        joiningDate: teacher.joiningDate,
        status: teacher.status,
        isActive: teacher.isActive,
      },
    });
  } catch (error) {
    console.error("Create Teacher Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating teacher",
    });
  }
};

/* =====================================================
   GET ALL TEACHERS
===================================================== */

const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({
      role: "TEACHER",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error("Get Teachers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching teachers",
    });
  }
};

/* =====================================================
   GET SINGLE TEACHER
===================================================== */

const getTeacherById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    const teacher = await User.findOne({
      _id: req.params.id,
      role: "TEACHER",
    }).select("-password");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    return res.status(200).json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error("Get Teacher Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching teacher",
    });
  }
};
/* =====================================================
   COMMON TEACHER STUDENT METRICS
   Used by Dashboard + Students page
===================================================== */

const getTeacherStudentOverview = async (teacherId) => {

  const batches = await Batch.find({
    status: "ACTIVE",
    $or: [
      { educator: teacherId },
      { attendanceTeachers: teacherId },
    ],
  })
    .select("_id name code batchTiming startTime endTime status")
    .sort({ startTime: 1 })
    .lean();

  const batchIds = batches.map((batch) => batch._id);

  const batchTimings = [
    ...new Set(
      batches
        .map((batch) => batch.batchTiming?.trim())
        .filter(Boolean)
    ),
  ];

  const students = batchIds.length
    ? await User.find({
        role: "STUDENT",
        $or: [
          { batchId: { $in: batchIds } },
          {
            batchId: null,
            batchTiming: { $in: batchTimings },
          },
        ],
      })
        .select(
          "_id name email phone batchId batchTiming isActive status studentId"
        )
        .sort({ name: 1 })
        .lean()
    : [];

  const studentIds = students.map((student) => student._id);

  const [attendanceRecords, tasks] = await Promise.all([

    studentIds.length
      ? Attendance.find({
          studentId: { $in: studentIds },
        }).select("studentId status").lean()
      : [],

    batchIds.length
      ? Task.find({
          batchId: { $in: batchIds },
        }).select("submissions").lean()
      : [],
  ]);

  /* ATTENDANCE CALCULATION */

  /* ATTENDANCE CALCULATION */

  const attendanceMap = new Map();

  attendanceRecords.forEach((record) => {
    const id = String(record.studentId);

    if (!attendanceMap.has(id)) {
      attendanceMap.set(id, {
        present: 0,
        absent: 0,
        leave: 0,
      });
    }

    const item = attendanceMap.get(id);

    if (record.status === "PRESENT") {
      item.present += 1;
    } else if (record.status === "ABSENT") {
      item.absent += 1;
    } else if (record.status === "LEAVE") {
      item.leave += 1;
    }
  });

  /* PERFORMANCE CALCULATION */

  const performanceMap = new Map();

  tasks.forEach((task) => {

    (task.submissions || []).forEach((submission) => {

      if (
        submission.status !== "APPROVED" ||
        !Number.isFinite(Number(submission.score))
      ) {
        return;
      }

      const id = String(submission.studentId);

      if (!studentIds.some((studentId) => String(studentId) === id)) {
        return;
      }

      if (!performanceMap.has(id)) {
        performanceMap.set(id, {
          total: 0,
          count: 0,
        });
      }

      const item = performanceMap.get(id);

      item.total += Number(submission.score);
      item.count += 1;
    });
  });

  /* BATCH LOOKUP */

  const batchMap = new Map();

  batches.forEach((batch) => {
    batchMap.set(String(batch._id), batch);
  });

  const timingMap = new Map();

  batches.forEach((batch) => {
    if (batch.batchTiming) {
      timingMap.set(batch.batchTiming.trim(), batch);
    }
  });

  /* FINAL STUDENT DATA */

  const formattedStudents = students.map((student) => {

    const id = String(student._id);

    const attendance = attendanceMap.get(id);
    const performance = performanceMap.get(id);

    const batch =
      (student.batchId
        ? batchMap.get(String(student.batchId))
        : null) ||
      timingMap.get(student.batchTiming?.trim()) ||
      null;

    return {
      ...student,

          attendance:
        attendance &&
        (attendance.present + attendance.absent) > 0
          ? Math.round(
              (attendance.present /
                (attendance.present + attendance.absent)) * 100
            )
          : null,

      performance:
        performance?.count > 0
          ? Math.round(
              performance.total / performance.count
            )
          : null,

      batch: batch
        ? {
            _id: batch._id,
            name: batch.name,
            code: batch.code,
            startTime: batch.startTime,
            endTime: batch.endTime,
            batchTiming: batch.batchTiming,
            status: batch.status,
          }
        : null,

      batchId: batch?._id || student.batchId || null,

      batchTiming:
        batch?.batchTiming || student.batchTiming || "",
    };
  });

  /* COMMON STATISTICS */

  const activeStudents = formattedStudents.filter(
    (student) =>
      student.isActive === true &&
      student.status === "ACTIVE"
  ).length;

  const attendanceValues = formattedStudents
    .filter((student) => student.attendance !== null)
    .map((student) => student.attendance);

  const performanceValues = formattedStudents
    .filter((student) => student.performance !== null)
    .map((student) => student.performance);

  const average = (values) =>
    values.length
      ? Math.round(
          values.reduce((sum, value) => sum + value, 0) /
            values.length
        )
      : 0;

  return {
    batches,
    students: formattedStudents,

    stats: {
      totalStudents: formattedStudents.length,
      activeStudents,
      totalBatches: batches.length,
      avgAttendance: average(attendanceValues),
      performance: average(performanceValues),
    },
  };
};
/* =====================================================
   GET TEACHER DASHBOARD

   CANONICAL RELATION:
   Batch.educator -> Teacher
   Batch.attendanceTeachers -> Teachers
   Student.batchId -> Batch

   batchTiming is used only for legacy student records
   that do not have a batchId.
===================================================== */

const getTeacherDashboard = async (req, res) => {
  try {

    const teacherId = req.user._id || req.user.id;

    if (!mongoose.isValidObjectId(teacherId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid teacher session",
      });
    }

    const overview = await getTeacherStudentOverview(teacherId);

    const { batches, stats } = overview;

    /* ACTIVE TASKS */

    const activeTasks = await Task.countDocuments({
      createdBy: teacherId,
      status: "ACTIVE",
    });

    /* RECENT TASKS */

    const recentTaskDocuments = await Task.find({
      createdBy: teacherId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title batch batchId status submissions createdAt")
      .lean();

    const recentTasks = recentTaskDocuments.map((task) => ({
      _id: task._id,
      title: task.title,
      batch: task.batch || "",
      batchId: task.batchId || null,
      status: task.status,
      submissions: task.submissions?.length || 0,
      createdAt: task.createdAt,
    }));

    /* UPCOMING CLASSES */

    
const upcomingClasses = batches.map((batch, index) => ({
  id: index + 1,
  _id: batch._id,

  // Prefer the actual start and end time fields.
  time:
    batch.startTime && batch.endTime
      ? `${batch.startTime} - ${batch.endTime}`
      : batch.batchTiming || "",

  title: batch.name || "Scheduled Class",

  batch: batch.code || batch.name || "",

  status: "Active",
}));


    return res.status(200).json({
      success: true,

      dashboard: {
        ...stats,
        activeTasks,
        upcomingClasses,
        recentTasks,

        batches: batches.map((batch) => ({
          _id: batch._id,
          name: batch.name,
          code: batch.code,
          startTime: batch.startTime,
          endTime: batch.endTime,
          batchTiming: batch.batchTiming,
          status: batch.status,
        })),
      },
    });

  } catch (error) {

    console.error("Teacher Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard data",
    });
  }
};
/* =====================================================
   UPDATE TEACHER
===================================================== */

const updateTeacher = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    const {
      name,
      email,
      phone,
      avatar,
      joiningDate,
      status,
      specializations,
    } = req.body;

    const teacher = await User.findOne({
      _id: req.params.id,
      role: "TEACHER",
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    if (
      email !== undefined &&
      (typeof email !== "string" || !email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Email must be a valid string",
      });
    }

    if (
      email &&
      email.toLowerCase().trim() !== teacher.email
    ) {
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: teacher._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      teacher.email = email.toLowerCase().trim();
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Teacher name must be a valid string",
        });
      }

      teacher.name = name.trim();
    }

    if (
      phone !== undefined &&
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone must be a valid string",
      });
    }

    if (phone !== undefined) {
      teacher.phone = phone.trim();
    }

    if (
      avatar !== undefined &&
      typeof avatar !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Avatar must be a valid string",
      });
    }

    if (avatar !== undefined) {
      teacher.avatar = avatar.trim();
    }

    if (joiningDate !== undefined) {
      teacher.joiningDate = joiningDate || null;
    }

    if (specializations !== undefined) {
      if (!Array.isArray(specializations)) {
        return res.status(400).json({
          success: false,
          message: "Specializations must be an array",
        });
      }

      const cleanedSpecializations = specializations
        .filter(
          (item) =>
            typeof item === "string" && item.trim() !== ""
        )
        .map((item) => item.trim());

      if (cleanedSpecializations.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one specialization is required",
        });
      }

      teacher.specializations = cleanedSpecializations;
    }

    if (status !== undefined) {
      teacher.status = status;
      teacher.isActive = status === "ACTIVE";
    }

    await teacher.save();

    return res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        role: teacher.role,
        avatar: teacher.avatar,
        specializations: teacher.specializations,
        joiningDate: teacher.joiningDate,
        status: teacher.status,
        isActive: teacher.isActive,
      },
    });
  } catch (error) {
    console.error("Update Teacher Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating teacher",
    });
  }
};

/* =====================================================
   GET MY STUDENTS

   Teachers see students belonging to their active
   assigned batches. Fee-management permissions are
   handled separately by the fee controller.
===================================================== */

const getMyStudents = async (req, res) => {
  try {

    const teacherId = req.user._id || req.user.id;

    if (!mongoose.isValidObjectId(teacherId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid teacher session",
      });
    }

    const overview = await getTeacherStudentOverview(teacherId);

    return res.status(200).json({
      success: true,

      count: overview.stats.totalStudents,

      students: overview.students,

      batches: overview.batches,

      stats: overview.stats,
    });

  } catch (error) {

    console.error("Get My Students Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching students",
    });
  }
};

/* =====================================================
   DEACTIVATE TEACHER
===================================================== */

const deactivateTeacher = async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: "TEACHER",
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    teacher.status = "INACTIVE";
    teacher.isActive = false;

    await teacher.save();

    return res.status(200).json({
      success: true,
      message: "Teacher deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate Teacher Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deactivating teacher",
    });
  }
};

/* =====================================================
   DELETE TEACHER PERMANENTLY
===================================================== */

const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    const teacher = await User.findOne({
      _id: id,
      role: "TEACHER",
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const teacherId = teacher._id;

    const linkedRecords = await Promise.all([
      Batch.exists({
        $or: [
          { educator: teacherId },
          { attendanceTeachers: teacherId },
        ],
      }),

      User.exists({
        role: "STUDENT",
        $or: [
          { teacherId },
          { taskReportTeacherIds: teacherId },
        ],
      }),

      TaskReportSettings.exists({
        assignedTeachers: teacherId,
      }),

      Doubt.exists({
        $or: [
          { assignedTeacher: teacherId },
          { "replies.senderId": teacherId },
        ],
      }),

      DoubtMessage.exists({
        senderId: teacherId,
      }),

      Task.exists({
        $or: [
          { createdBy: teacherId },
          { "submissions.reviewedBy": teacherId },
        ],
      }),

      StudentTaskProgress.exists({
        reviewedBy: teacherId,
      }),

      Attendance.exists({
        markedBy: teacherId,
      }),

      Announcement.exists({
        createdBy: teacherId,
      }),

      StudentFee.exists({
        $or: [
          { "installments.recordedBy": teacherId },
          { lastAccessRestoredBy: teacherId },
        ],
      }),
    ]);

    if (linkedRecords.some(Boolean)) {
      return res.status(409).json({
        success: false,
        message:
          "This teacher has linked assignments or history records and cannot be permanently deleted. Use Edit to set the teacher's status to INACTIVE.",
      });
    }

    const result = await User.deleteOne({
      _id: teacherId,
      role: "TEACHER",
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Teacher no longer exists",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Delete Teacher Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete teacher",
    });
  }
};

/* =====================================================
   GET MY PROFILE
===================================================== */

const getMyProfile = async (req, res) => {
  try {
    const teacher = await User.findById(
      req.user._id || req.user.id
    ).select("-password");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    if (teacher.role !== "TEACHER") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error("Get Teacher Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

/* =====================================================
   UPDATE MY PROFILE
===================================================== */

const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, avatar, specializations } = req.body;

    const teacher = await User.findById(
      req.user._id || req.user.id
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    if (teacher.role !== "TEACHER") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      teacher.name = name.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Phone must be a valid string",
        });
      }

      teacher.phone = phone.trim();
    }

    if (avatar !== undefined) {
      if (typeof avatar !== "string") {
        return res.status(400).json({
          success: false,
          message: "Avatar must be a valid string",
        });
      }

      teacher.avatar = avatar.trim();
    }

    if (specializations !== undefined) {
      if (!Array.isArray(specializations)) {
        return res.status(400).json({
          success: false,
          message: "Specializations must be an array",
        });
      }

      teacher.specializations = specializations
        .filter(
          (item) =>
            typeof item === "string" && item.trim() !== ""
        )
        .map((item) => item.trim());
    }

    await teacher.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        role: teacher.role,
        avatar: teacher.avatar,
        specializations: teacher.specializations,
        joiningDate: teacher.joiningDate,
        status: teacher.status,
        isActive: teacher.isActive,
      },
    });
  } catch (error) {
    console.error("Update Teacher Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deactivateTeacher,
  deleteTeacher,
  getMyStudents,
  getTeacherDashboard,
  getMyProfile,
  updateMyProfile,
};