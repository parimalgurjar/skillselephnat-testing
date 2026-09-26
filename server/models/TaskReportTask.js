const mongoose = require("mongoose");

const taskReportTaskSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskCategory",
      required: true,
    },

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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

taskReportTaskSchema.index({
  categoryId: 1,
  order: 1,
});

module.exports = mongoose.model(
  "TaskReportTask",
  taskReportTaskSchema
);