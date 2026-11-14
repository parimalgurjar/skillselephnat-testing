
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const { sendOTPEmail } = require("../services/emailService");

const hashValue = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const GENERIC_OTP_MESSAGE =
  "If this email is registered, an OTP will be sent.";

// STEP 1: SEND OTP
const forgotPassword = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address.",
      });
    }

    const user = await User.findOne({ email }).select("_id");

    // Same response for registered and unregistered emails.
    if (!user) {
      return res.json({
        success: true,
        message: GENERIC_OTP_MESSAGE,
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const now = new Date();

    await PasswordReset.findOneAndUpdate(
      { email },
      {
        $set: {
          otpHash: hashValue(otp),
          otpExpiresAt: new Date(now.getTime() + 10 * 60 * 1000),
          attempts: 0,
          verifiedTokenHash: "",
          verifiedTokenExpiresAt: null,
          expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      await PasswordReset.deleteOne({ email });

      console.error("OTP Email Error:", emailError.message);

      return res.status(500).json({
        success: false,
        message: "Unable to send OTP. Please try again later.",
      });
    }

    return res.json({
      success: true,
      message: GENERIC_OTP_MESSAGE,
    });
  } catch (error) {
    console.error("Forgot Password Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process your request. Please try again.",
    });
  }
};

// STEP 2: VERIFY OTP
const verifyResetOTP = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const otp =
      typeof req.body.otp === "string"
        ? req.body.otp.trim()
        : "";

    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email and 6-digit OTP.",
      });
    }

    const record = await PasswordReset.findOne({ email });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired. Please request a new OTP.",
      });
    }

    if (record.attempts >= 5) {
      await PasswordReset.deleteOne({ email });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Request a new OTP.",
      });
    }

    if (record.otpExpiresAt <= new Date()) {
      await PasswordReset.deleteOne({ email });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    const submittedHash = hashValue(otp);

    if (submittedHash !== record.otpHash) {
      const updated = await PasswordReset.findOneAndUpdate(
        {
          _id: record._id,
          attempts: { $lt: 5 },
          otpHash: record.otpHash,
        },
        { $inc: { attempts: 1 } },
        { new: true }
      );

      if (updated && updated.attempts >= 5) {
        await PasswordReset.deleteOne({ _id: record._id });
      }

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP. Please try again.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    // Consume the OTP atomically. It cannot be verified again.
    const verifiedRecord = await PasswordReset.findOneAndUpdate(
      {
        _id: record._id,
        otpHash: submittedHash,
        otpExpiresAt: { $gt: new Date() },
        attempts: { $lt: 5 },
        verifiedTokenHash: "",
      },
      {
        $set: {
          otpHash: hashValue(crypto.randomBytes(32).toString("hex")),
          verifiedTokenHash: hashValue(resetToken),
          verifiedTokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      },
      { new: true }
    );

    if (!verifiedRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid, expired, or already used.",
      });
    }

    return res.json({
      success: true,
      message: "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP. Please try again.",
    });
  }
};

// STEP 3: RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const resetToken =
      typeof req.body.resetToken === "string"
        ? req.body.resetToken
        : "";

    const newPassword =
      typeof req.body.newPassword === "string"
        ? req.body.newPassword
        : "";

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (newPassword.length < 6 || newPassword.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 6 and 128 characters.",
      });
    }

    const tokenHash = hashValue(resetToken);
    const now = new Date();

    // Claim the reset token atomically so it can only be used once.
    const claimedRecord = await PasswordReset.findOneAndUpdate(
      {
        email,
        verifiedTokenHash: tokenHash,
        verifiedTokenExpiresAt: { $gt: now },
      },
      {
        $set: {
          verifiedTokenHash: "",
          verifiedTokenExpiresAt: null,
        },
      },
      { new: true }
    );

    if (!claimedRecord) {
      return res.status(400).json({
        success: false,
        message: "Password reset session is invalid, expired, or already used. Please request a new OTP.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      await PasswordReset.deleteOne({ email });

      return res.status(400).json({
        success: false,
        message: "Unable to reset password.",
      });
    }

    // Match the existing login/change-password bcrypt cost.
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    await PasswordReset.deleteOne({ email });

    return res.json({
      success: true,
      message: "Password reset successfully. You can now login.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password. Please try again.",
    });
  }
};

module.exports = {
  forgotPassword,
  verifyResetOTP,
  resetPassword,
};
