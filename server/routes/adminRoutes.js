const express = require("express");

const {
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllUsers,
  getStudents,
  getTeachers,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/* ================= ADMIN-ONLY GUARD ================= */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

router.get("/users", protect, requireAdmin, getAllUsers);
router.get("/pending-users", protect, requireAdmin, getPendingUsers);
router.put("/approve/:id", protect, requireAdmin, approveUser);
router.put("/reject/:id", protect, requireAdmin, rejectUser);
router.get("/students", protect, requireAdmin, getStudents);
router.get("/teachers", protect, requireAdmin, getTeachers);

module.exports = router;