const express = require("express");

const {
  getAnnouncements,
  getStudentAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePinAnnouncement,
  getMyAnnouncements,
createTeacherAnnouncement,
} = require("../controllers/announcementController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   STUDENT ANNOUNCEMENTS

   Must be above "/:id" style routes.
===================================================== */

router.get(
  "/student",
  protect,
  authorize("STUDENT"),
  getStudentAnnouncements
);

/* =====================================================
   TEACHER - GET MY ANNOUNCEMENTS
===================================================== */

router.get(
  "/my-announcements",
  protect,
  authorize("TEACHER"),
  getMyAnnouncements
);

/* =====================================================
   TEACHER - CREATE ANNOUNCEMENT
===================================================== */

router.post(
  "/teacher",
  protect,
  authorize("TEACHER"),
  createTeacherAnnouncement
);

/* =====================================================
   GET ALL ANNOUNCEMENTS

   ADMIN ONLY
===================================================== */

router.get(
  "/",
  protect,
  authorize("ADMIN"),
  getAnnouncements
);

/* =====================================================
   CREATE ANNOUNCEMENT

   ADMIN ONLY
===================================================== */

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createAnnouncement
);

/* =====================================================
   UPDATE ANNOUNCEMENT

   ADMIN ONLY
===================================================== */

router.patch(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateAnnouncement
);

/* =====================================================
   DELETE ANNOUNCEMENT

   ADMIN ONLY
===================================================== */

router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  deleteAnnouncement
);

/* =====================================================
   PIN / UNPIN ANNOUNCEMENT

   ADMIN ONLY
===================================================== */

router.patch(
  "/:id/pin",
  protect,
  authorize("ADMIN"),
  togglePinAnnouncement
);

module.exports = router;