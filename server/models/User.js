const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    /* =====================================================
       COMMON USER INFORMATION
    ===================================================== */

    name: {
      type: String,
      required: true,
      trim: true,
    },

   email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,

  match: [
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    "Please enter a valid email address",
  ],
},

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
      trim: true,
    },

    /* =====================================================
       USER ROLE
    ===================================================== */

    role: {
      type: String,
      enum: ["ADMIN", "TEACHER", "STUDENT"],
      required: true,
    },

    /* =====================================================
       STUDENT INFORMATION
    ===================================================== */

    /*
      CANONICAL STUDENT -> BATCH RELATION

      This ObjectId is the single source of truth.

      batchTiming below is only a denormalized
      compatibility/display field.
    */

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true,
    },

    /*
      Legacy compatibility/display value.

      Never use this as batch identity.

      Always fetch actual batch from batchId.
    */

    batchTiming: {
      type: String,
      default: "",
      trim: true,
    },

    /*
      Student's assigned course
    */

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },

    /*
      Student's primary assigned teacher
    */

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
      Task Report Review Teachers

      Admin can assign multiple teachers.

      Only assigned teachers can review
      this student's Task Report submissions.
    */

    taskReportTeacherIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /* =====================================================
       TEACHER INFORMATION
    ===================================================== */

    specializations: {
      type: [String],
      default: [],
    },

    /* =====================================================
       JOINING INFORMATION
    ===================================================== */

    joiningDate: {
      type: Date,
      default: null,
    },

    /* =====================================================
       ACCOUNT STATUS
    ===================================================== */

    status: {
      type: String,

      enum: [
        "PENDING",
        "ACTIVE",
        "INACTIVE",
        "REJECTED",
        "SUSPENDED",
      ],

      default: "PENDING",
    },

    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "User",
  userSchema
);