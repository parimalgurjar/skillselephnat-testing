
import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CalendarDays,
  Edit3,
  Save,
  X,
  ChevronDown,
  Check,
} from "lucide-react";

import { getActiveSpecializations } from "../../services/specializationApi";
import {
  getTeacherProfile,
  updateTeacherProfile,
} from "../../services/teacherProfileApi";

import ProfileAvatar from "../../components/common/ProfileAvatar";
import AlertModal from "../../components/common/AlertModal";
import ProfilePhotoUpload from "../../components/common/ProfilePhotoUpload";
import "./TeacherProfile.css";

const TeacherProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [specializations, setSpecializations] = useState([]);
  const [specializationsLoading, setSpecializationsLoading] = useState(false);
  const [showSpecializations, setShowSpecializations] = useState(false);

  const [alert, setAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const [profile, setProfile] = useState({
    _id: "",
    name: "",
    email: "",
    phone: "",
    avatar: "",
    joiningDate: "",
    specializations: [],
    status: "",
    isActive: false,
    role: "",
  });

  const [originalProfile, setOriginalProfile] = useState(null);

  // FETCH PROFILE
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await getTeacherProfile();

      if (response?.success && response?.teacher) {
        const teacher = response.teacher;

        const formattedProfile = {
          _id: teacher._id || teacher.id || "",
          name: teacher.name || "",
          email: teacher.email || "",
          phone: teacher.phone || "",
          avatar: teacher.avatar || "",
          joiningDate: teacher.joiningDate || "",
          specializations: Array.isArray(teacher.specializations)
            ? teacher.specializations
                .map((item) =>
                  typeof item === "string" ? item : item?.name
                )
                .filter(Boolean)
            : [],
          status: teacher.status || "",
          isActive: teacher.status
            ? teacher.status === "ACTIVE"
            : Boolean(teacher.isActive),
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

  // LOAD ACTIVE SPECIALIZATIONS ONLY WHEN EDITING
  useEffect(() => {
    if (!isEditing) {
      setShowSpecializations(false);
      return;
    }

    let active = true;

    const loadSpecializations = async () => {
      try {
        setSpecializationsLoading(true);

        const response = await getActiveSpecializations();

        if (active) {
          setSpecializations(response?.specializations || []);
        }
      } catch (error) {
        console.error("Specialization Load Error:", error);

        if (active) {
          setAlert({
            isOpen: true,
            type: "error",
            title: "Unable to Load Specializations",
            message:
              error.message ||
              "Specializations could not be loaded. Please try again.",
          });
        }
      } finally {
        if (active) {
          setSpecializationsLoading(false);
        }
      }
    };

    loadSpecializations();

    return () => {
      active = false;
    };
  }, [isEditing]);

  // HANDLE INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // TOGGLE SPECIALIZATION
  const handleSpecializationToggle = (name) => {
    setProfile((previous) => {
      const current = previous.specializations || [];
      const alreadySelected = current.includes(name);

      return {
        ...previous,
        specializations: alreadySelected
          ? current.filter((item) => item !== name)
          : [...current, name],
      };
    });
  };

  // REMOVE SELECTED SPECIALIZATION
  const removeSpecialization = (name) => {
    setProfile((previous) => ({
      ...previous,
      specializations: (previous.specializations || []).filter(
        (item) => item !== name
      ),
    }));
  };

  // SAVE PROFILE
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
        const updatedTeacher = response.teacher || {};

        const updatedProfile = {
          ...profile,
          ...updatedTeacher,
          specializations: Array.isArray(updatedTeacher.specializations)
            ? updatedTeacher.specializations
                .map((item) =>
                  typeof item === "string" ? item : item?.name
                )
                .filter(Boolean)
            : profile.specializations,
        };

        setProfile(updatedProfile);
        setOriginalProfile(updatedProfile);
        setShowSpecializations(false);
        setIsEditing(false);

        setAlert({
          isOpen: true,
          type: "success",
          title: "Profile Updated",
          message: "Profile updated successfully",
        });
      } else {
        setAlert({
          isOpen: true,
          type: "error",
          title: "Update Failed",
          message: response?.message || "Unable to update profile",
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

  // CANCEL EDIT
  const handleCancel = () => {
    if (originalProfile) {
      setProfile(originalProfile);
    }

    setShowSpecializations(false);
    setIsEditing(false);
  };

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "Not Available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // LOADING
  if (loading) {
    return (
      <div className="teacher-profile-page">
        <div className="teacher-profile-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="teacher-profile-page">
      {/* HEADER */}
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

      {/* PROFILE PHOTO */}
      <ProfilePhotoUpload
        onUpdated={(updatedUser) => {
          setProfile((previous) => {
            const updatedProfile = {
              ...previous,
              avatar: updatedUser.avatar || "",
            };

            setOriginalProfile((original) =>
              original
                ? { ...original, avatar: updatedUser.avatar || "" }
                : original
            );

            return updatedProfile;
          });
        }}
      />

      {/* PROFILE HERO */}
      <div className="teacher-profile-hero">
        <div className="teacher-profile-main">
          <div className="teacher-profile-avatar">
            <ProfileAvatar user={profile} size={82} />
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

      {/* PROFILE GRID */}
      <div className="teacher-profile-grid">
        {/* PERSONAL INFORMATION */}
        <div className="teacher-profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Personal Information</h2>
              <p>Your basic contact details.</p>
            </div>
          </div>

          <div className="profile-info-list">
            {/* NAME */}
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

            {/* EMAIL */}
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Mail size={18} />
              </div>

              <div className="profile-info-content">
                <span>Email Address</span>
                <strong>{profile.email}</strong>
              </div>
            </div>

            {/* PHONE */}
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

            {/* LOCATION */}
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

        {/* PROFESSIONAL INFORMATION */}
        <div className="teacher-profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Professional Information</h2>
              <p>Your role and expertise.</p>
            </div>
          </div>

          <div className="profile-info-list">
            {/* ROLE */}
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Briefcase size={18} />
              </div>

              <div className="profile-info-content">
                <span>Role</span>
                <strong>Digital Marketing Educator</strong>
              </div>
            </div>

            {/* JOINING DATE */}
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <CalendarDays size={18} />
              </div>

              <div className="profile-info-content">
                <span>Joining Date</span>
                <strong>{formatDate(profile.joiningDate)}</strong>
              </div>
            </div>

            {/* SPECIALIZATIONS */}
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Briefcase size={18} />
              </div>

              <div className="profile-info-content">
                <span>Specializations</span>

                {isEditing ? (
                  <div className="teacher-specialization-select">
                    {/* SELECTED SPECIALIZATION CHIPS */}
                    {profile.specializations.length > 0 && (
                      <div className="teacher-selected-specializations">
                        {profile.specializations.map((name) => (
                          <span
                            key={name}
                            className="teacher-specialization-chip"
                          >
                            {name}

                            <button
                              type="button"
                              onClick={() => removeSpecialization(name)}
                              aria-label={`Remove ${name}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* DROPDOWN TRIGGER */}
                    <button
                      type="button"
                      className={`teacher-specialization-trigger ${
                        showSpecializations ? "open" : ""
                      }`}
                      onClick={() =>
                        setShowSpecializations((previous) => !previous)
                      }
                      disabled={specializationsLoading}
                    >
                      <span>
                        {specializationsLoading
                          ? "Loading specializations..."
                          : profile.specializations.length === 0
                          ? "Select specializations"
                          : `${profile.specializations.length} selected`}
                      </span>

                      <ChevronDown size={18} />
                    </button>

                    {/* DROPDOWN OPTIONS */}
                    {showSpecializations && !specializationsLoading && (
                      <div className="teacher-specialization-options">
                        {specializations.length > 0 ? (
                          specializations.map((item) => {
                            const selected =
                              profile.specializations.includes(item.name);

                            return (
                              <button
                                type="button"
                                key={item._id || item.name}
                                className={`teacher-specialization-option ${
                                  selected ? "selected" : ""
                                }`}
                                onClick={() =>
                                  handleSpecializationToggle(item.name)
                                }
                              >
                                <span className="teacher-specialization-check">
                                  {selected && <Check size={14} />}
                                </span>

                                <span>{item.name}</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="teacher-specialization-empty">
                            No active specializations available.
                          </div>
                        )}
                      </div>
                    )}

                    <small className="teacher-specialization-help">
                      Select all topics you are qualified to teach.
                    </small>
                  </div>
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

      {/* ACCOUNT STATUS */}
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

      {/* ALERT MODAL */}
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
