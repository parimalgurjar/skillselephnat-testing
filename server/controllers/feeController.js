
const mongoose = require("mongoose");
const User = require("../models/User");
const StudentFee = require("../models/StudentFee");
const {
  FEE_DEADLINE_DAYS,
  getFeeDeadline,
  getDaysRemaining,
  refreshStudentFeeAccess,
} = require("../utils/feeAccess");

const getPaidAmount = (fee) =>
  fee.installments.reduce(
    (sum, item) => sum + item.amount,
    0
  );

const canManageStudentFee = async (req, student) => {
  if (req.user.role === "ADMIN") {
    return true;
  }

  // Fee-enabled teachers can manage fees for every institute student.
  // Student-level teacherId assignment is not required.
  return (
    req.user.role === "TEACHER" &&
    req.user.canManageFees === true
  );
};

// Student endpoint: never returns fee amounts.
const getMyFeeStatus = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    const { fee } = await refreshStudentFeeAccess(student);

    if (!fee) {
      return res.json({
        success: true,
        fee: {
          status: "PENDING",
          deadline: null,
          daysRemaining: null,
        },
      });
    }

    const paidAmount = getPaidAmount(fee);
    const deadline = getFeeDeadline(fee.feeStartDate);

    return res.json({
      success: true,
      fee: {
        status:
          paidAmount >= fee.totalFee
            ? "COMPLETED"
            : "PENDING",
        deadline,
        daysRemaining:
          paidAmount >= fee.totalFee
            ? 0
            : getDaysRemaining(deadline),
      },
    });
  } catch (error) {
    console.error("Get Student Fee Status:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load fee status",
    });
  }
};

// Admin or permitted teacher: list only their allowed students.
// Admin or fee-enabled teacher: list institute-wide student fee records.
const listStudentFees = async (req, res) => {
  try {
    if (
      req.user.role === "TEACHER" &&
      req.user.canManageFees !== true
    ) {
      return res.status(403).json({
        success: false,
        message: "Fee management permission is required",
      });
    }

    // IMPORTANT:
    // Do not filter students by teacherId.
    // A fee-enabled teacher can manage every institute student.
    const students = await User.find({
  role: "STUDENT",
})
  .select(
    "name email phone batchId batchTiming joiningDate feeAccessBlocked"
  )
  .populate(
    "batchId",
    "name code batchTiming startTime endTime"
  )
  .sort({ name: 1 })
  .lean();

    const fees = await StudentFee.find({
      studentId: {
        $in: students.map((student) => student._id),
      },
    }).lean();

    const feeMap = new Map(
      fees.map((fee) => [String(fee.studentId), fee])
    );

    return res.status(200).json({
      success: true,
      count: students.length,

      students: students.map((student) => {
        const fee = feeMap.get(String(student._id));

        // Use actual batch details first; timing is a fallback.
        const formattedStudent = {
          ...student,
          batchTiming:
            student.batchId?.batchTiming ||
            student.batchTiming ||
            "",
        };

        if (!fee) {
          return {
            student: formattedStudent,
            configured: false,
            totalFee: 0,
            paidAmount: 0,
            balanceAmount: 0,
            status: "PENDING",
            deadline: null,
            daysRemaining: null,
            installments: [],
          };
        }

        const paidAmount = getPaidAmount(fee);
        const deadline = getFeeDeadline(fee.feeStartDate);
        const completed = paidAmount >= fee.totalFee;

        return {
          student: formattedStudent,
          configured: true,
          totalFee: fee.totalFee,
          paidAmount,
          balanceAmount: Math.max(
            0,
            fee.totalFee - paidAmount
          ),
          status: completed ? "COMPLETED" : "PENDING",
          deadline,
          daysRemaining: completed
            ? 0
            : getDaysRemaining(deadline),
          installments: fee.installments || [],
        };
      }),
    });
  } catch (error) {
    console.error("List Student Fees Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load student fees",
    });
  }
};

