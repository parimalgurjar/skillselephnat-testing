const User = require("../models/User");
const Course = require("../models/Course");
const Batch = require("../models/Batch");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const getValidBatch = async (
  batchId,
  batchTiming,
  { allowEmpty = false } = {}
) => {
  if (batchId) {
    if (!isValidObjectId(batchId)) {
      return {
        success: false,
        message: "Invalid batch ID",
      };
    }

    const batch = await Batch.findById(batchId);

    if (!batch) {
      return {
        success: false,
        message: "Selected batch not found",
      };
    }

    return {
      success: true,
      batch,
    };
  }

  /* Type check for batchTiming to prevent runtime TypeError on non-string inputs */
  if (
    batchTiming !== undefined &&
    batchTiming !== null &&
    typeof batchTiming !== "string"
  ) {
    return {
      success: false,
      message: "Batch timing must be a string",
    };
  }

  /*
    Backward compatibility for old frontend
  */

  if (batchTiming?.trim()) {
    const batch = await Batch.findOne({
      batchTiming: batchTiming.trim(),
    });

    if (!batch) {
      return {
        success: false,
        message: "Selected batch timing does not exist",
      };
    }

    return {
      success: true,
      batch,
    };
  }

  return allowEmpty
    ? {
        success: true,
        batch: null,
      }
    : {
        success: false,
        message: "Please select a valid batch",
      };
};

/* =====================================================
   POPULATE STUDENT
===================================================== */

const populateStudent = async (student) => {
  await student.populate([
    {
      path: "batchId",
      select:
        "name code batchTiming startTime endTime status",
    },
    {
      path: "teacherId",
      select:
        "name email phone status isActive",
    },
    {
      path: "courseId",
      select:
        "title name",
    },
  ]);

  const studentObject = student.toObject();

  delete studentObject.password;

  return studentObject;
};

/* =====================================================
   VALIDATE TEACHER
===================================================== */

const validateTeacher = async (teacherId) => {
  if (!teacherId) {
    return null;
  }

  if (!isValidObjectId(teacherId)) {
    throw Object.assign(
      new Error("Invalid teacher ID"),
      {
        status: 400,
      }
    );
  }

  const teacher = await User.findOne({
    _id: teacherId,
    role: "TEACHER",
    status: "ACTIVE",
    isActive: true,
  });

  if (!teacher) {
    throw Object.assign(
      new Error(
        "Selected teacher is not active or does not exist"
      ),
      {
        status: 404,
      }
    );
  }

  return teacher;
};

/* =====================================================
   VALIDATE COURSE
===================================================== */

const validateCourse = async (courseId) => {
  if (!courseId) {
    return null;
  }

  if (!isValidObjectId(courseId)) {
    throw Object.assign(
      new Error("Invalid course ID"),
      {
        status: 400,
      }
    );
  }

  const course = await Course.findById(courseId);

  if (!course) {
    throw Object.assign(
      new Error("Selected course not found"),
      {
        status: 404,
      }
    );
  }

  return course;
};

/* =====================================================
   CREATE STUDENT
===================================================== */

const createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      avatar,
      batchId,
      batchTiming,
      courseId,
      teacherId,
      joiningDate,
      status,
    } = req.body;

    /* ================= VALIDATION ================= */

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password and phone are required",
      });
    }

    /* ================= PASSWORD STRENGTH ================= */

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    /* ================= EMAIL CHECK ================= */

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    /* ================= BATCH ================= */

    const batchResult = await getValidBatch(
      batchId,
      batchTiming
    );

    if (!batchResult.success) {
      return res.status(400).json({
        success: false,
        message: batchResult.message,
      });
    }

    /* ================= COURSE ================= */

    await validateCourse(courseId);

    /* ================= TEACHER ================= */

    await validateTeacher(teacherId);

    /* ================= STATUS ================= */
    const allowedStatuses = [
      "ACTIVE",
      "INACTIVE",
      "PENDING",
      "REJECTED",
    ];

    const studentStatus = status || "ACTIVE";

    if (!allowedStatuses.includes(studentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student status",
      });
    }

    /* ================= CREATE ================= */

    const student = await User.create({
      name: name.trim(),

      email: email.toLowerCase().trim(),

      password: await bcrypt.hash(password, 12),

      phone: phone.trim(),

      role: "STUDENT",

      avatar: avatar?.trim() || "",

      /*
        CANONICAL BATCH RELATION
      */

      batchId: batchResult.batch._id,

      /*
        Compatibility field.
        Always copied from actual Batch.
      */

      batchTiming:
        batchResult.batch.batchTiming || "",

      courseId: courseId || null,

      teacherId: teacherId || null,

      joiningDate: joiningDate || null,

      status: studentStatus,

      isActive: studentStatus === "ACTIVE",
    });

    return res.status(201).json({
      success: true,

      message: "Student created successfully",

      student: await populateStudent(student),
    });
  } catch (error) {
    console.error("Create Student Error:", error);

    return res
      .status(error.status || 500)
      .json({
        success: false,

        message: error.status
          ? error.message
          : "Server error while creating student",
      });
  }
};

