import { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import AlertModal from "../../components/common/AlertModal";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  User,
  Users,
  CheckCircle2,
  Check,
  ChevronDown,
} from "lucide-react";

import { registerUser } from "../../services/authApi";
import { getActiveSpecializations } from "../../services/specializationApi";

import "./Signup.css";

const Signup = () => {
  const [role, setRole] = useState("STUDENT");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [batches, setBatches] = useState([]);

  const [batchesLoading, setBatchesLoading] = useState(true);

  const [specializations, setSpecializations] = useState([]);

  const [specializationsLoading, setSpecializationsLoading] =
    useState(false);

  const [showSpecializations, setShowSpecializations] =
    useState(false);

  const [success, setSuccess] = useState(false);

  // ALERT MODAL STATE
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "error",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    batchId: "",
    specializations: [],
  });

  /* =====================================================
     LOAD ACTIVE BATCHES FOR SIGNUP
  ===================================================== */

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setBatchesLoading(true);

        // PUBLIC ROUTE
        // No login/token required
        const response = await api.get("/batches/public");

        setBatches(response.data?.batches || []);
      } catch (error) {
        console.error(
          "Batch Load Error:",
          error.response?.data || error
        );

        setBatches([]);
      } finally {
        setBatchesLoading(false);
      }
    };

    loadBatches();
  }, []);

  /* =====================================================
     LOAD ACTIVE SPECIALIZATIONS
     
     Only required for Teacher signup.
     
     Source:
     Admin → Specializations
  ===================================================== */

  useEffect(() => {
    if (role !== "TEACHER") {
      return;
    }

    const loadSpecializations = async () => {
      try {
        setSpecializationsLoading(true);

        const response =
          await getActiveSpecializations();

        setSpecializations(
          response?.specializations || []
        );
      } catch (error) {
        console.error(
          "Specialization Load Error:",
          error.response?.data || error
        );

        setSpecializations([]);

        setAlertModal({
          isOpen: true,
          type: "error",
          title: "Unable to Load Specializations",
          message:
            "Specializations could not be loaded. Please try again.",
        });
      } finally {
        setSpecializationsLoading(false);
      }
    };

    loadSpecializations();
  }, [role]);

  /* =====================================================
     HANDLE INPUT CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
     HANDLE ROLE CHANGE
  ===================================================== */

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);

    setShowSpecializations(false);

    setFormData((previous) => ({
      ...previous,
      batchId: "",
      specializations: [],
    }));
  };

  /* =====================================================
     HANDLE SPECIALIZATION SELECT / UNSELECT
  ===================================================== */

  const handleSpecializationToggle = (name) => {
    setFormData((previous) => {
      const alreadySelected =
        previous.specializations.includes(name);

      return {
        ...previous,
        specializations: alreadySelected
          ? previous.specializations.filter(
              (item) => item !== name
            )
          : [
              ...previous.specializations,
              name,
            ],
      };
    });
  };

  /* =====================================================
     REMOVE SELECTED SPECIALIZATION
  ===================================================== */

  const removeSpecialization = (name) => {
    setFormData((previous) => ({
      ...previous,
      specializations:
        previous.specializations.filter(
          (item) => item !== name
        ),
    }));
  };

  /* =====================================================
     HANDLE SIGNUP
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    /* =================================================
       TEACHER VALIDATION
    ================================================= */

    if (
      role === "TEACHER" &&
      formData.specializations.length === 0
    ) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Specialization Required",
        message:
          "Please select at least one specialization.",
      });

      return;
    }

    /* =================================================
       STUDENT BATCH VALIDATION
    ================================================= */

    if (
      role === "STUDENT" &&
      !formData.batchId
    ) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Batch Required",
        message:
          "Please select your batch timing.",
      });

      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role,
      };

      /* =================================================
         STUDENT DATA
      ================================================= */

      if (role === "STUDENT") {
        payload.batchId = formData.batchId;
      }

      /* =================================================
         TEACHER DATA

         Already an array — no comma splitting.
      ================================================= */

      if (role === "TEACHER") {
        payload.specializations =
          formData.specializations;
      }

      await registerUser(payload);

      setSuccess(true);
    } catch (error) {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Registration Failed",
        message:
          error?.message ||
          "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {/* ===============================================
    LEFT BRAND SECTION
=============================================== */}

<div className="signup-brand-section">

  <div className="signup-brand">

    <img
      src="/logo/skillselephant-logo-white.png"
      alt="Skillselephant"
      className="signup-brand-logo-image"
    />

  </div>
  <div className="signup-brand-message">
  <h2>
    Welcome to Skillselephant
  </h2>

  <p>
    Where practical learning builds real digital skills.
  </p>
</div>

  <div className="signup-brand-footer">
    © 2026 Skillselephant. All rights reserved.
  </div>

