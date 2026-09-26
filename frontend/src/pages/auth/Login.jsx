import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { getSafeRedirectPath } from "../../utils/authRedirect";

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";

import AlertModal from "../../components/common/AlertModal";
import { useAuth } from "../../context/AuthContext";

import "./Login.css";

const Login = () => {
  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "error",
    title: "Error",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setAlertModal({
        isOpen: true,
        type: "warning",
        title: "Missing Information",
        message: "Please enter your email and password.",
      });

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

      navigate(redirectPath, {
        replace: true,
      });
    } catch (error) {
      console.error("Login Error:", error);

      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Login Failed",
        message:
          error?.message ||
          "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* =====================================================
          LEFT BRAND SECTION
      ===================================================== */}

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

      {/* =====================================================
          RIGHT LOGIN SECTION
      ===================================================== */}

      <div className="login-form-section">

        <div className="login-form-container">

          <div className="login-form-header">

            <h1>
              Welcome back!
            </h1>

            <p>
              Sign in to access your learning portal.
            </p>

          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            {/* EMAIL */}

            <div className="login-form-group">

              <label htmlFor="login-email">
                Email Address
              </label>

              <div className="login-input-wrapper">

                <Mail size={19} />

                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="login-form-group">

              <label htmlFor="login-password">
                Password
              </label>

              <div className="login-input-wrapper">

                <Lock size={19} />

                <input
                  id="login-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  className="login-input login-password-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
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

            {/* SIGN IN */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

          <div className="login-bottom-section">

            <p className="login-help-text">
              Use your registered email and password
              to access your account.
            </p>

            <p className="login-signup-text">
              Don't have an account?{" "}

              <Link to="/signup">
                Create Account
              </Link>
            </p>

          </div>

        </div>

      </div>

      {/* ALERT */}

      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() =>
          setAlertModal((previous) => ({
            ...previous,
            isOpen: false,
          }))
        }
      />

    </div>
  );
};

export default Login;