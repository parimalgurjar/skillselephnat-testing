
const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },

    batchTiming: {
      type: String,
      default: "",
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    attachment: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
      originalName: {
        type: String,
        default: "",
      },
      mimeType: {
        type: String,
        default: "",
      },
      size: {
        type: Number,
        default: 0,
      },
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    adminRemarks: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    attendanceMarkedDates: {
      type: [Date],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Validate leave date range
leaveRequestSchema.pre("validate", function () {
  if (
    this.startDate &&
    this.endDate &&
    this.startDate > this.endDate
  ) {
    this.invalidate(
      "endDate",
      "End date cannot be before start date."
    );
  }
});

// Student leave history
leaveRequestSchema.index({
  studentId: 1,
  createdAt: -1,
});

// Admin pending requests
leaveRequestSchema.index({
  status: 1,
  createdAt: -1,
});

// Prevent duplicate overlapping requests
leaveRequestSchema.index({
  studentId: 1,
  startDate: 1,
  endDate: 1,
  status: 1,
});

module.exports = mongoose.model(
  "LeaveRequest",
  leaveRequestSchema
);
