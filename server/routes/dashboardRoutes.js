const express = require("express");

const {
  getStudentDashboard,
  getStudentProfile,
    getAdminReports,
} = require("../controllers/dashboardController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   STUDENT DASHBOARD
===================================================== */

router.get(
  "/student",
  protect,
  authorize("STUDENT"),
  getStudentDashboard
);

/* =====================================================
   STUDENT PROFILE
===================================================== */

router.get(
  "/profile",
  protect,
  authorize("STUDENT"),
  getStudentProfile
);
/* =====================================================
   ADMIN REPORTS & ANALYTICS
===================================================== */

router.get(
  "/admin-reports",
  protect,
  authorize("ADMIN"),
  getAdminReports
);

module.exports = router;