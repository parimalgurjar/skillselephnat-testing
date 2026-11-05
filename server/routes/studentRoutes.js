const express = require("express");


const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deactivateStudent,
  deleteStudent,
  activateStudent
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
   PERMANENT DELETE STUDENT
   ADMIN ONLY
===================================================== */

router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  deleteStudent
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
/* =====================================================
   ACTIVATE STUDENT
   ADMIN ONLY
===================================================== */

router.patch(
  "/:id/activate",
  protect,
  authorize("ADMIN"),
  activateStudent
);

module.exports = router;