const User = require("../models/User");
const Batch = require("../models/Batch");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

/* =====================================================
   GENERATE JWT TOKEN
===================================================== */

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

/* =====================================================
   BUILD CONSISTENT AUTH USER RESPONSE
===================================================== */

const buildAuthUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,

    batchId: user.batchId,
    batchTiming: user.batchTiming,

    specializations: user.specializations,

    courseId: user.courseId,

    teacherId: user.teacherId,

    joiningDate: user.joiningDate,

    status: user.status,

    isActive: user.isActive,
  };
};

/* =====================================================
   REGISTER USER
===================================================== */

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      batchId,
      specializations,
    } = req.body;

    /* ================= BASIC VALIDATION ================= */

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string" ||
      typeof phone !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password ||
      !role.trim() ||
      !phone.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid required fields",
      });
    }

    const cleanedName = name.trim();
    const cleanedEmail = email.toLowerCase().trim();
    const cleanedPhone = phone.trim();
    const cleanedRole = role.trim().toUpperCase();

    if (!cleanedName || !cleanedEmail || !cleanedPhone) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields correctly",
      });
    }

    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    /* ================= PASSWORD VALIDATION ================= */

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    /* ================= BLOCK ADMIN SIGNUP ================= */

    if (cleanedRole === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be created through public signup",
      });
    }

    /* ================= VALID ROLE ================= */

    if (cleanedRole !== "STUDENT" && cleanedRole !== "TEACHER") {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected",
      });
    }

    /* ================= STUDENT VALIDATION ================= */

    let selectedBatch = null;

    if (cleanedRole === "STUDENT") {
      if (!batchId) {
        return res.status(400).json({
          success: false,
          message: "Please select a batch",
        });
      }

      if (!mongoose.isValidObjectId(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch selected",
        });
      }

      selectedBatch = await Batch.findOne({
        _id: batchId,
        status: "ACTIVE",
      });

      if (!selectedBatch) {
        return res.status(400).json({
          success: false,
          message: "Selected batch does not exist or is inactive",
        });
      }
    }

    /* ================= CLEAN SPECIALIZATIONS ================= */

    const cleanedSpecializations =
      cleanedRole === "TEACHER" && Array.isArray(specializations)
        ? specializations
            .filter((item) => item && typeof item === "string" && item.trim())
            .map((item) => item.trim())
        : [];

    /* ================= TEACHER VALIDATION ================= */

    if (cleanedRole === "TEACHER" && cleanedSpecializations.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one valid specialization is required for teacher registration",
      });
    }

    /* ================= CHECK EXISTING USER ================= */

    const existingUser = await User.findOne({
      email: cleanedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    /* ================= HASH PASSWORD ================= */

    const hashedPassword = await bcrypt.hash(password, 12);

    /* ================= CREATE PENDING USER ================= */

    const user = await User.create({
      name: cleanedName,
      email: cleanedEmail,
      password: hashedPassword,
      phone: cleanedPhone,
      role: cleanedRole,

      batchId: cleanedRole === "STUDENT" && selectedBatch ? selectedBatch._id : null,

      batchTiming:
        cleanedRole === "STUDENT" && selectedBatch ? selectedBatch.batchTiming : "",

      specializations:
        cleanedRole === "TEACHER" ? cleanedSpecializations : [],

      status: "PENDING",
      isActive: false,
    });

    /* ================= RESPONSE ================= */

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please wait for admin approval before logging in.",
      user: buildAuthUser(user),
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

/* =====================================================
   CREATE TEACHER (ADMIN DIRECT CREATION)
===================================================== */

const createTeacher = async (req, res) => {
  try {
    const { name, email, password, phone, specializations } = req.body;

    /* ================= INPUT TYPE & REQUIRED VALIDATION ================= */
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

    const cleanedName = name.trim();
    const cleanedEmail = email.toLowerCase().trim();

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await User.findOne({ email: cleanedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const cleanedSpecializations = Array.isArray(specializations)
      ? specializations
          .filter((item) => item && typeof item === "string" && item.trim())
          .map((item) => item.trim())
      : [];

    const teacher = await User.create({
      name: cleanedName,
      email: cleanedEmail,
      password: hashedPassword,
      phone: typeof phone === "string" ? phone.trim() : "",
      role: "TEACHER",
      specializations: cleanedSpecializations,
      status: "ACTIVE",
      isActive: true,
      joiningDate: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Teacher account created successfully",
      teacher: buildAuthUser(teacher),
    });
  } catch (error) {
    console.error("Create Teacher Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during teacher creation",
    });
  }
};

/* =====================================================
   LOGIN USER
===================================================== */

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const cleanedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: cleanedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    /* ================= PENDING APPROVAL ================= */

    if (user.status === "PENDING") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is pending admin approval. Please try again later.",
      });
    }

    /* ================= REJECTED ================= */

    if (user.status === "REJECTED") {
      return res.status(403).json({
        success: false,
        message:
          "Your registration request was rejected. Please contact the administrator.",
      });
    }

    /* ================= ACCOUNT STATUS ================= */

    if (
      user.status === "INACTIVE" ||
      user.status === "SUSPENDED" ||
      !user.isActive
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is currently inactive. Please contact the administrator.",
      });
    }

    /* ================= PASSWORD CHECK ================= */

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    /* ================= TOKEN ================= */

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: buildAuthUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   GET CURRENT USER
===================================================== */

