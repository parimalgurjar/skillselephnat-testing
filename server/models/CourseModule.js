const mongoose = require("mongoose");

const courseModuleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    moduleNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },
  
    description: {
  type: String,
  default: "",
},
durationDays: {
  type: Number,
  required: true,
  min: 1,
  default: 1,
},
externalUrl: {
  type: String,
  default: "",
  trim: true,
},



    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

courseModuleSchema.index(
  { courseId: 1, moduleNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("CourseModule", courseModuleSchema);