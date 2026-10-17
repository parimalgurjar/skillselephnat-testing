
const mongoose = require("mongoose");

const installmentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    paidAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
  },
  { timestamps: true }
);

const studentFeeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    totalFee: {
      type: Number,
      required: true,
      min: 1,
    },

    feeStartDate: {
      type: Date,
      required: true,
    },

    installments: {
      type: [installmentSchema],
      default: [],
    },

    lastAccessRestoredAt: {
      type: Date,
      default: null,
    },

    lastAccessRestoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);
studentFeeSchema.set("optimisticConcurrency", true);
studentFeeSchema.virtual("paidAmount").get(function () {
  return this.installments.reduce(
    (total, installment) => total + installment.amount,
    0
  );
});

studentFeeSchema.virtual("balanceAmount").get(function () {
  return Math.max(0, this.totalFee - this.paidAmount);
});

studentFeeSchema.virtual("status").get(function () {
  return this.paidAmount >= this.totalFee
    ? "COMPLETED"
    : "PENDING";
});

studentFeeSchema.set("toJSON", { virtuals: true });
studentFeeSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("StudentFee", studentFeeSchema);