/* =====================================================
   GET ALL STUDENTS
===================================================== */

const getStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: "STUDENT",
    })
      .select("-password")

      .populate(
        "batchId",
        "name code batchTiming startTime endTime status"
      )

      .populate(
        "teacherId",
        "name email phone status isActive"
      )

      .populate("courseId", "title name")

      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,

      count: students.length,

      students,
    });
  } catch (error) {
    console.error("Get Students Error:", error);

    return res.status(500).json({
      success: false,

      message:
        "Server error while fetching students",
    });
  }
};

/* =====================================================
   GET SINGLE STUDENT
===================================================== */

const getStudentById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await User.findOne({
      _id: req.params.id,
      role: "STUDENT",
    })
      .select("-password")

      .populate(
        "batchId",
        "name code batchTiming startTime endTime status"
      )

      .populate(
        "teacherId",
        "name email phone status isActive"
      )

      .populate("courseId", "title name");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Get Student Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching student",
    });
  }
};

/* =====================================================
   UPDATE STUDENT
===================================================== */

const updateStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      avatar,
      batchId,
      batchTiming,
      courseId,
      teacherId,
      joiningDate,
      status,
    } = req.body;

    /* ================= VALIDATE ID ================= */

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    /* ================= FIND STUDENT ================= */

    const student = await User.findOne({
      _id: req.params.id,
      role: "STUDENT",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
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

    /* ================= EMAIL ================= */

    if (
      email &&
      email.toLowerCase().trim() !== student.email
    ) {
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),

        _id: {
          $ne: student._id,
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      student.email = email.toLowerCase().trim();
    }

    /* ================= BATCH ================= */

    if (
      batchId !== undefined ||
      batchTiming !== undefined
    ) {
      if (batchId === null || batchId === "") {
        return res.status(400).json({
          success: false,
          message:
            "Student must belong to a valid batch",
        });
      }

      const batchResult = await getValidBatch(
        batchId,
        batchTiming
      );

      if (!batchResult.success) {
        return res.status(400).json({
          success: false,
          message: batchResult.message,
        });
      }

      /*
        Always update both from actual Batch
      */

      student.batchId = batchResult.batch._id;

      student.batchTiming =
        batchResult.batch.batchTiming || "";
    }

    /* ================= COURSE ================= */

    if (courseId !== undefined) {
      if (courseId) {
        await validateCourse(courseId);

        student.courseId = courseId;
      } else {
        student.courseId = null;
      }
    }

    /* ================= TEACHER ================= */

    if (teacherId !== undefined) {
      if (teacherId) {
        await validateTeacher(teacherId);

        student.teacherId = teacherId;
      } else {
        student.teacherId = null;
      }
    }

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Name must be a valid string",
      });
    }

    /* ================= NAME ================= */

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Student name cannot be empty",
        });
      }

      student.name = name.trim();
    }

    /* ================= PHONE ================= */

    if (phone !== undefined) {
      student.phone = phone?.trim() || "";
    }

    /* ================= AVATAR ================= */

    if (avatar !== undefined) {
      student.avatar = avatar?.trim() || "";
    }

    /* ================= JOINING DATE ================= */

    if (joiningDate !== undefined) {
      student.joiningDate = joiningDate || null;
    }

    /* ================= STATUS ================= */

    if (status !== undefined) {
      const allowedStatuses = [
        "ACTIVE",
        "INACTIVE",
        "PENDING",
        "REJECTED",
      ];

      if (
        typeof status !== "string" ||
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid student status",
        });
      }

      student.status = status;
      student.isActive = status === "ACTIVE";
    }

    /* ================= SAVE ================= */

    await student.save();

    return res.status(200).json({
      success: true,

      message: "Student updated successfully",

      student: await populateStudent(student),
    });
  } catch (error) {
    console.error("Update Student Error:", error);

    return res
      .status(error.status || 500)
      .json({
        success: false,

        message: error.status
          ? error.message
          : "Server error while updating student",
      });
  }
};

/* =====================================================
   DEACTIVATE STUDENT
===================================================== */

const deactivateStudent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await User.findOne({
      _id: req.params.id,
      role: "STUDENT",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    student.status = "INACTIVE";

    student.isActive = false;

    await student.save();

    return res.status(200).json({
      success: true,
      message: "Student deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate Student Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Server error while deactivating student",
    });
  }
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deactivateStudent,
};