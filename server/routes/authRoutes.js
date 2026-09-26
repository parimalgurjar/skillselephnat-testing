const express = require("express");

const {
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
} = require("../controllers/authController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   PUBLIC AUTH ROUTES
===================================================== */

// REGISTER
router.post("/register", registerUser);
router.post("/admin-setup", setupFirstAdmin);
// LOGIN
router.post("/login", loginUser);

/* =====================================================
   AUTHENTICATED USER ROUTES
===================================================== */

// CURRENT USER
router.get(
  "/me",
  protect,
  getCurrentUser
);

// UPDATE PROFILE
router.put(
  "/update-profile",
  protect,
  updateProfile
);

// CHANGE PASSWORD
router.put(
  "/change-password",
  protect,
  changePassword
);

/* =====================================================
   ADMIN - USER MANAGEMENT
===================================================== */

// GET ALL PENDING REGISTRATION REQUESTS
router.get(
  "/pending-users",
  protect,
  authorizeRoles("ADMIN"),
  getPendingUsers
);

// APPROVE USER
router.put(
  "/approve-user/:id",
  protect,
  authorizeRoles("ADMIN"),
  approveUser
);

// REJECT USER
router.put(
  "/reject-user/:id",
  protect,
  authorizeRoles("ADMIN"),
  rejectUser
);

// GET ALL STUDENTS AND TEACHERS
router.get(
  "/users",
  protect,
  authorizeRoles("ADMIN"),
  getAllUsers
);

// GET ALL STUDENTS
router.get(
  "/students",
  protect,
  authorizeRoles("ADMIN"),
  getStudents
);

// GET ALL TEACHERS
router.get(
  "/teachers",
  protect,
  authorizeRoles("ADMIN"),
  getTeachers
);

module.exports = router;