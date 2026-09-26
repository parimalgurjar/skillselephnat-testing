const mongoose = require("mongoose");

/* =====================================================
   TASK ITEM SCHEMA

   Admin creates multiple checklist items
===================================================== */

const taskItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true,
  }
);

/* =====================================================
   STUDENT SUBMISSION SCHEMA
===================================================== */

const submissionSchema = new mongoose.Schema(
  {
    /* ================= STUDENT ================= */

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ================= COMPLETED TASKS =================

       Array contains task item IDs
       that student marked as completed
    ================================================= */

    completedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],

    /* ================= SCORE ================= */

    completedCount: {
      type: Number,
      default: 0,
    },

    totalTasks: {
      type: Number,
      default: 0,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    /* ================= STUDENT SUBMISSION ================= */

    submittedAt: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    /* ================= APPROVAL STATUS =================

       DRAFT
       → Student is still working

       PENDING
       → Student submitted
       → Waiting for teacher

       APPROVED
       → Teacher approved
       → Dashboard performance updates

       REJECTED
       → Teacher rejected
       → Student can improve and submit again
    ================================================= */

    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED"],
      default: "DRAFT",
    },

    /* ================= TEACHER REVIEW ================= */

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    teacherRemarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
  }
);

/* =====================================================
   MAIN TASK SCHEMA
===================================================== */

const taskSchema = new mongoose.Schema(
  {
    /* ================= TASK DETAILS ================= */

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    /* ================= BATCH =================

       Canonical relationship:

       Task.batchId
            ↓
       Batch._id

       Never use batch timing/name as
       the database relationship key.
    ================================================= */

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },

    /* ================= TASK CHECKLIST ================= */

    tasks: {
      type: [taskItemSchema],

      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },

        message: "At least one task is required",
      },
    },

    /* ================= DUE DATE ================= */

    dueDate: {
      type: Date,
      required: true,
    },

    /* ================= PRIORITY ================= */

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    /* ================= TASK STATUS ================= */

    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "DRAFT"],
      default: "ACTIVE",
    },

    /* ================= STUDENT SUBMISSIONS ================= */

    submissions: {
      type: [submissionSchema],
      default: [],
    },

    /* ================= CREATED BY ================= */

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

module.exports = mongoose.model("Task", taskSchema);