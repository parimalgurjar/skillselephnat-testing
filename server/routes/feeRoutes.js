
const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const {
  getMyFeeStatus,
  listStudentFees,
  setStudentFee,
  addInstallment,
  restoreStudentAccess,
  updateTeacherFeePermission,
} = require("../controllers/feeController");

const router = express.Router();

// Student: status and deadline only.
router.get(
  "/my-status",
  protect,
  authorizeRoles("STUDENT"),
  getMyFeeStatus
);

// Admin and teachers: controller applies teacher permission and assignment checks.
router.get(
  "/students",
  protect,
  authorizeRoles("ADMIN", "TEACHER"),
  listStudentFees
);

router.put(
  "/students/:studentId",
  protect,
  authorizeRoles("ADMIN", "TEACHER"),
  setStudentFee
);

router.post(
  "/students/:studentId/installments",
  protect,
  authorizeRoles("ADMIN", "TEACHER"),
  addInstallment
);

// Only admins can restore access or grant teacher fee permissions.
router.post(
  "/students/:studentId/restore-access",
  protect,
  authorizeRoles("ADMIN"),
  restoreStudentAccess
);

router.patch(
  "/teachers/:teacherId/permission",
  protect,
  authorizeRoles("ADMIN"),
  updateTeacherFeePermission
);

module.exports = router;
