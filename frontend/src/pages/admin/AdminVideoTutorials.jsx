
import { useEffect, useState } from "react";
import {
  Plus,
  Play,
  Pencil,
  Trash2,
  X,
  Video,
  ExternalLink,
  LoaderCircle,
  Eye,
  EyeOff,
} from "lucide-react";

import AlertModal from "../../components/common/AlertModal";
import api from "../../services/api";
import "./AdminVideoTutorials.css";

const initialForm = {
  title: "",
  youtubeUrl: "",
};

const AdminVideoTutorials = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [alert, setAlert] = useState({
    isOpen: false,
    type: "error",
    title: "",
    message: "",
  });

  const showMessage = (title, message) => {
    setAlert({
      isOpen: true,
      type: "error",
      title,
      message,
    });
  };

  // Fetch all videos
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/video-tutorials");

      if (response.data?.success) {
        setVideos(response.data.videos || []);
      } else {
        setVideos([]);
      }
    } catch (err) {
      console.error("Fetch videos error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load video tutorials."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Open Add Modal
  const openAddModal = () => {
    setEditingVideo(null);
    setFormData(initialForm);
    setFormError("");
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (video) => {
    setEditingVideo(video);

    setFormData({
      title: video.title || "",
      youtubeUrl: video.youtubeUrl || "",
    });

    setFormError("");
    setShowModal(true);
  };

  // Close Add / Edit Modal
  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingVideo(null);
    setFormData(initialForm);
    setFormError("");
  };

  // Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add / Update Video
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim()) {
      setFormError("Please enter video title.");
      return;
    }

    if (!formData.youtubeUrl.trim()) {
      setFormError("Please enter YouTube video link.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: formData.title.trim(),
        youtubeUrl: formData.youtubeUrl.trim(),
      };

      if (editingVideo) {
        await api.patch(
          `/video-tutorials/${editingVideo._id}`,
          payload
        );
      } else {
        await api.post("/video-tutorials", payload);
      }

      setShowModal(false);
      setEditingVideo(null);
      setFormData(initialForm);
      setFormError("");

      await fetchVideos();
    } catch (err) {
      console.error("Save video error:", err);

      setFormError(
        err.response?.data?.message ||
          "Unable to save video tutorial."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete Video
  const handleDelete = async () => {
    if (!confirmDelete || deleting) return;

    try {
      setDeleting(true);

      const videoId = confirmDelete._id;

      await api.delete(`/video-tutorials/${videoId}`);

      setVideos((prev) =>
        prev.filter((item) => item._id !== videoId)
      );

      setConfirmDelete(null);
    } catch (err) {
      console.error("Delete video error:", err);

      showMessage(
        "Delete failed",
        err.response?.data?.message ||
          "Unable to delete video."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Publish / Unpublish Video
  const handlePublishToggle = async (video) => {
    if (updatingStatus) return;

    try {
      setUpdatingStatus(video._id);

      const updatedStatus = !video.isPublished;

      await api.patch(
        `/video-tutorials/${video._id}`,
        { isPublished: updatedStatus }
      );

      setVideos((prev) =>
        prev.map((item) =>
          item._id === video._id
            ? { ...item, isPublished: updatedStatus }
            : item
        )
      );
    } catch (err) {
      console.error("Publish status error:", err);

      showMessage(
        "Update failed",
        err.response?.data?.message ||
          "Unable to update publish status."
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <div className="admin-video-page">

      {/* Page Header */}
      <div className="admin-video-header">
        <div>
          <div className="admin-video-eyebrow">
            <Video size={15} />
            LEARNING RESOURCES
          </div>

          <h1>Video Tutorials</h1>

          <p>
            Manage and share learning videos with students and teachers.
          </p>
        </div>

        <button
          type="button"
          className="admin-video-add-btn"
          onClick={openAddModal}
        >
          <Plus size={19} />
          Add Video
        </button>
      </div>

      {/* Video Summary */}
      <div className="admin-video-summary">
        <div className="admin-video-summary-icon">
          <Video size={22} />
        </div>

        <div>
          <span>Total Videos</span>
          <strong>{videos.length}</strong>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="admin-video-error">
          {error}

          <button type="button" onClick={fetchVideos}>
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="admin-video-loading">
          <LoaderCircle
            className="admin-video-spinner"
            size={28}
          />
          <span>Loading video tutorials...</span>
        </div>
      ) : videos.length === 0 ? (
        /* Empty State */
        <div className="admin-video-empty">
          <div className="admin-video-empty-icon">
            <Video size={34} />
          </div>

          <h3>No video tutorials yet</h3>

          <p>
            Add your first YouTube tutorial to share it with
            students and teachers.
          </p>

          <button
            type="button"
            className="admin-video-add-btn"
            onClick={openAddModal}
          >
            <Plus size={18} />
            Add First Video
          </button>
        </div>
      ) : (
        /* Video Cards */
        <div className="admin-video-grid">
          {videos.map((video) => (
            <div
              className="admin-video-card"
              key={video._id}
            >
              <div className="admin-video-thumbnail">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  loading="lazy"
                />

                <div className="admin-video-play">
                  <Play size={25} fill="currentColor" />
                </div>

                <span
                  className={`admin-video-status ${
                    video.isPublished
                      ? "published"
                      : "unpublished"
                  }`}
                >
                  {video.isPublished
                    ? "Published"
                    : "Unpublished"}
                </span>
              </div>

              <div className="admin-video-card-body">
                <h3 title={video.title}>
                  {video.title}
                </h3>

                <div className="admin-video-card-actions">

                  {/* Edit */}
                  <button
                    type="button"
                    className="admin-video-action-btn"
                    onClick={() => openEditModal(video)}
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  {/* Publish / Unpublish */}
                  <button
                    type="button"
                    className="admin-video-action-btn"
                    onClick={() => handlePublishToggle(video)}
                    disabled={updatingStatus === video._id}
                  >
                    {updatingStatus === video._id ? (
                      <LoaderCircle
                        size={15}
                        className="admin-video-spinner"
                      />
                    ) : video.isPublished ? (
                      <>
                        <EyeOff size={15} />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye size={15} />
                        Publish
                      </>
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    className="admin-video-delete-btn"
                    onClick={() => setConfirmDelete(video)}
                    aria-label={`Delete ${video.title}`}
                    title="Delete Video"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-video-open-link"
                >
                  <ExternalLink size={14} />
                  Open on YouTube
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="admin-video-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="admin-video-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-video-modal-title"
          >
            <div className="admin-video-modal-header">
              <div>
                <span>LEARNING RESOURCES</span>

                <h2 id="admin-video-modal-title">
                  {editingVideo
                    ? "Edit Video"
                    : "Add New Video"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-video-form-group">
                <label htmlFor="video-title">
                  Video Title
                </label>

                <input
                  id="video-title"
                  type="text"
                  name="title"
                  placeholder="Enter video title"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength={150}
                  required
                />
              </div>

              <div className="admin-video-form-group">
                <label htmlFor="video-url">
                  YouTube Video Link
                </label>

                <input
                  id="video-url"
                  type="url"
                  name="youtubeUrl"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.youtubeUrl}
                  onChange={handleChange}
                  required
                />

                <small>
                  Paste the YouTube video URL.
                  Thumbnail will be generated automatically.
                </small>
              </div>

              {formError && (
                <div className="admin-video-form-error">
                  {formError}
                </div>
              )}

              <div className="admin-video-modal-actions">
                <button
                  type="button"
                  className="admin-video-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-video-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="admin-video-spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      {editingVideo
                        ? "Save Changes"
                        : "Add Video"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="admin-video-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !deleting
            ) {
              setConfirmDelete(null);
            }
          }}
        >
          <div
            className="admin-video-modal admin-video-confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-video-title"
          >
            <div className="admin-video-confirm-content">
              <div className="admin-video-confirm-icon">
                <Trash2 size={24} />
              </div>

              <h2 id="delete-video-title">
                Delete Video?
              </h2>

              <p>
                Are you sure you want to delete{" "}
                <strong>{confirmDelete.title}</strong>?
                This action cannot be undone.
              </p>

              <div className="admin-video-modal-actions">
                <button
                  type="button"
                  className="admin-video-cancel-btn"
                  onClick={() => setConfirmDelete(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-video-confirm-delete-btn"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="admin-video-spinner"
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Video
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert */}
      <AlertModal
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() =>
          setAlert((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
      />

    </div>
  );
};

export default AdminVideoTutorials;
