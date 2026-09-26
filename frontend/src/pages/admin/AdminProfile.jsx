import { useEffect, useState } from "react";

import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Camera,
  Save,
  Lock,
  Bell,
  ShieldCheck,
} from "lucide-react";
import AlertModal from "../../components/common/AlertModal";
import {
  getCurrentUser,
  updateProfile,
  changePassword,
} from "../../services/authApi";

import { useAuth } from "../../context/AuthContext";

import "./AdminProfile.css";

const AdminProfile = () => {
  const { updateUser } = useAuth();

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "error",
    title: "Error",
    message: "",
  });

  const showAlert = (message, type = "error", title = "Error") => {
    setAlertModal({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  const [activeTab, setActiveTab] = useState("profile");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "Institute Administrator",
    location: "Indore, Madhya Pradesh",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* =====================================================
     PASSWORD STATES
  ===================================================== */

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswordForm, setShowPasswordForm] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  /* =====================================================
     LOAD CURRENT ADMIN PROFILE
  ===================================================== */

  useEffect(() => {
    const loadAdminProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getCurrentUser();

        if (!response?.success || !response?.user) {
          throw new Error("Unable to load profile");
        }

        const currentUser = response.user;

        updateUser(currentUser);

        setFormData({
          name: currentUser.name || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
          designation: "Institute Administrator",
          location: "Indore, Madhya Pradesh",
        });
      } catch (error) {
        console.error(
          "Profile Load Error:",
          error
        );

        setError(
          error.message ||
            "Unable to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAdminProfile();
  }, [updateUser]);

  /* =====================================================
     HANDLE PROFILE INPUT CHANGE
  ===================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
     SAVE PROFILE
  ===================================================== */

  const handleSaveProfile = async () => {
    try {
      if (
        !formData.name.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim()
      ) {
        showAlert("Please fill all required fields", "warning", "Missing Information");
        return;
      }

      setSaving(true);

      const response = await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });

      if (!response?.success || !response?.user) {
        throw new Error(
          response?.message ||
            "Unable to update profile"
        );
      }

      const updatedUser = response.user;

      /* Update Global Auth State */
      updateUser(updatedUser);

      /* Update Local Form */
      setFormData((previous) => ({
        ...previous,
        name: updatedUser.name || previous.name,
        email: updatedUser.email || previous.email,
        phone: updatedUser.phone || previous.phone,
      }));

      showAlert("Profile updated successfully", "success", "Success");
    } catch (error) {
      console.error(
        "Profile Update Error:",
        error
      );

      showAlert(
        error.message ||
          "Unable to update profile",
        "error",
        "Error"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     HANDLE PASSWORD INPUT CHANGE
  ===================================================== */

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
     CHANGE PASSWORD
  ===================================================== */

  const handleChangePassword = async () => {
    try {
      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } = passwordData;

      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        showAlert("Please fill all password fields", "warning", "Missing Information");
        return;
      }

      if (newPassword !== confirmPassword) {
        showAlert(
          "New password and confirm password do not match",
          "warning",
          "Validation Error"
        );
        return;
      }

      if (newPassword.length < 6) {
        showAlert(
          "New password must be at least 6 characters long",
          "warning",
          "Validation Error"
        );
        return;
      }

      setPasswordLoading(true);

      const response = await changePassword({
        currentPassword,
        newPassword,
      });

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to change password"
        );
      }

      showAlert("Password changed successfully", "success", "Success");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordForm(false);
    } catch (error) {
      console.error(
        "Password Change Error:",
        error
      );

      showAlert(
        error.message ||
          "Unable to change password",
        "error",
        "Error"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="admin-profile-page">
        <p>Loading profile...</p>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <div className="admin-profile-page">
        <p>{error}</p>
      </div>
    );
  }

  /* =====================================================
     USER INITIALS
  ===================================================== */

  const initials = formData.name
    ? formData.name
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <div className="admin-profile-page">

      {/* ================= HEADER ================= */}

      <div className="admin-profile-header">
        <div>
          <span className="admin-page-label">
            ADMIN PORTAL
          </span>

          <h1>Profile & Settings</h1>

          <p>
            Manage your account information and
            preferences.
          </p>
        </div>
      </div>

      <div className="profile-layout">

        {/* ================= SIDEBAR ================= */}

        <div className="profile-settings-sidebar">
          <button
            type="button"
            className={
              activeTab === "profile"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() =>
              setActiveTab("profile")
            }
          >
            <User size={17} />
            My Profile
          </button>

          <button
            type="button"
            className={
              activeTab === "security"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() =>
              setActiveTab("security")
            }
          >
            <Lock size={17} />
            Security
          </button>

          <button
            type="button"
            className={
              activeTab === "notifications"
                ? "profile-tab active"
                : "profile-tab"
            }
            onClick={() =>
              setActiveTab("notifications")
            }
          >
            <Bell size={17} />
            Notifications
          </button>
        </div>

        {/* ================= CONTENT ================= */}

        <div className="profile-content-card">

          {/* ================= PROFILE ================= */}

          {activeTab === "profile" && (
            <>
              <div className="profile-content-header">
                <div>
                  <h2>
                    Personal Information
                  </h2>

                  <p>
                    Update your personal and
                    professional details.
                  </p>
                </div>
              </div>

              <div className="profile-avatar-section">
                <div className="large-profile-avatar">
                  {initials}
                </div>

                <div className="profile-avatar-info">
                  <h3>{formData.name}</h3>

                  <span>
                    {formData.designation}
                  </span>

                  <button
                    type="button"
                    className="change-photo-btn"
                  >
                    <Camera size={15} />
                    Change Photo
                  </button>
                </div>
              </div>

              <div className="profile-form">

                <div className="profile-form-row">
                  <div className="profile-form-group">
                    <label>
                      <User size={14} />
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label>
                      <Mail size={14} />
                      Email Address
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="profile-form-row">
                  <div className="profile-form-group">
                    <label>
                      <Phone size={14} />
                      Phone Number
                    </label>

                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label>
                      <Building2 size={14} />
                      Designation
                    </label>

                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label>
                    <MapPin size={14} />
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>

                <div className="profile-save-section">
                  <button
                    type="button"
                    className="save-profile-btn"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    <Save size={16} />

                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>

              </div>
            </>
          )}

          {/* ================= SECURITY ================= */}

          {activeTab === "security" && (
            <div className="settings-tab-content">

              <div className="profile-content-header">
                <div>
                  <h2>
                    Security Settings
                  </h2>

                  <p>
                    Manage your password and account
                    security.
                  </p>
                </div>
              </div>

              <div className="security-setting-card">
                <div className="security-icon">
                  <Lock size={20} />
                </div>

                <div className="security-info">
                  <h3>Password</h3>

                  <p>
                    Keep your account secure by using
                    a strong password.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-setting-btn"
                  onClick={() =>
                    setShowPasswordForm(
                      (previous) => !previous
                    )
                  }
                >
                  {showPasswordForm
                    ? "Cancel"
                    : "Change Password"}
                </button>
              </div>

              {showPasswordForm && (
                <div className="change-password-form">

                  <div className="profile-form-group">
                    <label>
                      Current Password
                    </label>

                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="Enter current password"
                      value={
                        passwordData.currentPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                    />
                  </div>

                  <div className="profile-form-group">
                    <label>
                      New Password
                    </label>

                    <input
                      type="password"
                      name="newPassword"
                      placeholder="Enter new password"
                      value={
                        passwordData.newPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                    />
                  </div>

                  <div className="profile-form-group">
                    <label>
                      Confirm New Password
                    </label>

                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={
                        passwordData.confirmPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                    />
                  </div>

                  <div className="profile-save-section">
                    <button
                      type="button"
                      className="save-profile-btn"
                      onClick={
                        handleChangePassword
                      }
                      disabled={passwordLoading}
                    >
                      <Lock size={16} />

                      {passwordLoading
                        ? "Changing..."
                        : "Update Password"}
                    </button>
                  </div>

                </div>
              )}

              <div className="security-setting-card">
                <div className="security-icon">
                  <ShieldCheck size={20} />
                </div>

                <div className="security-info">
                  <h3>
                    Account Security
                  </h3>

                  <p>
                    Your account is currently
                    protected.
                  </p>
                </div>

                <span className="security-status">
                  Secure
                </span>
              </div>

            </div>
          )}

          {/* ================= NOTIFICATIONS ================= */}

          {activeTab === "notifications" && (
            <div className="settings-tab-content">

              <div className="profile-content-header">
                <div>
                  <h2>
                    Notification Preferences
                  </h2>

                  <p>
                    Choose what notifications you want
                    to receive.
                  </p>
                </div>
              </div>

              <div className="notification-setting">
                <div>
                  <h3>
                    Email Notifications
                  </h3>

                  <p>
                    Receive important updates via
                    email.
                  </p>
                </div>

                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    defaultChecked
                  />

                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="notification-setting">
                <div>
                  <h3>
                    Task Notifications
                  </h3>

                  <p>
                    Get notified about new tasks and
                    submissions.
                  </p>
                </div>

                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    defaultChecked
                  />

                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="notification-setting">
                <div>
                  <h3>
                    Attendance Alerts
                  </h3>

                  <p>
                    Receive alerts for low student
                    attendance.
                  </p>
                </div>

                <label className="toggle-switch">
                  <input type="checkbox" />

                  <span className="toggle-slider" />
                </label>
              </div>

            </div>
          )}

        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminProfile;