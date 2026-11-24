
const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    resourceType: {
      type: String,
      enum: [
        "GOOGLE_SHEETS",
        "GOOGLE_DOCS",
        "GOOGLE_DRIVE",
        "PDF",
        "EXCEL",
        "OTHER",
      ],
      required: true,
    },

    resourceUrl: {
      type: String,
      required: true,
      trim: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    modules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseModule",
      },
    ],

    status: {
      type: String,
      enum: ["PUBLISHED", "DRAFT"],
      default: "PUBLISHED",
      index: true,
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

resourceSchema.index({
  courseId: 1,
  status: 1,
});

resourceSchema.index({
  modules: 1,
  status: 1,
});

module.exports = mongoose.model("Resource", resourceSchema);
