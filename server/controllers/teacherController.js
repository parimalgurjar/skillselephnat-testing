const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Task = require("../models/Task");
const Batch = require("../models/Batch");

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

    /* ================= ASSIGNED BATCHES ================= */

    const assignedBatches = await Batch.find({
      $or: [
        { educator: teacherId },
        { attendanceTeachers: teacherId },
      ],
    })
      .select("_id name code batchTiming startTime endTime status")
      .sort({ startTime: 1 })
      .lean();

    /* ================= BATCH IDS AND TIMINGS ================= */

    const batchIds = assignedBatches.map((batch) => batch._id);

    const assignedBatchTimings = [
      ...new Set(
        assignedBatches
          .map((batch) => batch.batchTiming?.trim())
          .filter(Boolean)
      ),
    ];

    /* ================= STUDENTS IN ASSIGNED BATCHES ================= */

    const students = batchIds.length
      ? await User.find({
          role: "STUDENT",
          $or: [
            {
              batchId: { $in: batchIds },
            },
            {
              batchId: null,
              batchTiming: { $in: assignedBatchTimings },
            },
          ],
        })
          .select(
            "_id name email phone batchId batchTiming isActive status"
          )
          .lean()
      : [];

    const totalStudents = students.length;
    const totalBatches = assignedBatches.length;

    /* ================= CURRENT MONTH ================= */

    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const studentIds = students.map((student) => student._id);

    /* ================= MONTHLY ATTENDANCE ================= */

    const attendanceRecords =
      studentIds.length > 0
        ? await Attendance.find({
            studentId: { $in: studentIds },
            date: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
          }).lean()
        : [];

    let avgAttendance = 0;

    if (attendanceRecords.length > 0) {
      const presentCount = attendanceRecords.filter(
        (record) => record.status === "PRESENT"
      ).length;

      avgAttendance = Math.round(
        (presentCount / attendanceRecords.length) * 100
      );
    }

    /* ================= ACTIVE TASKS ================= */

    const activeTasks = await Task.countDocuments({
      createdBy: teacherId,
      status: "ACTIVE",
    });

    /* ================= RECENT TASKS ================= */

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

    /* ================= UPCOMING CLASSES ================= */

    const upcomingClasses = assignedBatches.map((batch, index) => ({
      id: index + 1,
      _id: batch._id,
      time:
        batch.batchTiming ||
        `${batch.startTime || ""} ${batch.endTime || ""}`.trim(),
      title: batch.name || "Scheduled Class",
      batch: batch.code || batch.name || "",
      status:
        batch.status === "ACTIVE"
          ? "Active"
          : batch.status || "Upcoming",
    }));

    /* ================= RESPONSE ================= */

    return res.status(200).json({
      success: true,
      dashboard: {
        totalStudents,
        totalBatches,
        activeTasks,
        avgAttendance,
        performance: 0,
        upcomingClasses,
        recentTasks,
        batches: assignedBatches.map((batch) => ({
          _id: batch._id,
          name: batch.name,
          code: batch.code,
          startTime: batch.startTime,
          endTime: batch.endTime,
          batchTiming:
            batch.batchTiming ||
            `${batch.startTime || ""} ${batch.endTime || ""}`.trim(),
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

    const batchById = new Map();
    const batchByTiming = new Map();

    batches.forEach((batch) => {
      batchById.set(String(batch._id), batch);

      if (batch.batchTiming) {
        const timing = batch.batchTiming.trim();

        if (!batchByTiming.has(timing)) {
          batchByTiming.set(timing, batch);
        }
      }
    });

    const assignedBatchIds = batches.map((batch) => batch._id);

    const assignedBatchTimings = [
      ...new Set(
        batches
          .map((batch) => batch.batchTiming?.trim())
          .filter(Boolean)
      ),
    ];

    const students = assignedBatchIds.length
      ? await User.find({
          role: "STUDENT",
          $or: [
            {
              batchId: { $in: assignedBatchIds },
            },
            {
              batchId: null,
              batchTiming: { $in: assignedBatchTimings },
            },
          ],
        })
          .select("-password")
          .sort({ name: 1 })
          .lean()
      : [];

    const formattedStudents = students.map((student) => {
      let resolvedBatch = null;

      if (student.batchId) {
        resolvedBatch =
          batchById.get(String(student.batchId)) || null;
      }

      if (!resolvedBatch && student.batchTiming) {
        resolvedBatch =
          batchByTiming.get(student.batchTiming.trim()) || null;
      }

      return {
        ...student,
        batch: resolvedBatch
          ? {
              _id: resolvedBatch._id,
              name: resolvedBatch.name,
              code: resolvedBatch.code,
              startTime: resolvedBatch.startTime,
              endTime: resolvedBatch.endTime,
              batchTiming: resolvedBatch.batchTiming,
              status: resolvedBatch.status,
            }
          : null,
        batchTiming:
          resolvedBatch?.batchTiming || student.batchTiming || "",
        batchId: resolvedBatch?._id || student.batchId || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedStudents.length,
      students: formattedStudents,
      batches: batches.map((batch) => ({
        _id: batch._id,
        name: batch.name,
        code: batch.code,
        startTime: batch.startTime,
        endTime: batch.endTime,
        batchTiming:
          batch.batchTiming ||
          `${batch.startTime || ""} ${batch.endTime || ""}`.trim(),
        status: batch.status,
      })),
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

    await User.deleteOne({
      _id: teacher._id,
    });

    return res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Delete Teacher Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting teacher",
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