</div>

      {/* ===============================================
          RIGHT SIGNUP SECTION
      =============================================== */}

      <div className="signup-form-section">
        <div className="signup-form-container">
          {success ? (
            /* SUCCESS */

            <div className="signup-success">
              <div className="signup-success-icon">
                <CheckCircle2 size={48} />
              </div>

              <h1>Registration Submitted!</h1>

              <p>
                Your account has been created
                successfully. Please wait for admin
                approval before logging in.
              </p>

              <Link
                to="/login"
                className="signup-login-button"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              {/* HEADER */}

              <div className="signup-form-header">
                <h1>Create your account</h1>

                <p>
                  Choose your account type and enter
                  your details.
                </p>
              </div>

              {/* ROLE SELECT */}

              <div className="signup-role-selection">
                <button
                  type="button"
                  onClick={() =>
                    handleRoleChange("STUDENT")
                  }
                  className={`signup-role-card ${
                    role === "STUDENT"
                      ? "active"
                      : ""
                  }`}
                >
                  <GraduationCap size={22} />

                  <span>Student</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleRoleChange("TEACHER")
                  }
                  className={`signup-role-card ${
                    role === "TEACHER"
                      ? "active"
                      : ""
                  }`}
                >
                  <Users size={22} />

                  <span>Teacher</span>
                </button>
              </div>

              {/* FORM */}

              <form
                className="signup-form"
                onSubmit={handleSubmit}
              >
                {/* NAME */}

                <div className="signup-form-group">
                  <label>Full Name</label>

                  <div className="signup-input-wrapper">
                    <User size={18} />

                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* EMAIL */}

                <div className="signup-form-group">
                  <label>Email Address</label>

                  <div className="signup-input-wrapper">
                    <Mail size={18} />

                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* PHONE */}

                <div className="signup-form-group">
                  <label>Phone Number</label>

                  <div className="signup-input-wrapper">
                    <Phone size={18} />

                    <input
                      type="tel"
                      name="phone"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* STUDENT BATCH */}

                {role === "STUDENT" && (
                  <div className="signup-form-group">
                    <label>Batch Timing</label>

                    <select
                      name="batchId"
                      value={formData.batchId}
                      onChange={handleChange}
                      required
                      disabled={batchesLoading}
                    >
                      <option value="">
                        {batchesLoading
                          ? "Loading batches..."
                          : batches.length === 0
                          ? "No active batches available"
                          : "Select Batch Timing"}
                      </option>

                      {batches.map((batch) => (
                        <option
                          key={batch._id}
                          value={batch._id}
                        >
                          {batch.batchTiming}

                          {batch.name
                            ? ` (${batch.name})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* =================================================
                    TEACHER SPECIALIZATIONS
                ================================================= */}

                {role === "TEACHER" && (
                  <div className="signup-form-group">
                    <label>
                      Specializations
                    </label>

                    <div className="signup-specialization-select">
                      {/* SELECTED ITEMS */}

                      {formData.specializations
                        .length > 0 && (
                        <div className="signup-selected-specializations">
                          {formData.specializations.map(
                            (name) => (
                              <span
                                key={name}
                                className="signup-specialization-chip"
                              >
                                {name}

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeSpecialization(
                                      name
                                    )
                                  }
                                  aria-label={`Remove ${name}`}
                                >
                                  ×
                                </button>
                              </span>
                            )
                          )}
                        </div>
                      )}

                      {/* DROPDOWN BUTTON */}

                      <button
                        type="button"
                        className={`signup-specialization-trigger ${
                          showSpecializations
                            ? "open"
                            : ""
                        }`}
                        onClick={() =>
                          setShowSpecializations(
                            (previous) =>
                              !previous
                          )
                        }
                        disabled={
                          specializationsLoading
                        }
                      >
                        <span>
                          {specializationsLoading
                            ? "Loading specializations..."
                            : specializations.length ===
                              0
                            ? "No specializations available"
                            : formData
                                .specializations
                                .length === 0
                            ? "Select specializations"
                            : `${
                                formData
                                  .specializations
                                  .length
                              } selected`}
                        </span>

                        <ChevronDown
                          size={18}
                        />
                      </button>

                      {/* OPTIONS */}

                      {showSpecializations &&
                        !specializationsLoading &&
                        specializations.length >
                          0 && (
                          <div className="signup-specialization-options">
                            {specializations.map(
                              (item) => {
                                const selected =
                                  formData.specializations.includes(
                                    item.name
                                  );

                                return (
                                  <button
                                    type="button"
                                    key={item._id}
                                    className={`signup-specialization-option ${
                                      selected
                                        ? "selected"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      handleSpecializationToggle(
                                        item.name
                                      )
                                    }
                                  >
                                    <span className="signup-specialization-option-check">
                                      {selected && (
                                        <Check
                                          size={14}
                                        />
                                      )}
                                    </span>

                                    <span>
                                      {item.name}
                                    </span>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}

                      {showSpecializations &&
                        !specializationsLoading &&
                        specializations.length ===
                          0 && (
                          <div className="signup-specialization-empty">
                            No active specializations
                            are available. Please
                            contact admin.
                          </div>
                        )}
                    </div>

                    <small className="signup-specialization-help">
                      Select all topics you are
                      qualified to teach.
                    </small>
                  </div>
                )}

                {/* PASSWORD */}

                <div className="signup-form-group">
                  <label>Password</label>

                  <div className="signup-input-wrapper">
                    <Lock size={18} />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      minLength="6"
                      required
                    />

                    <button
                      type="button"
                      className="signup-password-toggle"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  className="signup-button"
                  disabled={
                    loading ||
                    (role === "STUDENT" &&
                      batchesLoading) ||
                    (role === "TEACHER" &&
                      specializationsLoading)
                  }
                >
                  {loading
                    ? "Creating Account..."
                    : "Create Account"}
                </button>
              </form>

              <p className="signup-login-text">
                Already have an approved account?{" "}
                <Link to="/login">
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() =>
          setAlertModal((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
      />
    </div>
  );
};

export default Signup;