const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: buildAuthUser(req.user),
    });
  } catch (error) {
    console.error("Get Current User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   UPDATE CURRENT USER PROFILE
===================================================== */

const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* ================= NAME ================= */

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name must be a valid string",
        });
      }

      user.name = name.trim();
    }

    /* ================= EMAIL ================= */

    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email must be a valid string",
        });
      }

      const cleanedEmail = email.toLowerCase().trim();

      const existingUser = await User.findOne({
        email: cleanedEmail,
        _id: {
          $ne: user._id,
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "This email is already being used by another account",
        });
      }

      user.email = cleanedEmail;
    }

    /* ================= PHONE ================= */

    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Phone must be a valid string",
        });
      }

      const cleanedPhone = phone.trim();

      if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit phone number",
        });
      }

      user.phone = cleanedPhone;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: buildAuthUser(user),
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

/* =====================================================
   CHANGE PASSWORD
===================================================== */

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* ================= VERIFY CURRENT PASSWORD ================= */

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    /* ================= HASH NEW PASSWORD ================= */

    user.password = await bcrypt.hash(newPassword, 12);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
};

/* =====================================================
   GET PENDING REGISTRATION REQUESTS
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
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get Pending Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch pending registration requests",
    });
  }
};

/* =====================================================
   APPROVE USER
   ADMIN ONLY
===================================================== */

const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin account cannot be approved through this endpoint",
      });
    }

    if (user.status === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "User is already approved",
      });
    }

    if (user.status === "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "Rejected user cannot be approved directly",
      });
    }

    user.status = "ACTIVE";
    user.isActive = true;
    user.joiningDate = new Date();

    await user.save();

    return res.status(200).json({
      success: true,
      message: `${
        user.role === "STUDENT" ? "Student" : "Teacher"
      } approved successfully`,
      user: buildAuthUser(user),
    });
  } catch (error) {
    console.error("Approve User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve user",
    });
  }
};

/* =====================================================
   REJECT USER
   ADMIN ONLY
===================================================== */

const rejectUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin account cannot be rejected",
      });
    }

    if (user.status === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Active user cannot be rejected directly",
      });
    }

    if (user.status === "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "User is already rejected",
      });
    }

    user.status = "REJECTED";
    user.isActive = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Registration request rejected",
    });
  } catch (error) {
    console.error("Reject User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject registration request",
    });
  }
};

/* =====================================================
   GET ALL USERS
   ADMIN ONLY
===================================================== */

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: {
        $in: ["STUDENT", "TEACHER"],
      },
    })
      .select("-password")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users",
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
      message: "Unable to fetch students",
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
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error("Get Teachers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch teachers",
    });
  }
};
/* =====================================================
   FIRST ADMIN SETUP
   PUBLIC - ONLY WHEN NO ADMIN EXISTS
===================================================== */

const setupFirstAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
    } = req.body;

    /* ================= BASIC VALIDATION ================= */

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const cleanedName = name.trim();
    const cleanedEmail = email.toLowerCase().trim();
    const cleanedPhone =
      typeof phone === "string" ? phone.trim() : "";

    /* ================= REQUIRED FIELDS ================= */

    if (!cleanedName || !cleanedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    /* ================= EMAIL VALIDATION ================= */

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    /* ================= PASSWORD VALIDATION ================= */

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    /* ================= PHONE VALIDATION ================= */

    if (cleanedPhone && !/^[6-9]\d{9}$/.test(cleanedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    /* =====================================================
       CRITICAL SECURITY CHECK

       Only ONE first-admin setup is allowed.

       If ANY ADMIN already exists,
       this endpoint can never create another admin.
    ===================================================== */

    const existingAdmin = await User.findOne({
      role: "ADMIN",
    }).select("_id");

    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        setupCompleted: true,
        message:
          "Admin setup has already been completed. Please use the normal login page.",
      });
    }

    /* ================= CHECK EMAIL ================= */

    const existingUser = await User.findOne({
      email: cleanedEmail,
    }).select("_id");

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    /* ================= HASH PASSWORD ================= */

    const hashedPassword = await bcrypt.hash(password, 12);

    /* ================= CREATE FIRST ADMIN ================= */

    const admin = await User.create({
      name: cleanedName,
      email: cleanedEmail,
      password: hashedPassword,
      phone: cleanedPhone,

      role: "ADMIN",

      status: "ACTIVE",
      isActive: true,

      joiningDate: new Date(),

      batchId: null,
      batchTiming: "",
      courseId: null,
      teacherId: null,
      taskReportTeacherIds: [],
      specializations: [],
    });

    /* ================= RESPONSE ================= */

    return res.status(201).json({
      success: true,
      setupCompleted: true,
      message:
        "Admin account created successfully. You can now login.",
      user: buildAuthUser(admin),
    });
  } catch (error) {
    console.error("First Admin Setup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during admin setup",
    });
  }
};
/* =====================================================
   EXPORTS
===================================================== */



module.exports = {
  registerUser,
  createTeacher,
  setupFirstAdmin,
  loginUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllUsers,
  getStudents,
  getTeachers,
};