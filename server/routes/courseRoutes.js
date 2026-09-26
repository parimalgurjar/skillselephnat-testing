const express = require("express");

const {
  createCourse,
  getCourses,
  getActiveCourses,
  getCourseById,
  updateCourse,
  deactivateCourse,
} = require("../controllers/courseController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   GET ACTIVE COURSES
   AUTHENTICATED USERS
===================================================== */

router.get(
  "/active",
  protect,
  getActiveCourses
);

/* =====================================================
   CREATE COURSE
   ADMIN ONLY
===================================================== */

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createCourse
);

/* =====================================================
   GET ALL COURSES
===================================================== */

router.get(
  "/",
  protect,
  getCourses
);

/* =====================================================
   GET SINGLE COURSE
===================================================== */

router.get(
  "/:id",
  protect,
  getCourseById
);

/* =====================================================
   UPDATE COURSE
   ADMIN ONLY
===================================================== */

router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateCourse
);

/* =====================================================
   DEACTIVATE COURSE
   ADMIN ONLY
===================================================== */

router.patch(
  "/:id/deactivate",
  protect,
  authorize("ADMIN"),
  deactivateCourse
);

module.exports = router;