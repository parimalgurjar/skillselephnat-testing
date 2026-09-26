import {
  useEffect,
  useMemo,
  useState,
} from "react";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  Plus,
  Search,
  Megaphone,
  Users,
  GraduationCap,
  CalendarDays,
  X,
  Pin,
  Trash2,
  Edit,
  Send,
} from "lucide-react";

import api from "../../services/api";
import AlertModal from "../../components/common/AlertModal";
import "./AdminAnnouncements.css";

const initialFormState = {
  title: "",
  description: "",
  audience: "STUDENTS",
  priority: "NORMAL",
  pinned: false,
};

const AdminAnnouncements = () => {
  /* =====================================================
     STATES
  ===================================================== */

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [announcements, setAnnouncements] =
    useState([]);

  const [editingAnnouncement, setEditingAnnouncement] =
    useState(null);

  const [formData, setFormData] =
    useState(initialFormState);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [formError, setFormError] =
    useState("");
const [alert, setAlert] = useState({
  isOpen: false,
  type: "info",
  title: "",
  message: "",
});
const [deleteAnnouncement, setDeleteAnnouncement] = useState({
  isOpen: false,
  announcement: null,
});
  /* =====================================================
     FETCH ANNOUNCEMENTS
  ===================================================== */

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/announcements"
      );

      

      if (response.data?.success) {
        setAnnouncements(
          response.data.announcements || []
        );
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error(
        "Fetch Announcements Error:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load announcements"
      );

      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  /* =====================================================
     OPEN CREATE MODAL
  ===================================================== */

  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null);

    setFormData(
      initialFormState
    );

    setFormError("");

    setShowModal(true);
  };

  /* =====================================================
     OPEN EDIT MODAL
  ===================================================== */

  const handleEditAnnouncement = (
    announcement
  ) => {
    setEditingAnnouncement(
      announcement
    );

    setFormError("");

    setFormData({
      title:
        announcement.title || "",

      description:
        announcement.description ||
        announcement.message ||
        "",

      audience:
        announcement.audience ||
        "STUDENTS",

      priority:
        announcement.priority ||
        "NORMAL",

      pinned:
        Boolean(
          announcement.pinned
        ),
    });

    setShowModal(true);
  };

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const handleCloseModal = () => {
    if (submitting) return;

    setShowModal(false);

    setEditingAnnouncement(null);

    setFormError("");

    setFormData(
      initialFormState
    );
  };

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /* =====================================================
     CREATE / UPDATE ANNOUNCEMENT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      setFormError("");

      if (!formData.title.trim()) {
        setFormError(
          "Announcement title is required"
        );

        return;
      }

      if (!formData.description.trim()) {
        setFormError(
          "Announcement message is required"
        );

        return;
      }

      const payload = {
        title:
          formData.title.trim(),

        description:
          formData.description.trim(),

        audience:
          formData.audience,

        priority:
          formData.priority,

        pinned:
          formData.pinned,
      };

      if (editingAnnouncement) {
        await api.patch(
          `/announcements/${editingAnnouncement._id}`,
          payload
        );
      } else {
        await api.post(
          "/announcements",
          payload
        );
      }

      await fetchAnnouncements();

      handleCloseModal();
    } catch (error) {
      console.error(
        "Save Announcement Error:",
        error.response?.data || error
      );

      setFormError(
        error.response?.data?.message ||
          "Failed to save announcement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     DELETE ANNOUNCEMENT
  ===================================================== */

const handleDeleteAnnouncement = (announcement) => {
  setDeleteAnnouncement({
    isOpen: true,
    announcement,
  });
};

