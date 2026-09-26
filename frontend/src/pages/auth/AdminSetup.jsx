import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";
import "./AdminSetup.css";

const AdminSetup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();

    if (!name || !email || !formData.password || !formData.confirmPassword) {
      setError("Please fill all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/admin-setup", {
        name,
        email,
        phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(
        response.data?.message ||
          "Admin account created successfully. You can now login."
      );

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to complete admin setup. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-setup-page">
      <div className="admin-setup-background">
        <div className="admin-setup-orb admin-setup-orb-one" />
        <div className="admin-setup-orb admin-setup-orb-two" />
      </div>

      <div className="admin-setup-container">
        <div className="admin-setup-brand">
  <img
    src="/logo/skillselephant-logo-white.png"
    alt="Skillselephant"
    className="admin-setup-brand-logo"
  />

  <div className="admin-setup-brand-message">
    <h2>Welcome to Skillselephant</h2>

    <p>
      Set up your learning management portal
      and get started with practical digital learning.
    </p>
  </div>
</div>

        <div className="admin-setup-card">
          <div className="admin-setup-header">
            <div className="admin-setup-title-icon">
              <ShieldCheck size={28} />
            </div>

            <div>
              <h2>Create Admin Account</h2>
              <p>
                Set up the first administrator account for your
                Skillselephant portal.
              </p>
            </div>
          </div>

          <div className="admin-setup-notice">
            <ShieldCheck size={18} />

            <div>
              <strong>One-time setup</strong>
              <span>
                This registration is available only before the first
                administrator account is created.
              </span>
            </div>
          </div>

          {error && (
            <div className="admin-setup-alert admin-setup-alert-error">
              <AlertCircle size={19} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="admin-setup-alert admin-setup-alert-success">
              <CheckCircle2 size={19} />

              <div>
                <span>{success}</span>

                <Link to="/login">
                  Go to Login
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-setup-form">
            <div className="admin-setup-field">
              <label htmlFor="admin-name">
                Full Name <span>*</span>
              </label>

              <div className="admin-setup-input">
                <User size={19} />

                <input
                  id="admin-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter admin full name"
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="admin-setup-field">
              <label htmlFor="admin-email">
                Email Address <span>*</span>
              </label>

              <div className="admin-setup-input">
                <Mail size={19} />

                <input
                  id="admin-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="admin-setup-field">
              <label htmlFor="admin-phone">Phone Number</label>

              <div className="admin-setup-input">
                <Phone size={19} />

                <input
                  id="admin-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="admin-setup-form-row">
              <div className="admin-setup-field">
                <label htmlFor="admin-password">
                  Password <span>*</span>
                </label>

                <div className="admin-setup-input">
                  <Lock size={19} />

                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="admin-setup-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="admin-setup-field">
                <label htmlFor="admin-confirm-password">
                  Confirm Password <span>*</span>
                </label>

                <div className="admin-setup-input">
                  <Lock size={19} />

                  <input
                    id="admin-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="admin-setup-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="admin-setup-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="admin-setup-spinner" />
                  Creating Admin...
                </>
              ) : (
                <>
                  Create Admin Account
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="admin-setup-footer">
            <span>Already have an account?</span>

            <Link to="/login">
              Login
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <p className="admin-setup-security">
          <ShieldCheck size={15} />
          Secure administrator registration
        </p>
      </div>
    </div>
  );
};

export default AdminSetup;