
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowLeft,
  KeyRound,
} from "lucide-react";

import { getSafeRedirectPath } from "../../utils/authRedirect";
import AlertModal from "../../components/common/AlertModal";
import { useAuth } from "../../context/AuthContext";

import {
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} from "../../services/authApi";

import "./Login.css";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "error",
    title: "Error",
    message: "",
  });

  const showAlert = (type, title, message) => {
    setAlertModal({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  const closeAlert = () => {
    setAlertModal((previous) => ({
      ...previous,
      isOpen: false,
    }));
  };

  // NORMAL LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      showAlert(
        "warning",
        "Missing Information",
        "Please enter your email and password."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await login({
        email: email.trim(),
        password,
      });

      const userRole = response?.user?.role;

      const redirectPath = getSafeRedirectPath(
        userRole,
        location.state?.from
      );

      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Login Error:", error);

      showAlert(
        "error",
        "Login Failed",
        error?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // OPEN FORGOT PASSWORD
  const openForgotPassword = () => {
    setForgotMode(true);
    setForgotStep(1);
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // BACK TO LOGIN
  const backToLogin = () => {
    setForgotMode(false);
    setForgotStep(1);
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // SEND OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      showAlert(
        "warning",
        "Email Required",
        "Please enter your registered email address."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPassword(cleanEmail);

      setEmail(cleanEmail);
      setForgotStep(2);

      showAlert(
        "success",
        "OTP Request Submitted",
        response?.message ||
          "If this email is registered, an OTP will be sent."
      );
    } catch (error) {
      showAlert(
        "error",
        "Unable to Send OTP",
        error?.message || "Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      showAlert(
        "warning",
        "Invalid OTP",
        "Please enter the complete 6-digit OTP."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await verifyResetOTP(
        email.trim().toLowerCase(),
        otp
      );

      if (!response?.resetToken) {
        throw new Error("Reset verification token was not received.");
      }

      setResetToken(response.resetToken);
      setForgotStep(3);
      setOtp("");

      showAlert(
        "success",
        "Email Verified",
        "Your OTP has been verified. You can now set a new password."
      );
    } catch (error) {
      showAlert(
        "error",
        "OTP Verification Failed",
        error?.message || "Incorrect or expired OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showAlert(
        "warning",
        "Weak Password",
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (newPassword.length > 128) {
      showAlert(
        "warning",
        "Password Too Long",
        "Password cannot exceed 128 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert(
        "warning",
        "Password Mismatch",
        "New password and confirm password do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(
        email.trim().toLowerCase(),
        resetToken,
        newPassword
      );

      setForgotMode(false);
      setForgotStep(1);
      setPassword("");
      setOtp("");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");

      showAlert(
        "success",
        "Password Reset Successful",
        response?.message ||
          "Your password has been changed. Please login with your new password."
      );
    } catch (error) {
      showAlert(
        "error",
        "Password Reset Failed",
        error?.message || "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT BRAND SECTION */}
      <div className="login-brand-section">
        <div className="login-brand">
          <img
            src="/logo/skillselephant-logo-white.png"
            alt="Skillselephant"
            className="login-brand-logo-image"
          />
        </div>

        <div className="login-brand-footer">
          © 2026 Skillselephant. All rights reserved.
        </div>
      </div>

      {/* RIGHT FORM SECTION */}
      <div className="login-form-section">
        <div className="login-form-container">

          {!forgotMode ? (
            <>
              <div className="login-form-header">
                <h1>Welcome back!</h1>
                <p>Sign in to access your learning portal.</p>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                {/* EMAIL */}
                <div className="login-form-group">
                  <label htmlFor="login-email">Email Address</label>

                  <div className="login-input-wrapper">
                    <Mail size={19} />

                    <input
                      id="login-email"
                      type="email"
                      className="login-input"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="login-form-group">
                  <label htmlFor="login-password">Password</label>

                  <div className="login-input-wrapper">
                    <Lock size={19} />

                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      className="login-input login-password-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                {/* FORGOT PASSWORD */}
                <div className="login-forgot-row">
                  <button
                    type="button"
                    className="login-forgot-link"
                    onClick={openForgotPassword}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* SIGN IN */}
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="login-bottom-section">
                <p className="login-help-text">
                  Use your registered email and password to access your account.
                </p>

                <p className="login-signup-text">
                  Don't have an account?{" "}
                  <Link to="/signup">Create Account</Link>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* BACK BUTTON */}
              <button
                type="button"
                className="forgot-back-button"
                onClick={
                  forgotStep === 1
                    ? backToLogin
                    : () => {
                        setForgotStep(1);
                        setOtp("");
                        setResetToken("");
                      }
                }
                disabled={loading}
              >
                <ArrowLeft size={17} />
                {forgotStep === 1 ? "Back to Login" : "Change Email"}
              </button>

              {/* FORGOT HEADER */}
              <div className="login-form-header forgot-form-header">
                <div className="forgot-icon">
                  {forgotStep === 1 ? (
                    <Mail size={25} />
                  ) : forgotStep === 2 ? (
                    <KeyRound size={25} />
                  ) : (
                    <Lock size={25} />
                  )}
                </div>

                <h1>
                  {forgotStep === 1
                    ? "Forgot Password?"
                    : forgotStep === 2
                    ? "Verify Your Email"
                    : "Create New Password"}
                </h1>

                <p>
                  {forgotStep === 1
                    ? "Enter your registered email address to receive a password reset OTP."
                    : forgotStep === 2
                    ? `Enter the 6-digit OTP sent to ${email}.`
                    : "Your email has been verified. Create a new password for your account."}
                </p>
              </div>

              {/* STEP 1: EMAIL */}
              {forgotStep === 1 && (
                <form className="login-form" onSubmit={handleSendOTP}>
                  <div className="login-form-group">
                    <label htmlFor="forgot-email">
                      Registered Email Address
                    </label>

                    <div className="login-input-wrapper">
                      <Mail size={19} />

                      <input
                        id="forgot-email"
                        type="email"
                        className="login-input"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </form>
              )}

              {/* STEP 2: OTP */}
              {forgotStep === 2 && (
                <form className="login-form" onSubmit={handleVerifyOTP}>
                  <div className="login-form-group">
                    <label htmlFor="reset-otp">6-Digit OTP</label>

                    <div className="login-input-wrapper">
                      <KeyRound size={19} />

                      <input
                        id="reset-otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="login-input otp-input"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) =>
                          setOtp(
                            e.target.value.replace(/\D/g, "").slice(0, 6)
                          )
                        }
                        required
                        autoComplete="one-time-code"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <p className="forgot-step-note">
                    OTP is valid for 10 minutes.
                  </p>

                  <button
                    type="button"
                    className="login-forgot-link forgot-resend-button"
                    onClick={handleSendOTP}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                </form>
              )}

              {/* STEP 3: NEW PASSWORD */}
              {forgotStep === 3 && (
                <form className="login-form" onSubmit={handleResetPassword}>
                  <div className="login-form-group">
                    <label htmlFor="new-password">New Password</label>

                    <div className="login-input-wrapper">
                      <Lock size={19} />

                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        className="login-input login-password-input"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                        maxLength={128}
                        required
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowNewPassword((previous) => !previous)
                        }
                        aria-label={
                          showNewPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showNewPassword ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="confirm-password">
                      Confirm New Password
                    </label>

                    <div className="login-input-wrapper">
                      <Lock size={19} />

                      <input
                        id="confirm-password"
                        type="password"
                        className="login-input"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                        maxLength={128}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                  >
                    {loading ? "Updating Password..." : "Reset Password"}
                  </button>
                </form>
              )}

              <div className="forgot-security-note">
                <Lock size={14} />
                <span>
                  Your password reset is protected by email verification.
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
      />
    </div>
  );
};

export default Login;
