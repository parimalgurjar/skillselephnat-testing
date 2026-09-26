const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    /* ===============================================
       STUDENT
    =============================================== */

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ===============================================
       CANONICAL BATCH RELATION

       SOURCE OF TRUTH:
       Actual Batch._id

       Never identify a batch using batchTiming.
    =============================================== */

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },

    /* ===============================================
       LEGACY / DISPLAY SNAPSHOT
    =============================================== */

    batchTiming: {
      type: String,
      default: "",
      trim: true,
    },

    /* ===============================================
       ATTENDANCE DATE
    =============================================== */

    date: {
      type: Date,
      required: true,
      index: true,
    },

    /* ===============================================
       STATUS
    =============================================== */

    status: {
      type: String,
      enum: ["PRESENT", "ABSENT"],
      required: true,
    },

    /* ===============================================
       MARKED BY

       Original teacher/admin who first marked
       this attendance.

       This value must never change on edit.
    =============================================== */

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ===============================================
       FIRST MARKED TIME

       Used for 12-hour teacher edit window.

       This value must remain unchanged after edits.
    =============================================== */

    markedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* =====================================================
   INDEXES
===================================================== */

/*
  One attendance record per student
  per batch per day.
*/

attendanceSchema.index(
  {
    studentId: 1,
    batchId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

/*
  Faster batch/date attendance lookup.
*/

attendanceSchema.index({
  batchId: 1,
  date: 1,
});

/*
  Useful for finding attendance ownership
  and teacher activity.
*/

attendanceSchema.index({
  markedBy: 1,
  markedAt: 1,
});

/* =====================================================
   MODEL
===================================================== */

module.exports = mongoose.model(
  "Attendance",
  attendanceSchema
);