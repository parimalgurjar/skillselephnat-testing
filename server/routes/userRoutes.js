const express = require("express");



const {
  getPendingUsers,
  getStudents,
  getTeachers,
  createTeacher,
  updateTeacher,
  approveUser,
  rejectUser,
  deactivateUser,
} = require("../controllers/userController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   ALL USER MANAGEMENT ROUTES ARE ADMIN ONLY
===================================================== */

router.get(
  "/pending",
  protect,
  authorize("ADMIN"),
  getPendingUsers
);

router.get(
  "/students",
  protect,
  authorize("ADMIN"),
  getStudents
);

router.get(
  "/teachers",
  protect,
  authorize("ADMIN"),
  getTeachers
);
router.post(
  "/teachers",
  protect,
  authorize("ADMIN"),
  createTeacher
);

router.patch(
  "/teachers/:id",
  protect,
  authorize("ADMIN"),
  updateTeacher
);
router.patch(
  "/:id/approve",
  protect,
  authorize("ADMIN"),
  approveUser
);

router.patch(
  "/:id/reject",
  protect,
  authorize("ADMIN"),
  rejectUser
);

router.patch(
  "/:id/deactivate",
  protect,
  authorize("ADMIN"),
  deactivateUser
);

module.exports = router;