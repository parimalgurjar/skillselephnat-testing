const express = require("express");

const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deactivateStudent,
} = require("../controllers/studentController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   CREATE STUDENT
   ADMIN ONLY
===================================================== */

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createStudent
);

/* =====================================================
   GET ALL STUDENTS
   ADMIN ONLY
===================================================== */

router.get(
  "/",
  protect,
  authorize("ADMIN"),
  getStudents
);

/* =====================================================
   GET SINGLE STUDENT
   ADMIN ONLY
===================================================== */

router.get(
  "/:id",
  protect,
  authorize("ADMIN"),
  getStudentById
);

/* =====================================================
   UPDATE STUDENT
   ADMIN ONLY
===================================================== */

router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateStudent
);

/* =====================================================
   DEACTIVATE STUDENT
   ADMIN ONLY
===================================================== */

router.patch(
  "/:id/deactivate",
  protect,
  authorize("ADMIN"),
  deactivateStudent
);

module.exports = router;