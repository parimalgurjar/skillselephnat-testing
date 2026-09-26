const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
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

    audience: {
      type: String,
      enum: ["STUDENTS", "TEACHERS", "EVERYONE"],
      default: "EVERYONE",
    },

    /*
      =====================================================
      CANONICAL BATCH RELATION

      Never store batch timing/name as identity.

      Always use Batch ObjectId.
      =====================================================
    */

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true,
    },

    priority: {
      type: String,
      enum: ["NORMAL", "IMPORTANT", "URGENT"],
      default: "NORMAL",
    },

    pinned: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["PUBLISHED", "DRAFT"],
      default: "PUBLISHED",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Announcement",
  announcementSchema
);