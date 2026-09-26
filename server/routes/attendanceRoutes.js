const express = require("express");

const {
  getAttendance,
  getAttendanceStats,
  getMyBatches,
  getStudentsForAttendance,
  markAttendance,
  getMyAttendance,
  getAttendanceReport,
} = require("../controllers/attendanceController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   STUDENT - OWN ATTENDANCE
===================================================== */

router.get(
  "/my-attendance",
  protect,
  authorize("STUDENT"),
  getMyAttendance
);

/* =====================================================
   ADMIN / TEACHER - GET ATTENDANCE BATCHES

   Teacher:
   Only assigned attendance batches

   Admin:
   All active batches
===================================================== */

router.get(
  "/my-batches",
  protect,
  authorize("ADMIN", "TEACHER"),
  getMyBatches
);

/* =====================================================
   ADMIN / TEACHER - GET STUDENTS FOR ATTENDANCE
===================================================== */

router.get(
  "/my-students",
  protect,
  authorize("ADMIN", "TEACHER"),
  getStudentsForAttendance
);

/* =====================================================
   ADMIN - ATTENDANCE STATS
===================================================== */

router.get(
  "/stats",
  protect,
  authorize("ADMIN"),
  getAttendanceStats
);

/* =====================================================
   ADMIN - ALL ATTENDANCE RECORDS
===================================================== */

router.get(
  "/",
  protect,
  authorize("ADMIN"),
  getAttendance
);

/* =====================================================
   ADMIN / TEACHER - ATTENDANCE REPORT
===================================================== */

router.get(
  "/report",
  protect,
  authorize("ADMIN", "TEACHER"),
  getAttendanceReport
);

/* =====================================================
   ADMIN / TEACHER - MARK / UPDATE ATTENDANCE
===================================================== */

router.post(
  "/mark",
  protect,
  authorize("ADMIN", "TEACHER"),
  markAttendance
);

/* =====================================================
   LEGACY API SUPPORT
===================================================== */

router.post(
  "/",
  protect,
  authorize("ADMIN", "TEACHER"),
  markAttendance
);

module.exports = router;