
import { useEffect, useMemo, useState } from "react";
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
  ChevronDown,
  Check,
} from "lucide-react";
import { getBatchLabel } from "../../utils/batchUtils";
import api from "../../services/api";
import AlertModal from "../../components/common/AlertModal";
import "./AdminAnnouncements.css";

const initialFormState = {
  title: "",
  description: "",
  audience: "STUDENTS",
  batchId: "",
  priority: "NORMAL",
  pinned: false,
};

// ==========================================
// CLEAN BATCH NAME + COMPLETE TIMING
// ==========================================

const getAnnouncementBatchLabel = (batch) => {
  if (!batch) return "Unnamed Batch";
  return getBatchLabel(batch);
};

// ==========================================
// REUSABLE CUSTOM DROPDOWN
// ==========================================

const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Select option",
  disabled = false,
  placement = "bottom",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  return (
    <div
      className={`announcement-custom-dropdown ${
        isOpen ? "is-open" : ""
      } ${placement === "top" ? "opens-upward" : ""}`}
    >
      <button
        type="button"
        className={`announcement-custom-dropdown-trigger ${
          isOpen ? "is-open" : ""
        }`}
        onClick={() => setIsOpen((previous) => !previous)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="announcement-custom-dropdown-value">
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={17}
          className={`announcement-custom-dropdown-chevron ${
            isOpen ? "rotated" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="announcement-custom-dropdown-backdrop"
            aria-label="Close dropdown"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="announcement-custom-dropdown-menu"
            role="listbox"
          >
            {options.map((option) => {
              const selected =
                String(option.value) === String(value);

              return (
                <button
                  type="button"
                  key={String(option.value)}
                  role="option"
                  aria-selected={selected}
                  className={`announcement-custom-dropdown-option ${
                    selected ? "selected" : ""
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {selected && <Check size={16} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const AdminAnnouncements = () => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({ ...initialFormState });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

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

  // ==========================================
  // FETCH ANNOUNCEMENTS
  // ==========================================

  const fetchAnnouncements = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      const response = await api.get("/announcements");

      if (response.data?.success) {
        setAnnouncements(response.data.announcements || []);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error(
        "Fetch Announcements Error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load announcements"
      );

      setAnnouncements([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ==========================================
  // FETCH BATCHES
  // ==========================================

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);

      const response = await api.get("/batches/public");
      const data = response.data;

      const batchList = Array.isArray(data)
        ? data
        : data?.batches ||
          data?.data?.batches ||
          data?.data ||
          [];

      setBatches(
        Array.isArray(batchList)
          ? batchList.filter(
              (batch) =>
                batch &&
                batch._id &&
                batch.status !== "INACTIVE"
            )
          : []
      );
    } catch (err) {
      console.error(
        "Fetch Batches Error:",
        err.response?.data || err
      );

      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchAnnouncements();
    fetchBatches();
  }, []);

  // ==========================================
  // OPEN CREATE MODAL
  // ==========================================

  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setFormData({ ...initialFormState });
    setFormError("");
    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormError("");

    setFormData({
      title: announcement.title || "",

      description:
        announcement.description ||
        announcement.message ||
        "",

      audience: announcement.audience || "STUDENTS",

      batchId:
        typeof announcement.batchId === "object"
          ? announcement.batchId?._id || ""
          : announcement.batchId || "",

      priority: announcement.priority || "NORMAL",

      pinned: Boolean(announcement.pinned),
    });

    setShowModal(true);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const handleCloseModal = () => {
    if (submitting) return;

    setShowModal(false);
    setEditingAnnouncement(null);
    setFormError("");
    setFormData({ ...initialFormState });
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((previous) => ({
      ...previous,

      [name]: type === "checkbox" ? checked : value,

      ...(name === "audience" && value !== "STUDENTS"
        ? { batchId: "" }
        : {}),
    }));
  };

  // ==========================================
  // CREATE / UPDATE ANNOUNCEMENT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);
      setFormError("");

      if (!formData.title.trim()) {
        setFormError("Announcement title is required");
        return;
      }

      if (!formData.description.trim()) {
        setFormError("Announcement message is required");
        return;
      }

      if (
        formData.audience === "STUDENTS" &&
        formData.batchId &&
        !batches.some(
          (batch) => batch._id === formData.batchId
        )
      ) {
        setFormError(
          "Selected batch is not available. Please select another batch."
        );
        return;
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),

        audience: formData.audience,

        batchId:
          formData.audience === "STUDENTS"
            ? formData.batchId || null
            : null,

        priority: formData.priority,
        pinned: formData.pinned,
      };

      if (editingAnnouncement) {
        await api.patch(
          `/announcements/${editingAnnouncement._id}`,
          payload
        );
      } else {
        await api.post("/announcements", payload);
      }

      setShowModal(false);
      setEditingAnnouncement(null);
      setFormData({ ...initialFormState });
      setFormError("");

      await fetchAnnouncements(true);

      setAlert({
        isOpen: true,
        type: "success",
        title: editingAnnouncement
          ? "Announcement Updated"
          : "Announcement Published",
        message: editingAnnouncement
          ? "Announcement has been updated successfully."
          : "Announcement has been published successfully.",
      });
    } catch (err) {
      console.error(
        "Save Announcement Error:",
        err.response?.data || err
      );

      setFormError(
        err.response?.data?.message ||
          "Failed to save announcement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // DELETE ANNOUNCEMENT
  // ==========================================

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

      setDeleteAnnouncement({
        isOpen: false,
        announcement: null,
      });

      await fetchAnnouncements(true);

      setAlert({
        isOpen: true,
        type: "success",
        title: "Announcement Deleted",
        message: "Announcement deleted successfully.",
      });
    } catch (err) {
      console.error(
        "Delete Announcement Error:",
        err.response?.data || err
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
          err.response?.data?.message ||
          "Failed to delete announcement",
      });
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // FORMAT AUDIENCE
  // ==========================================

  const formatAudience = (audience) => {
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

  // ==========================================
  // GET BATCH DETAILS
  // ==========================================

  const getBatchName = (batchId) => {
  if (!batchId) return "All Batches";

  if (typeof batchId === "object") {
    return getBatchLabel(batchId);
  }

  const batch = batches.find(
    (item) => item._id === batchId
  );

  if (!batch) return "Selected Batch";

  return getBatchLabel(batch);
};

  // ==========================================
  // FILTER ANNOUNCEMENTS
  // ==========================================

  const filteredAnnouncements = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) return announcements;

    return announcements.filter((item) => {
      const batchName = getBatchName(item.batchId);

      return (
        item.title?.toLowerCase().includes(searchValue) ||
        item.description?.toLowerCase().includes(searchValue) ||
        item.message?.toLowerCase().includes(searchValue) ||
        item.audience?.toLowerCase().includes(searchValue) ||
        batchName.toLowerCase().includes(searchValue)
      );
    });
  }, [announcements, search, batches]);

  // ==========================================
  // STATS
  // ==========================================

  const totalAnnouncements = announcements.length;

  const publishedAnnouncements = announcements.filter(
    (item) =>
      item.status === "PUBLISHED" ||
      item.status === "Published" ||
      !item.status
  ).length;

  const pinnedAnnouncements = announcements.filter(
    (item) => item.pinned
  ).length;

  // ==========================================
  // LOADING
  // ==========================================

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

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="admin-announcements-page">

      {/* HEADER */}

      <div className="admin-announcements-header">
        <div>
          <span className="admin-page-label">
            ADMIN PORTAL
          </span>

          <h1>Announcements</h1>

          <p>
            Create and manage announcements
            for students and educators.
          </p>
        </div>

        <button
          className="create-announcement-btn"
          onClick={handleCreateAnnouncement}
        >
          <Plus size={18} />
          Create Announcement
        </button>
      </div>

      {/* STATS */}

      <div className="announcement-stats-grid">

        <div className="announcement-stat-card">
          <div className="announcement-stat-icon navy">
            <Megaphone size={21} />
          </div>

          <div>
            <span>Total Announcements</span>
            <strong>{totalAnnouncements}</strong>
            <small>All announcements</small>
          </div>
        </div>

        <div className="announcement-stat-card">
          <div className="announcement-stat-icon green">
            <Send size={21} />
          </div>

          <div>
            <span>Published</span>
            <strong>{publishedAnnouncements}</strong>
            <small>Currently visible</small>
          </div>
        </div>

        <div className="announcement-stat-card">
          <div className="announcement-stat-icon yellow">
            <Pin size={21} />
          </div>

          <div>
            <span>Pinned</span>
            <strong>{pinnedAnnouncements}</strong>
            <small>Important announcements</small>
          </div>
        </div>

      </div>

      {/* MAIN SECTION */}

      <div className="announcements-main-card">

        <div className="announcements-card-header">
          <div>
            <h2>Recent Announcements</h2>

            <p>
              Manage announcements shared
              across the institute.
            </p>
          </div>

          <div className="announcement-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search announcement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
            filteredAnnouncements.map((item) => {
              const audience = formatAudience(item.audience);

              const description =
                item.description || item.message || "";

              return (
                <div
                  className={`announcement-item ${
                    item.pinned ? "pinned-announcement" : ""
                  }`}
                  key={item._id}
                >

                  <div className="announcement-left">

                    <div className="announcement-icon">
                      <Megaphone size={20} />
                    </div>

                    <div className="announcement-content">

                      <div className="announcement-title-row">
                        <h3>{item.title}</h3>

                        {item.pinned && (
                          <span className="pinned-badge">
                            <Pin size={11} />
                            Pinned
                          </span>
                        )}
                      </div>

                      <p>{description}</p>

                      <div className="announcement-meta">

                        <span>
                          <CalendarDays size={13} />
                          {formatDate(
                            item.createdAt || item.date
                          )}
                        </span>

                        <span>
                          {audience === "Students" && (
                            <Users size={13} />
                          )}

                          {audience === "Educators" && (
                            <GraduationCap size={13} />
                          )}

                          {audience === "Everyone" && (
                            <Users size={13} />
                          )}

                          {audience}
                        </span>

                        {item.audience === "STUDENTS" && (
                          <span>
                            <Users size={13} />
                            {getBatchName(item.batchId)}
                          </span>
                        )}

                      </div>
                    </div>
                  </div>

                  <div className="announcement-actions">

                    <span className="announcement-status">
                      {item.status || "Published"}
                    </span>

                    <div className="announcement-action-buttons">

                      <button
                        type="button"
                        title="Edit Announcement"
                        onClick={() =>
                          handleEditAnnouncement(item)
                        }
                      >
                        <Edit size={15} />
                      </button>

                      <button
                        type="button"
                        className="announcement-delete-btn"
                        title="Delete Announcement"
                        onClick={() =>
                          handleDeleteAnnouncement(item)
                        }
                      >
                        <Trash2 size={15} />
                      </button>

                    </div>
                  </div>
                </div>
              );
            })}

          {!error && filteredAnnouncements.length === 0 && (
            <div className="no-announcements">
              No announcements found.
            </div>
          )}

        </div>
      </div>

      {/* CREATE / EDIT MODAL */}

      {showModal && (
        <div className="announcement-modal-overlay">

          <div className="announcement-modal">

            {/* MODAL HEADER */}

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
                onClick={handleCloseModal}
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit}>

              <div className="announcement-form">

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
                  <label>Announcement Title</label>

                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter announcement title"
                    disabled={submitting}
                  />
                </div>

                {/* MESSAGE */}

                <div className="announcement-form-group">
                  <label>Message</label>

                  <textarea
                    rows="5"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Write your announcement..."
                    disabled={submitting}
                  />
                </div>

                {/* AUDIENCE + PRIORITY */}

                <div className="announcement-form-row">

                  <div className="announcement-form-group">
                    <label>Audience</label>

                    <CustomDropdown
                      value={formData.audience}
                      onChange={(value) =>
                        handleChange({
                          target: {
                            name: "audience",
                            value,
                            type: "select-one",
                          },
                        })
                      }
                      disabled={submitting}
                      options={[
                        {
                          value: "STUDENTS",
                          label: "All Students",
                        },
                        {
                          value: "TEACHERS",
                          label: "All Educators",
                        },
                        {
                          value: "EVERYONE",
                          label: "Everyone",
                        },
                      ]}
                    />
                  </div>

                  <div className="announcement-form-group">
                    <label>Priority</label>

                    <CustomDropdown
                      value={formData.priority}
                      onChange={(value) =>
                        handleChange({
                          target: {
                            name: "priority",
                            value,
                            type: "select-one",
                          },
                        })
                      }
                      disabled={submitting}
                      options={[
                        {
                          value: "NORMAL",
                          label: "Normal",
                        },
                        {
                          value: "IMPORTANT",
                          label: "Important",
                        },
                        {
                          value: "URGENT",
                          label: "Urgent",
                        },
                      ]}
                    />
                  </div>

                </div>

                {/* BATCH SELECTION */}

                {formData.audience === "STUDENTS" && (
                  <div className="announcement-form-group">
                    <label>Select Batch (Optional)</label>

                    <CustomDropdown
                      value={formData.batchId}
                      onChange={(value) =>
                        handleChange({
                          target: {
                            name: "batchId",
                            value,
                            type: "select-one",
                          },
                        })
                      }
                      placeholder="Select Specific Batch"
                      disabled={submitting || loadingBatches}
                      placement="top"
                      options={[
                        {
                          value: "",
                          label: "All Batches (All Students)",
                        },
                        ...batches.map((batch) => ({
                          value: batch._id,
                          label: getAnnouncementBatchLabel(batch),
                        })),
                      ]}
                    />

                    <small>
                      Leave empty to send announcement to all students
                      across all batches.
                    </small>
                  </div>
                )}

                {/* PIN */}

                <label className="pin-announcement-option">
                  <input
                    type="checkbox"
                    name="pinned"
                    checked={formData.pinned}
                    onChange={handleChange}
                    disabled={submitting}
                  />

                  <span>Pin this announcement</span>
                </label>

              </div>

              {/* FOOTER */}

              <div className="announcement-modal-footer">

                <button
                  type="button"
                  className="cancel-announcement-btn"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="publish-announcement-btn"
                  disabled={submitting || loadingBatches}
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

      {/* DELETE CONFIRMATION */}

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

      {/* ALERT */}

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
