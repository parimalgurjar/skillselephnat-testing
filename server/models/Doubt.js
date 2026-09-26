const mongoose = require("mongoose");

/* =====================================================
   REPLY SCHEMA
===================================================== */

const replySchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    attachments: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

/* =====================================================
   DOUBT SCHEMA
===================================================== */

const doubtSchema = new mongoose.Schema(
  {
    /* ================= STUDENT ================= */

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ================= DOUBT DETAILS ================= */

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    /* ================= ATTACHMENTS ================= */

    attachments: [
      {
        type: String,
      },
    ],

    /* ================= AUTO ASSIGNED TEACHER ================= */

    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ================= STATUS ================= */

    status: {
      type: String,
      enum: [
        "PENDING",
        "IN_PROGRESS",
        "RESOLVED",
      ],
      default: "PENDING",
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    /* ================= CONVERSATION ================= */

    replies: {
      type: [replySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Doubt",
  doubtSchema
);