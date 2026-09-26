const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    /* =============================================
       BATCH BASIC DETAILS
    ============================================= */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    /* =============================================
       MAIN EDUCATOR / BATCH COORDINATOR
    ============================================= */

    educator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* =============================================
       ATTENDANCE TEACHERS
    ============================================= */

    attendanceTeachers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },

    /* =============================================
       BATCH CAPACITY
    ============================================= */

    capacity: {
      type: Number,
      required: true,
      default: 55,
      min: 1,
    },

    /* =============================================
       BATCH TIMING
    ============================================= */

    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    batchTiming: {
      type: String,
      required: true,
      trim: true,
    },

    /* =============================================
       CLASS DAYS
    ============================================= */

    classDays: {
      type: [
        {
          type: String,
          enum: [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
          ],
        },
      ],
      default: [],
    },

    /* =============================================
       BATCH START DATE
    ============================================= */

    startDate: {
      type: Date,
      required: true,
    },

    /* =============================================
       BATCH STATUS
    ============================================= */

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "INACTIVE",
        "UPCOMING",
        "COMPLETED",
      ],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

/* =============================================
   INDEXES
============================================= */

batchSchema.index({
  status: 1,
});

batchSchema.index({
  educator: 1,
});

batchSchema.index({
  attendanceTeachers: 1,
});

/* =============================================
   EXPORT MODEL
============================================= */

module.exports = mongoose.model(
  "Batch",
  batchSchema
);