import { useEffect, useState } from "react";
import {
User,
Mail,
Phone,
Calendar,
GraduationCap,
Edit3,
ShieldCheck,
BookOpen,
Clock3,
} from "lucide-react";

import api from "../../services/api";

import {
updateProfile,
changePassword,
} from "../../services/authApi";

import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/common/Modal";

import "./Profile.css";

const Profile = () => {
/* =====================================================
AUTH
===================================================== */

const { updateUser } = useAuth();

/* =====================================================
PROFILE STATE
===================================================== */

const [student, setStudent] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

/* =====================================================
PROFILE EDIT MODAL
===================================================== */

const [isEditModalOpen, setIsEditModalOpen] =
useState(false);

const [editForm, setEditForm] = useState({
name: "",
email: "",
phone: "",
});

const [editLoading, setEditLoading] =
useState(false);

const [editError, setEditError] = useState("");

/* =====================================================
CHANGE PASSWORD MODAL
===================================================== */

const [isPasswordModalOpen, setIsPasswordModalOpen] =
useState(false);

const [passwordForm, setPasswordForm] = useState({
currentPassword: "",
newPassword: "",
confirmPassword: "",
});

const [passwordLoading, setPasswordLoading] =
useState(false);

const [passwordError, setPasswordError] =
useState("");

/* =====================================================
SUCCESS MESSAGE
===================================================== */

const [successMessage, setSuccessMessage] =
useState("");

/* =====================================================
FETCH PROFILE
===================================================== */

useEffect(() => {
const fetchProfile = async () => {
try {
setLoading(true);
setError("");


    const response = await api.get(
      "/dashboard/profile"
    );

    if (response.data?.success) {
      setStudent(response.data.profile);
    } else {
      setError("Unable to load profile");
    }
  } catch (error) {
    console.error(
      "Fetch Profile Error:",
      error
    );

    setError(
      error.response?.data?.message ||
        "Unable to load profile"
    );
  } finally {
    setLoading(false);
  }
};

fetchProfile();


}, []);

/* =====================================================
SUCCESS MESSAGE HELPER
===================================================== */

const showSuccess = (message) => {
setSuccessMessage(message);


setTimeout(() => {
  setSuccessMessage("");
}, 4000);


};

/* =====================================================
OPEN EDIT PROFILE
===================================================== */

const handleOpenEditProfile = () => {
if (!student) return;

setEditForm({
  name: student.name || "",
  email: student.email || "",
  phone: student.phone || "",
});

setEditError("");
setIsEditModalOpen(true);


};

/* =====================================================
CLOSE EDIT PROFILE
===================================================== */

const handleCloseEditProfile = () => {
if (editLoading) return;


setEditError("");
setIsEditModalOpen(false);


};

/* =====================================================
EDIT FORM CHANGE
===================================================== */

const handleEditFormChange = (event) => {
const { name, value } = event.target;


setEditForm((previous) => ({
  ...previous,
  [name]: value,
}));


};

/* =====================================================
UPDATE PROFILE
===================================================== */

const handleUpdateProfile = async (event) => {
event.preventDefault();


if (!editForm.name.trim()) {
  setEditError("Name is required.");
  return;
}

if (!editForm.email.trim()) {
  setEditError("Email is required.");
  return;
}

try {
  setEditLoading(true);
  setEditError("");

  const response = await updateProfile({
    name: editForm.name.trim(),
    email: editForm.email.trim(),
    phone: editForm.phone.trim(),
  });

  if (
    !response?.success ||
    !response?.user
  ) {
    throw new Error(
      response?.message ||
        "Unable to update profile."
    );
  }

  /* ===============================================
     UPDATE PROFILE PAGE DATA
  =============================================== */

  setStudent((previousStudent) => ({
    ...previousStudent,
    ...response.user,
  }));

  /* ===============================================
     UPDATE GLOBAL AUTH USER
  =============================================== */

  updateUser(response.user);

  setIsEditModalOpen(false);

  showSuccess(
    response.message ||
      "Profile updated successfully."
  );
} catch (error) {
  console.error(
    "Update Profile Error:",
    error
  );

  setEditError(
    error?.message ||
      "Unable to update profile."
  );
} finally {
  setEditLoading(false);
}


};

/* =====================================================
OPEN CHANGE PASSWORD
===================================================== */

const handleOpenPasswordModal = () => {
setPasswordForm({
currentPassword: "",
newPassword: "",
confirmPassword: "",
});


setPasswordError("");
setIsPasswordModalOpen(true);


};

/* =====================================================
CLOSE CHANGE PASSWORD
===================================================== */

const handleClosePasswordModal = () => {
if (passwordLoading) return;


setPasswordError("");
setIsPasswordModalOpen(false);


};

/* =====================================================
PASSWORD FORM CHANGE
===================================================== */

const handlePasswordFormChange = (event) => {
const { name, value } = event.target;


setPasswordForm((previous) => ({
  ...previous,
  [name]: value,
}));


};

/* =====================================================
CHANGE PASSWORD
===================================================== */

const handleChangePassword = async (event) => {
event.preventDefault();


const {
  currentPassword,
  newPassword,
  confirmPassword,
} = passwordForm;

if (!currentPassword) {
  setPasswordError(
    "Please enter your current password."
  );
  return;
}

if (!newPassword) {
  setPasswordError(
    "Please enter a new password."
  );
  return;
}

if (newPassword.length < 6) {
  setPasswordError(
    "New password must be at least 6 characters."
  );
  return;
}

if (newPassword !== confirmPassword) {
  setPasswordError(
    "New password and confirmation do not match."
  );
  return;
}

try {
  setPasswordLoading(true);
  setPasswordError("");

  const response = await changePassword({
    currentPassword,
    newPassword,
  });

  if (!response?.success) {
    throw new Error(
      response?.message ||
        "Unable to change password."
    );
  }

  setPasswordForm({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  setIsPasswordModalOpen(false);

  showSuccess(
    response.message ||
      "Password changed successfully."
  );
} catch (error) {
  console.error(
    "Change Password Error:",
    error
  );

  setPasswordError(
    error?.message ||
      "Unable to change password."
  );
} finally {
  setPasswordLoading(false);
}


};

/* =====================================================
DATE FORMAT
===================================================== */

const formatJoinedDate = (date) => {
if (!date) {
return "Not available";
}


const parsedDate = new Date(date);

if (Number.isNaN(parsedDate.getTime())) {
  return "Not available";
}

return parsedDate.toLocaleDateString(
  "en-IN",
  {
    month: "long",
    year: "numeric",
  }
);


};

/* =====================================================
STATUS FORMAT
===================================================== */

const formatStatus = (status) => {
if (!status) return "Unknown";


return (
  status.charAt(0).toUpperCase() +
  status.slice(1).toLowerCase()
);


};

/* =====================================================
LOADING
===================================================== */

if (loading) {
return ( <div className="profile-page"> <div className="profile-page-header"> <div> <span className="profile-page-label">
STUDENT PORTAL </span>


        <h1>My Profile</h1>

        <p>Loading your profile...</p>
      </div>
    </div>
  </div>
);


}

/* =====================================================
ERROR
===================================================== */

if (error) {
return ( <div className="profile-page"> <div className="profile-page-header"> <div> <span className="profile-page-label">
STUDENT PORTAL </span>


        <h1>My Profile</h1>

        <p>{error}</p>
      </div>
    </div>
  </div>
);


}

/* =====================================================
FALLBACK
===================================================== */

if (!student) {
return ( <div className="profile-page"> <p>Profile data not available.</p> </div>
);
}

/* =====================================================
PROFILE DATA
===================================================== */

const studentName =
student.name || "Student";

const studentEmail =
student.email || "Not available";

const studentPhone =
student.phone || "Not available";

const studentId =
student.studentId ||
student._id ||
student.id ||
"Not assigned";

const batchTiming =
student.batchTiming || "Not assigned";

const courseName =
student.course?.name || "Not assigned";

const accountStatus =
formatStatus(
student.accountStatus || student.status
);

const attendancePercentage =
student.attendance?.percentage ?? 0;

const joinedDate = formatJoinedDate(
student.joiningDate
);

const teacherName =
student.teacher?.name || "Not assigned";

return ( <div className="profile-page">


  {/* =====================================================
     SUCCESS MESSAGE
  ===================================================== */}

  {successMessage && (
    <div
      style={{
        marginBottom: "16px",
        padding: "12px 16px",
        borderRadius: "8px",
        background: "#ecfdf3",
        color: "#067647",
        fontWeight: "600",
      }}
    >
      {successMessage}
    </div>
  )}

  {/* =====================================================
     HEADER
  ===================================================== */}

  <div className="profile-page-header">
    <div>
      <span className="profile-page-label">
        STUDENT PORTAL
      </span>

      <h1>My Profile</h1>

      <p>
        View and manage your personal and course
        information.
      </p>
    </div>

    <button
      type="button"
      className="edit-profile-btn"
      onClick={handleOpenEditProfile}
    >
      <Edit3 size={17} />
      Edit Profile
    </button>
  </div>

  {/* =====================================================
     PROFILE HERO
  ===================================================== */}

  <div className="profile-hero">
    <div className="profile-main-info">

      <div className="profile-avatar">
        {student.avatar ? (
          <img
            src={student.avatar}
            alt={studentName}
          />
        ) : (
          studentName.charAt(0).toUpperCase()
        )}
      </div>

      <div>
        <h2>{studentName}</h2>

        <p>{studentEmail}</p>

        <div className="profile-tags">

          <span>
            <GraduationCap size={14} />
            Student
          </span>

          <span>
            <ShieldCheck size={14} />
            {accountStatus}
          </span>

        </div>
      </div>
    </div>

    <div className="student-id-box">
      <span>STUDENT ID</span>

      <strong>
        {studentId.toString()}
      </strong>
    </div>
  </div>

  {/* =====================================================
     PROFILE GRID
  ===================================================== */}

  <div className="profile-grid">

    {/* PERSONAL INFORMATION */}

    <div className="profile-card">

      <div className="profile-card-header">

        <div className="profile-card-icon">
          <User size={20} />
        </div>

        <div>
          <h3>Personal Information</h3>

          <p>
            Your basic profile details
          </p>
        </div>

      </div>

      <div className="profile-details">

        <div className="profile-detail">
          <Mail size={18} />

          <div>
            <span>Email Address</span>

            <strong>
              {studentEmail}
            </strong>
          </div>
        </div>

        <div className="profile-detail">
          <Phone size={18} />

          <div>
            <span>Phone Number</span>

            <strong>
              {studentPhone}
            </strong>
          </div>
        </div>

        <div className="profile-detail">
          <Clock3 size={18} />

          <div>
            <span>Batch Timing</span>

            <strong>
              {batchTiming}
            </strong>
          </div>
        </div>

        <div className="profile-detail">
          <Calendar size={18} />

          <div>
            <span>
              Joined Skillselephant
            </span>

            <strong>
              {joinedDate}
            </strong>
          </div>
        </div>

      </div>
    </div>

    {/* COURSE INFORMATION */}

    <div className="profile-card">

      <div className="profile-card-header">

        <div className="profile-card-icon yellow">
          <BookOpen size={20} />
        </div>

        <div>
          <h3>Course Information</h3>

          <p>
            Your enrolled program details
          </p>
        </div>

      </div>

      <div className="course-profile-info">

        <div className="course-profile-item">
          <span>Course</span>

          <strong>
            {courseName}
          </strong>
        </div>

        <div className="course-profile-item">
          <span>Batch Timing</span>

          <strong>
            {batchTiming}
          </strong>
        </div>

        <div className="course-profile-item">
          <span>Assigned Teacher</span>

          <strong>
            {teacherName}
          </strong>
        </div>

        <div className="course-profile-item">
          <span>Attendance</span>

          <strong
            className={
              attendancePercentage >= 75
                ? "active-status"
                : ""
            }
          >
            {attendancePercentage}%
          </strong>
        </div>

      </div>
    </div>

  </div>

  {/* =====================================================
     ACCOUNT SECURITY
  ===================================================== */}

  <div className="account-security-card">

    <div className="security-left">

      <div className="security-icon">
        <ShieldCheck size={23} />
      </div>

      <div>
        <h3>Account Security</h3>

        <p>
          Keep your account secure by maintaining
          a strong password.
        </p>
      </div>

    </div>

    <button
      type="button"
      className="change-password-btn"
      onClick={handleOpenPasswordModal}
    >
      Change Password
    </button>

  </div>

  {/* =====================================================
     EDIT PROFILE MODAL
  ===================================================== */}

  <Modal
    isOpen={isEditModalOpen}
    onClose={handleCloseEditProfile}
    title="Edit Profile"
  >
    <form onSubmit={handleUpdateProfile}>

      {editError && (
        <div
          style={{
            marginBottom: "16px",
            padding: "10px 12px",
            borderRadius: "6px",
            background: "#fef3f2",
            color: "#b42318",
          }}
        >
          {editError}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: "14px",
        }}
      >

        <div>
          <label>Name</label>

          <input
            type="text"
            name="name"
            value={editForm.name}
            onChange={handleEditFormChange}
            disabled={editLoading}
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "11px",
            }}
          />
        </div>

        <div>
          <label>Email Address</label>

          <input
            type="email"
            name="email"
            value={editForm.email}
            onChange={handleEditFormChange}
            disabled={editLoading}
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "11px",
            }}
          />
        </div>

        <div>
          <label>Phone Number</label>

          <input
            type="tel"
            name="phone"
            value={editForm.phone}
            onChange={handleEditFormChange}
            disabled={editLoading}
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "11px",
            }}
          />
        </div>

      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "22px",
        }}
      >
        <button
          type="button"
          onClick={handleCloseEditProfile}
          disabled={editLoading}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={editLoading}
        >
          {editLoading
            ? "Saving..."
            : "Save Changes"}
        </button>
      </div>

    </form>
  </Modal>

  {/* =====================================================
     CHANGE PASSWORD MODAL
  ===================================================== */}

  <Modal
    isOpen={isPasswordModalOpen}
    onClose={handleClosePasswordModal}
    title="Change Password"
  >
    <form onSubmit={handleChangePassword}>

      {passwordError && (
        <div
          style={{
            marginBottom: "16px",
            padding: "10px 12px",
            borderRadius: "6px",
            background: "#fef3f2",
            color: "#b42318",
          }}
        >
          {passwordError}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: "14px",
        }}
      >

        <div>
          <label>Current Password</label>

          <input
            type="password"
            name="currentPassword"
            value={
              passwordForm.currentPassword
            }
            onChange={
              handlePasswordFormChange
            }
            disabled={passwordLoading}
            autoComplete="current-password"
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "11px",
            }}
          />
        </div>

        <div>
          <label>New Password</label>

          <input
            type="password"
            name="newPassword"
            value={
              passwordForm.newPassword
            }
            onChange={
              handlePasswordFormChange
            }
            disabled={passwordLoading}
            autoComplete="new-password"
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "11px",
            }}
          />
        </div>

        <div>
          <label>Confirm New Password</label>

          <input
            type="password"
            name="confirmPassword"
            value={
              passwordForm.confirmPassword
            }
            onChange={
              handlePasswordFormChange
            }
            disabled={passwordLoading}
            autoComplete="new-password"
            style={{
              width: "100%",
              marginTop: "6px",
              padding: "11px",
            }}
          />
        </div>

      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "22px",
        }}
      >
        <button
          type="button"
          onClick={handleClosePasswordModal}
          disabled={passwordLoading}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={passwordLoading}
        >
          {passwordLoading
            ? "Changing..."
            : "Change Password"}
        </button>
      </div>

    </form>
  </Modal>

</div>


);
};

export default Profile;
