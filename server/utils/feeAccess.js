
const StudentFee = require("../models/StudentFee");
const User = require("../models/User");

const FEE_DEADLINE_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;

const getFeeDeadline = (feeStartDate) =>
  new Date(
    new Date(feeStartDate).getTime() +
      FEE_DEADLINE_DAYS * DAY_MS
  );

const getDaysRemaining = (deadline) =>
  Math.max(
    0,
    Math.ceil(
      (new Date(deadline).getTime() - Date.now()) /
        DAY_MS
    )
  );

const refreshStudentFeeAccess = async (student) => {
  if (!student || student.role !== "STUDENT") {
    return { blocked: false, fee: null };
  }

  const fee = await StudentFee.findOne({
    studentId: student._id,
  });

  // Fee has not been configured yet.
  if (!fee) {
    return {
      blocked: Boolean(student.feeAccessBlocked),
      fee: null,
    };
  }

  const paidAmount = fee.installments.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const isCompleted = paidAmount >= fee.totalFee;
  const deadline = getFeeDeadline(fee.feeStartDate);
  const isOverdue = Date.now() >= deadline.getTime();

  if (isCompleted) {
    if (
      student.feeAccessBlocked ||
      student.feeAccessOverride
    ) {
      await User.updateOne(
        { _id: student._id },
        {
          $set: {
            feeAccessBlocked: false,
            feeAccessOverride: false,
          },
        }
      );

      student.feeAccessBlocked = false;
      student.feeAccessOverride = false;
    }

    return { blocked: false, fee };
  }

  if (
    isOverdue &&
    !student.feeAccessOverride &&
    !student.feeAccessBlocked
  ) {
    await User.updateOne(
      { _id: student._id },
      { $set: { feeAccessBlocked: true } }
    );

    student.feeAccessBlocked = true;
  }

  return {
    blocked:
      Boolean(student.feeAccessBlocked) &&
      !student.feeAccessOverride,
    fee,
  };
};

module.exports = {
  FEE_DEADLINE_DAYS,
  getFeeDeadline,
  getDaysRemaining,
  refreshStudentFeeAccess,
};
