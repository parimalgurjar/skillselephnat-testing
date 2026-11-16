
const mongoose = require("mongoose");

const studentCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    sequence: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports =
  mongoose.models.StudentCounter ||
  mongoose.model("StudentCounter", studentCounterSchema);
