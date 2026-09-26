const express = require("express");


const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deactivateTeacher,
  deleteTeacher,
  getMyStudents,
    getMyProfile,
  updateMyProfile,
  getTeacherDashboard,
} = require("../controllers/teacherController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   TEACHER DASHBOARD
===================================================== */

router.get(
  "/dashboard",
  protect,
  authorize("TEACHER"),
  getTeacherDashboard
);

/* =====================================================
   GET LOGGED-IN TEACHER'S STUDENTS
===================================================== */

router.get(
  "/my-students",
  protect,
  authorize("TEACHER"),
  getMyStudents
);

router.get(
  "/profile",
  protect,
  authorize("TEACHER"),
  getMyProfile
);

router.put(
  "/profile",
  protect,
  authorize("TEACHER"),
  updateMyProfile
);
/* =====================================================
   CREATE TEACHER
   ADMIN ONLY
===================================================== */

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createTeacher
);

/* =====================================================
   GET ALL TEACHERS
   ADMIN ONLY
===================================================== */

router.get(
  "/",
  protect,
  authorize("ADMIN"),
  getTeachers
);

/* =====================================================
   GET SINGLE TEACHER
   ADMIN ONLY
===================================================== */

router.get(
  "/:id",
  protect,
  authorize("ADMIN"),
  getTeacherById
);

/* =====================================================
   UPDATE TEACHER
   ADMIN ONLY
===================================================== */

router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateTeacher
);

/* =====================================================
   DEACTIVATE TEACHER
   ADMIN ONLY
===================================================== */

router.patch(
  "/:id/deactivate",
  protect,
  authorize("ADMIN"),
  deactivateTeacher
);
/* =====================================================
   DELETE TEACHER PERMANENTLY

   ADMIN ONLY
===================================================== */
router.delete(
  "/:id",

  protect,

  authorize("ADMIN"),

  deleteTeacher
);

module.exports = router;