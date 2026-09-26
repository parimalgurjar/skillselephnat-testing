const mongoose = require("mongoose");

const specializationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
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

specializationSchema.index(
  { name: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "Specialization",
  specializationSchema
);