const confirmDeleteAnnouncement = async () => {
  const announcement = deleteAnnouncement.announcement;

  if (!announcement?._id) return;

  try {
    await api.delete(
      `/announcements/${announcement._id}`
    );

    await fetchAnnouncements();

    setDeleteAnnouncement({
      isOpen: false,
      announcement: null,
    });
  } catch (error) {
    console.error(
      "Delete Announcement Error:",
      error.response?.data || error
    );

    setDeleteAnnouncement({
      isOpen: false,
      announcement: null,
    });

    setAlert({
      isOpen: true,
      type: "error",
      title: "Delete Failed",
      message:
        error.response?.data?.message ||
        "Failed to delete announcement",
    });
  }
};

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    return new Date(
      dateValue
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =====================================================
     FORMAT AUDIENCE
  ===================================================== */

  const formatAudience = (
    audience
  ) => {
    switch (audience) {
      case "STUDENTS":
        return "Students";

      case "EDUCATORS":
      case "TEACHERS":
        return "Educators";

      case "EVERYONE":
      case "ALL":
        return "Everyone";

      default:
        return audience || "Everyone";
    }
  };

  /* =====================================================
     FILTER ANNOUNCEMENTS
  ===================================================== */

  const filteredAnnouncements =
    useMemo(() => {
      const searchValue =
        search.trim().toLowerCase();

      if (!searchValue) {
        return announcements;
      }

      return announcements.filter(
        (item) => {
          return (
            item.title
              ?.toLowerCase()
              .includes(searchValue) ||
            item.description
              ?.toLowerCase()
              .includes(searchValue) ||
            item.message
              ?.toLowerCase()
              .includes(searchValue) ||
            item.audience
              ?.toLowerCase()
              .includes(searchValue)
          );
        }
      );
    }, [
      announcements,
      search,
    ]);

  /* =====================================================
     STATS
  ===================================================== */

  const totalAnnouncements =
    announcements.length;

  const publishedAnnouncements =
    announcements.filter(
      (item) =>
        item.status === "PUBLISHED" ||
        item.status === "Published" ||
        !item.status
    ).length;

  const pinnedAnnouncements =
    announcements.filter(
      (item) => item.pinned
    ).length;

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="admin-announcements-page">
        <div
          style={{
            padding: "50px",
            textAlign: "center",
          }}
        >
          Loading announcements...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-announcements-page">

      {/* ================= HEADER ================= */}

      <div className="admin-announcements-header">

        <div>

          <span className="admin-page-label">
            ADMIN PORTAL
          </span>

          <h1>
            Announcements
          </h1>

          <p>
            Create and manage announcements
            for students and educators.
          </p>

        </div>

        <button
          className="create-announcement-btn"
          onClick={
            handleCreateAnnouncement
          }
        >
          <Plus size={18} />

          Create Announcement
        </button>

      </div>

      {/* ================= STATS ================= */}

      <div className="announcement-stats-grid">

        {/* TOTAL */}

        <div className="announcement-stat-card">

          <div className="announcement-stat-icon navy">

            <Megaphone size={21} />

          </div>

          <div>

            <span>
              Total Announcements
            </span>

            <strong>
              {totalAnnouncements}
            </strong>

            <small>
              All announcements
            </small>

          </div>

        </div>

        {/* PUBLISHED */}

        <div className="announcement-stat-card">

          <div className="announcement-stat-icon green">

            <Send size={21} />

          </div>

          <div>

            <span>
              Published
            </span>

            <strong>
              {publishedAnnouncements}
            </strong>

            <small>
              Currently visible
            </small>

          </div>

        </div>

        {/* PINNED */}

        <div className="announcement-stat-card">

          <div className="announcement-stat-icon yellow">

            <Pin size={21} />

          </div>

          <div>

            <span>
              Pinned
            </span>

            <strong>
              {pinnedAnnouncements}
            </strong>

            <small>
              Important announcements
            </small>

          </div>

        </div>

      </div>

      {/* ================= MAIN SECTION ================= */}

      <div className="announcements-main-card">

        <div className="announcements-card-header">

          <div>

            <h2>
              Recent Announcements
            </h2>

            <p>
              Manage announcements shared
              across the institute.
            </p>

          </div>

          {/* SEARCH */}

          <div className="announcement-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search announcement..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* ERROR */}

        {error && (

          <div
            style={{
              padding: "20px",
              textAlign: "center",
            }}
          >
            {error}
          </div>

        )}

        {/* ANNOUNCEMENT LIST */}

        <div className="announcement-list">

          {!error &&
            filteredAnnouncements.map(
              (item) => {

                const audience =
                  formatAudience(
                    item.audience
                  );

                const description =
                  item.description ||
                  item.message ||
                  "";

                return (

                  <div
                    className={`announcement-item ${
                      item.pinned
                        ? "pinned-announcement"
                        : ""
                    }`}
                    key={item._id}
                  >

                    {/* LEFT */}

                    <div className="announcement-left">

                      <div className="announcement-icon">

                        <Megaphone size={20} />

                      </div>

                      <div className="announcement-content">

                        <div className="announcement-title-row">

                          <h3>
                            {item.title}
                          </h3>

                          {item.pinned && (

                            <span className="pinned-badge">

                              <Pin size={11} />

                              Pinned

                            </span>

                          )}

                        </div>

                        <p>
                          {description}
                        </p>

                        <div className="announcement-meta">

                          {/* DATE */}

                          <span>

                            <CalendarDays
                              size={13}
                            />

                            {formatDate(
                              item.createdAt ||
                              item.date
                            )}

                          </span>

                          {/* AUDIENCE */}

                          <span>

                            {audience ===
                              "Students" && (
                              <Users
                                size={13}
                              />
                            )}

                            {audience ===
                              "Educators" && (
                              <GraduationCap
                                size={13}
                              />
                            )}

                            {audience ===
                              "Everyone" && (
                              <Users
                                size={13}
                              />
                            )}

                            {audience}

                          </span>

                        </div>

                      </div>

                    </div>

                    {/* RIGHT */}

                    <div className="announcement-actions">

                      <span className="announcement-status">

                        {item.status ||
                          "Published"}

                      </span>

                      <div className="announcement-action-buttons">

                        {/* EDIT */}

                        <button
                          title="Edit Announcement"
                          onClick={() =>
                            handleEditAnnouncement(
                              item
                            )
                          }
                        >

                          <Edit size={15} />

                        </button>

                        {/* DELETE */}

                        <button
                          className="announcement-delete-btn"
                          title="Delete Announcement"
                          onClick={() =>
                            handleDeleteAnnouncement(
                              item
                            )
                          }
                        >

                          <Trash2 size={15} />

                        </button>

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          {/* EMPTY */}

          {!error &&
            filteredAnnouncements.length === 0 && (

              <div className="no-announcements">

                No announcements found.

              </div>

            )}

        </div>

      </div>

      {/* ================= CREATE / EDIT MODAL ================= */}

      {showModal && (

        <div className="announcement-modal-overlay">

          <div className="announcement-modal">

            {/* HEADER */}

            <div className="announcement-modal-header">

              <div>

                <h2>

                  {editingAnnouncement
                    ? "Edit Announcement"
                    : "Create Announcement"}

                </h2>

                <p>

                  {editingAnnouncement
                    ? "Update announcement details."
                    : "Share important information with your audience."}

                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseModal
                }
                disabled={submitting}
              >

                <X size={20} />

              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="announcement-form">

                {/* ERROR */}

                {formError && (

                  <div
                    style={{
                      color: "#dc2626",
                      marginBottom: "15px",
                      fontSize: "14px",
                    }}
                  >
                    {formError}
                  </div>

                )}

                {/* TITLE */}

                <div className="announcement-form-group">

                  <label>
                    Announcement Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={
                      formData.title
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter announcement title"
                    disabled={
                      submitting
                    }
                  />

                </div>

                {/* MESSAGE */}

                <div className="announcement-form-group">

                  <label>
                    Message
                  </label>

                  <textarea
                    rows="5"
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Write your announcement..."
                    disabled={
                      submitting
                    }
                  />

                </div>

                {/* AUDIENCE + PRIORITY */}

                <div className="announcement-form-row">

                  {/* AUDIENCE */}

                  <div className="announcement-form-group">

                    <label>
                      Audience
                    </label>

                    <select
                      name="audience"
                      value={
                        formData.audience
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitting
                      }
                    >

                      <option value="STUDENTS">
                        All Students
                      </option>

                      <option value="EDUCATORS">
                        All Educators
                      </option>

                      <option value="EVERYONE">
                        Everyone
                      </option>

                    </select>

                  </div>

                  {/* PRIORITY */}

                  <div className="announcement-form-group">

                    <label>
                      Priority
                    </label>

                    <select
                      name="priority"
                      value={
                        formData.priority
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitting
                      }
                    >

                      <option value="NORMAL">
                        Normal
                      </option>

                      <option value="IMPORTANT">
                        Important
                      </option>

                      <option value="URGENT">
                        Urgent
                      </option>

                    </select>

                  </div>

                </div>

                {/* PIN */}

                <label className="pin-announcement-option">

                  <input
                    type="checkbox"
                    name="pinned"
                    checked={
                      formData.pinned
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      submitting
                    }
                  />

                  <span>
                    Pin this announcement
                  </span>

                </label>

              </div>

              {/* FOOTER */}

              <div className="announcement-modal-footer">

                <button
                  type="button"
                  className="cancel-announcement-btn"
                  onClick={
                    handleCloseModal
                  }
                  disabled={
                    submitting
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="publish-announcement-btn"
                  disabled={
                    submitting
                  }
                >

                  <Send size={15} />

                  {submitting
                    ? "Saving..."
                    : editingAnnouncement
                    ? "Update Announcement"
                    : "Publish Announcement"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}
      <ConfirmModal
  isOpen={deleteAnnouncement.isOpen}
  onClose={() =>
    setDeleteAnnouncement({
      isOpen: false,
      announcement: null,
    })
  }
  onConfirm={confirmDeleteAnnouncement}
  title="Delete Announcement"
  message={
    deleteAnnouncement.announcement
      ? `Are you sure you want to delete "${deleteAnnouncement.announcement.title}"?`
      : "Are you sure you want to delete this announcement?"
  }
  confirmText="Delete"
  cancelText="Cancel"
/>
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

export default AdminAnnouncements;