// Admin or permitted teacher: set/update an individual student's fee.
const setStudentFee = async (req, res) => {
  try {
    const { studentId } = req.params;
    const totalFee = Number(req.body.totalFee);

    if (
      !mongoose.isValidObjectId(studentId) ||
      !Number.isFinite(totalFee) ||
      totalFee <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid student ID and total fee are required",
      });
    }

    const student = await User.findOne({
      _id: studentId,
      role: "STUDENT",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!(await canManageStudentFee(req, student))) {
      return res.status(403).json({
        success: false,
        message: "You cannot manage this student's fee",
      });
    }

    let fee = await StudentFee.findOne({ studentId });

    if (!fee) {
      fee = await StudentFee.create({
        studentId,
        totalFee,
        feeStartDate: new Date(),
        installments: [],
      });
    } else {
      const alreadyPaid = getPaidAmount(fee);

      if (totalFee < alreadyPaid) {
        return res.status(400).json({
          success: false,
          message: "Total fee cannot be less than the amount already paid",
        });
      }

      fee.totalFee = totalFee;
      await fee.save();
    }

    return res.json({
      success: true,
      message: "Student fee saved successfully",
    });
  } catch (error) {
    console.error("Set Student Fee:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to save student fee",
    });
  }
};

// Record one installment; payment amounts are validated server-side.
const addInstallment = async (req, res) => {
  try {
    const { studentId } = req.params;
    const amount = Number(req.body.amount);
    const note =
      typeof req.body.note === "string"
        ? req.body.note.trim()
        : "";

    if (
      !mongoose.isValidObjectId(studentId) ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid student ID and payment amount are required",
      });
    }

    const student = await User.findOne({
      _id: studentId,
      role: "STUDENT",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!(await canManageStudentFee(req, student))) {
      return res.status(403).json({
        success: false,
        message: "You cannot manage this student's fee",
      });
    }

    const fee = await StudentFee.findOne({ studentId });

    if (!fee) {
      return res.status(400).json({
        success: false,
        message: "Set the student's total fee first",
      });
    }

    const balance = fee.totalFee - getPaidAmount(fee);

    if (amount > balance) {
      return res.status(400).json({
        success: false,
        message: "Payment cannot exceed the remaining balance",
      });
    }

    fee.installments.push({
      amount,
      paidAt: new Date(),
      recordedBy: req.user._id,
      note,
    });

    await fee.save();

    const newPaidAmount = getPaidAmount(fee);

    if (newPaidAmount >= fee.totalFee) {
      await User.updateOne(
        { _id: studentId },
        {
          $set: {
            feeAccessBlocked: false,
            feeAccessOverride: false,
          },
        }
      );
    }

    return res.json({
      success: true,
      message: "Installment recorded successfully",
    });
  } catch (error) {
    console.error("Add Fee Installment:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to record installment",
    });
  }
};

// Admin-only manual access restoration after fee overdue.
const restoreStudentAccess = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await User.findOne({
      _id: studentId,
      role: "STUDENT",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    student.feeAccessBlocked = false;
    student.feeAccessOverride = true;
    await student.save();

    const fee = await StudentFee.findOne({ studentId });

    if (fee) {
      fee.lastAccessRestoredAt = new Date();
      fee.lastAccessRestoredBy = req.user._id;
      await fee.save();
    }

    return res.json({
      success: true,
      message: "Student portal access restored",
    });
  } catch (error) {
    console.error("Restore Student Access:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to restore student access",
    });
  }
};

const updateTeacherFeePermission = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { canManageFees } = req.body;

    if (
      !mongoose.isValidObjectId(teacherId) ||
      typeof canManageFees !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid teacher ID and permission are required",
      });
    }

    const teacher = await User.findOneAndUpdate(
      { _id: teacherId, role: "TEACHER" },
      { $set: { canManageFees } },
      { returnDocument: "after" }
    ).select("_id name email canManageFees");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    return res.json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error("Update Teacher Fee Permission:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update teacher permission",
    });
  }
};

module.exports = {
  getMyFeeStatus,
  listStudentFees,
  setStudentFee,
  addInstallment,
  restoreStudentAccess,
  updateTeacherFeePermission,
};
