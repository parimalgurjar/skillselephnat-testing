const mongoose = require("mongoose");

const studentTaskProgressSchema =
  new mongoose.Schema(
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TaskReportTask",
        required: true,
      },

      status: {
        type: String,
        enum: [
          "NOT_STARTED",
          "PENDING",
          "COMPLETED",
          "REJECTED",
        ],
        default: "NOT_STARTED",
      },

      submittedAt: {
        type: Date,
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      rejectionReason: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );

/* One progress record per student per task */

studentTaskProgressSchema.index(
  {
    studentId: 1,
    taskId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "StudentTaskProgress",
  studentTaskProgressSchema
);