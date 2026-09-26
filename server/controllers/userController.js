const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/* =====================================================
   GET ALL PENDING USERS
   ADMIN ONLY
===================================================== */

const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      status: "PENDING",
      role: {
        $in: ["STUDENT", "TEACHER"],
      },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(
      "Get Pending Users Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   GET ALL STUDENTS
   ADMIN ONLY
===================================================== */

const getStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: "STUDENT",
    })
      .select("-password")
      .populate(
        "teacherId",
        "name email status isActive"
      )
      .populate(
        "courseId",
        "title name"
      )
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error(
      "Get Students Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   GET ALL TEACHERS
   ADMIN ONLY
===================================================== */

const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({
      role: "TEACHER",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error(
      "Get Teachers Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   APPROVE USER
   ADMIN ONLY
===================================================== */

const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Admin approval is not allowed",
      });
    }

    /* ONLY PENDING USERS CAN BE APPROVED */

    if (user.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending users can be approved",
      });
    }

    user.status = "ACTIVE";
    user.isActive = true;

    await user.save();

    return res.json({
      success: true,
      message:
        `${user.name} has been approved successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(
      "Approve User Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   REJECT USER
   ADMIN ONLY
===================================================== */

const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Admin cannot be rejected",
      });
    }

    /* ONLY PENDING USERS */

    if (user.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending users can be rejected",
      });
    }

    user.status = "REJECTED";
    user.isActive = false;

    await user.save();

    return res.json({
      success: true,
      message:
        `${user.name}'s request has been rejected`,
    });
  } catch (error) {
    console.error(
      "Reject User Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   CREATE TEACHER
   ADMIN ONLY
===================================================== */

const createTeacher = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specializations,
      joiningDate,
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
    message: "Name, email and password are required",
  });
}

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "User already exists with this email",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const teacher = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : "",
      role: "TEACHER",
      specializations: specializations || [],
      joiningDate: joiningDate || new Date(),
      status: "ACTIVE",
      isActive: true,
    });

    const teacherData = teacher.toObject();
    delete teacherData.password;

    return res.status(201).json({
      success: true,
      message: "Educator created successfully",
      teacher: teacherData,
    });
  } catch (error) {
    console.error(
      "Create Teacher Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   UPDATE TEACHER
   ADMIN ONLY
===================================================== */

const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      phone,
      specializations,
      joiningDate,
    } = req.body;

    const cleanEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : email;

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

    if (cleanEmail && cleanEmail !== teacher.email) {
      const existingUser = await User.findOne({
        email: cleanEmail,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            "Another user already exists with this email",
        });
      }

      teacher.email = cleanEmail;
    }

    if (name !== undefined) {
      teacher.name = name.trim();
    }

    if (phone !== undefined) {
      teacher.phone = phone.trim();
    }

    if (specializations !== undefined) {
      teacher.specializations = specializations;
    }

    if (joiningDate !== undefined) {
      teacher.joiningDate = joiningDate;
    }

    await teacher.save();

    const teacherData = teacher.toObject();
    delete teacherData.password;

    return res.json({
      success: true,
      message: "Educator updated successfully",
      teacher: teacherData,
    });
  } catch (error) {
    console.error(
      "Update Teacher Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   DEACTIVATE USER
   ADMIN ONLY
===================================================== */

const deactivateUser = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Admin cannot be deactivated from this route",
      });
    }

    if (user.status === "INACTIVE") {
      return res.status(400).json({
        success: false,
        message:
          "User is already inactive",
      });
    }

    user.status = "INACTIVE";
    user.isActive = false;

    await user.save();

    return res.json({
      success: true,
      message:
        `${user.name}'s account has been deactivated`,
    });
  } catch (error) {
    console.error(
      "Deactivate User Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getPendingUsers,
  getStudents,
  getTeachers,
  createTeacher,
  updateTeacher,
  approveUser,
  rejectUser,
  deactivateUser,
};