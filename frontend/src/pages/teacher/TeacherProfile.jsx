import { useEffect, useState } from "react";

import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CalendarDays,
  Edit3,
  Save,
  X,
} from "lucide-react";

import {
  getTeacherProfile,
  updateTeacherProfile,
} from "../../services/teacherProfileApi";

import "./TeacherProfile.css";
import AlertModal from "../../components/common/AlertModal";

const TeacherProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [alert, setAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    joiningDate: "",
    specializations: [],
    status: "",
    role: "",
  });

  const [originalProfile, setOriginalProfile] = useState(null);

  /* ==========================================
     FETCH PROFILE
  ========================================== */

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await getTeacherProfile();

      if (response?.success) {
        const teacher = response.teacher;

        const formattedProfile = {
          name: teacher.name || "",
          email: teacher.email || "",
          phone: teacher.phone || "",
          avatar: teacher.avatar || "",
          joiningDate: teacher.joiningDate || "",
          specializations: teacher.specializations || [],
          status: teacher.status || "",
          role: teacher.role || "TEACHER",
        };

        setProfile(formattedProfile);
        setOriginalProfile(formattedProfile);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);

      setAlert({
        isOpen: true,
        type: "error",
        title: "Profile Error",
        message: error.message || "Unable to fetch profile",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  /* ==========================================
     HANDLE CHANGE
  ========================================== */

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  /* ==========================================
     SPECIALIZATION CHANGE
  ========================================== */

  const handleSpecializationChange = (e) => {
    const value = e.target.value;

    setProfile({
      ...profile,
      specializations: value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };

  /* ==========================================
     SAVE PROFILE
  ========================================== */

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await updateTeacherProfile({
        name: profile.name,
        phone: profile.phone,
        avatar: profile.avatar,
        specializations: profile.specializations,
      });

      if (response?.success) {
        const updatedProfile = {
          ...profile,
          ...response.teacher,
        };

        setProfile(updatedProfile);
        setOriginalProfile(updatedProfile);
        setIsEditing(false);

        setAlert({
          isOpen: true,
          type: "success",
          title: "Profile Updated",
          message: "Profile updated successfully",
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);

      setAlert({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: error.message || "Unable to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================
     CANCEL EDIT
  ========================================== */

  const handleCancel = () => {
    if (originalProfile) {
      setProfile(originalProfile);
    }

    setIsEditing(false);
  };

  /* ==========================================
     FORMAT DATE
  ========================================== */

  const formatDate = (date) => {
    if (!date) return "Not Available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  /* ==========================================
     GET INITIALS
  ========================================== */

  const getInitials = (name) => {
    if (!name) return "T";

    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="teacher-profile-page">
        <div className="teacher-profile-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="teacher-profile-page">
      {/* Header */}
      <div className="teacher-profile-header">
        <div>
          <span className="teacher-page-label">EDUCATOR PORTAL</span>
          <h1>My Profile</h1>
          <p>Manage your personal and professional information.</p>
        </div>

        {!isEditing ? (
          <button
            className="edit-profile-btn"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 size={16} />
            Edit Profile
          </button>
        ) : (
          <div className="profile-action-buttons">
            <button
              className="cancel-profile-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              <X size={16} />
              Cancel
            </button>

            <button
              className="save-profile-btn"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Profile Hero */}
      <div className="teacher-profile-hero">
        <div className="teacher-profile-main">
          <div className="teacher-profile-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} />
            ) : (
              <span>{getInitials(profile.name)}</span>
            )}

            {isEditing && (
              <button
                type="button"
                className="change-photo-btn"
                title="Avatar URL can be updated from API"
              >
                <Camera size={15} />
              </button>
            )}
          </div>

          <div className="teacher-profile-intro">
            <h2>{profile.name}</h2>
            <p>Digital Marketing Educator</p>
            <span className="teacher-active-badge">
              {profile.status === "ACTIVE"
                ? "Active Educator"
                : "Inactive Educator"}
            </span>
          </div>
        </div>

        <div className="teacher-profile-id">
          <span>Employee ID</span>
          <strong>
            {profile._id
              ? `SE-EDU-${profile._id.slice(-5).toUpperCase()}`
              : "SE-EDU"}
          </strong>
        </div>
      </div>

      {/* Profile Grid */}
      <div className="teacher-profile-grid">
        {/* Personal Information */}
        <div className="teacher-profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Personal Information</h2>
              <p>Your basic contact details.</p>
            </div>
          </div>

          <div className="profile-info-list">
            {/* Name */}
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Briefcase size={18} />
              </div>
              <div className="profile-info-content">
                <span>Full Name</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                  />
                ) : (
                  <strong>{profile.name}</strong>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Mail size={18} />
              </div>
              <div className="profile-info-content">
                <span>Email Address</span>
                <strong>{profile.email}</strong>
              </div>
            </div>

            {/* Phone */}
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Phone size={18} />
              </div>
              <div className="profile-info-content">
                <span>Phone Number</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                  />
                ) : (
                  <strong>{profile.phone || "Not Available"}</strong>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <MapPin size={18} />
              </div>
              <div className="profile-info-content">
                <span>Location</span>
                <strong>Indore, Madhya Pradesh</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="teacher-profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Professional Information</h2>
              <p>Your role and expertise.</p>
            </div>
          </div>

          <div className="profile-info-list">
            {/* Role */}
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Briefcase size={18} />
              </div>
              <div className="profile-info-content">
                <span>Role</span>
                <strong>Digital Marketing Educator</strong>
              </div>
            </div>

            {/* Joining Date */}
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <CalendarDays size={18} />
              </div>
              <div className="profile-info-content">
                <span>Joining Date</span>
                <strong>{formatDate(profile.joiningDate)}</strong>
              </div>
            </div>

            {/* Specializations */}
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Briefcase size={18} />
              </div>
              <div className="profile-info-content">
                <span>Specializations</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.specializations.join(", ")}
                    onChange={handleSpecializationChange}
                    placeholder="SEO, Google Ads, Meta Ads"
                  />
                ) : (
                  <strong>
                    {profile.specializations?.length > 0
                      ? profile.specializations.join(", ")
                      : "Not Available"}
                  </strong>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="teacher-account-status">
        <div className="account-status-left">
          <div className="account-status-icon">✓</div>
          <div>
            <h3>Account Status</h3>
            <p>
              Your educator account is{" "}
              {profile.isActive
                ? "active and verified."
                : "currently inactive."}
            </p>
          </div>
        </div>
        <span className="verified-status">
          {profile.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={() =>
          setAlert((previous) => ({
            ...previous,
            isOpen: false,
          }))
        }
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </div>
  );
};

export default TeacherProfile;