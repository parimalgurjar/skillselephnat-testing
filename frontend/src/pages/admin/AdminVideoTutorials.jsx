
import { useEffect, useRef, useState } from "react";
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
  ChevronDown,
  Check,
} from "lucide-react";

import AlertModal from "../../components/common/AlertModal";
import api from "../../services/api";
import { getCourses } from "../../services/courseApi";
import { getModulesByCourse } from "../../services/moduleApi";
import "./AdminVideoTutorials.css";

const initialForm = {
  title: "",
  youtubeUrl: "",
};

const AdminVideoTutorials = () => {
  const [videos, setVideos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);

  const [editingVideo, setEditingVideo] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
const [showCourseDropdown, setShowCourseDropdown] = useState(false);
const courseDropdownRef = useRef(null);
  const moduleDropdownRef = useRef(null);

  const [alert, setAlert] = useState({
    isOpen: false,
    type: "error",
    title: "",
    message: "",
  });

  // Close module dropdown when clicking outside

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        courseDropdownRef.current &&
        !courseDropdownRef.current.contains(event.target)
      ) {
        setShowCourseDropdown(false);
      }

      if (
        moduleDropdownRef.current &&
        !moduleDropdownRef.current.contains(event.target)
      ) {
        setShowModuleDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);


    

  // Show alert
  const showMessage = (title, message) => {
    setAlert({
      isOpen: true,
      type: "error",
      title,
      message,
    });
  };

  // ==============================
  // FETCH VIDEOS
  // ==============================

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

  // ==============================
  // FETCH COURSES
  // ==============================

  const fetchCourses = async () => {
    try {
      const response = await getCourses();

      const courseList = Array.isArray(response)
        ? response
        : response?.courses || response?.data || [];

      setCourses(courseList);

      if (courseList.length > 0) {
        setSelectedCourseId((prev) => {
          if (prev) return prev;

          return courseList[0]._id || courseList[0].id;
        });
      }
    } catch (err) {
      console.error("Fetch courses error:", err);
      setFormError("Unable to load courses.");
    }
  };

  // ==============================
  // FETCH MODULES
  // ==============================

  const fetchModules = async (courseId) => {
    if (!courseId) {
      setModules([]);
      return;
    }

    try {
      setModulesLoading(true);

      const response = await getModulesByCourse(courseId);

      const moduleList = Array.isArray(response)
        ? response
        : response?.modules || response?.data || [];

      const activeModules = moduleList
        .filter((module) => module.isActive !== false)
        .sort(
          (a, b) =>
            Number(a.moduleNumber || 0) -
            Number(b.moduleNumber || 0)
        );

      setModules(activeModules);
    } catch (err) {
      console.error("Fetch modules error:", err);

      setModules([]);
      setFormError("Unable to load course modules.");
    } finally {
      setModulesLoading(false);
    }
  };

  // ==============================
  // INITIAL LOAD
  // ==============================

  useEffect(() => {
    fetchVideos();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchModules(selectedCourseId);
    } else {
      setModules([]);
    }
  }, [selectedCourseId]);

  // ==============================
  // MODULE SELECTION
  // ==============================

  const handleModuleToggle = (moduleId) => {
    setSelectedModuleIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const selectedModules = modules.filter((module) =>
    selectedModuleIds.includes(module._id)
  );

  // ==============================
  // OPEN ADD MODAL
  // ==============================

  const openAddModal = () => {
    setEditingVideo(null);
    setFormData(initialForm);
    setSelectedModuleIds([]);
    setShowModuleDropdown(false);
    setFormError("");
    setShowModal(true);
  };

  // ==============================
  // OPEN EDIT MODAL
  // ==============================

  const openEditModal = (video) => {
    const videoModules = video.modules || [];

    const firstModule = videoModules[0];

    const courseId = firstModule
      ? (
          firstModule.courseId?._id ||
          firstModule.courseId ||
          ""
        )
      : "";

    setEditingVideo(video);

    setFormData({
      title: video.title || "",
      youtubeUrl: video.youtubeUrl || "",
    });

    setSelectedModuleIds(
      videoModules.map((module) =>
        typeof module === "string"
          ? module
          : module._id
      )
    );

    if (courseId) {
      setSelectedCourseId(String(courseId));
    }

    setShowModuleDropdown(false);
    setFormError("");
    setShowModal(true);
  };

  // ==============================
  // CLOSE MODAL
  // ==============================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingVideo(null);
    setFormData(initialForm);
    setSelectedModuleIds([]);
    setShowModuleDropdown(false);
    setFormError("");
  };

  // ==============================
  // INPUT CHANGE
  // ==============================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==============================
  // ADD / UPDATE VIDEO
  // ==============================

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

    if (!selectedCourseId) {
      setFormError("Please select a course.");
      return;
    }

    if (selectedModuleIds.length === 0) {
      setFormError("Please select at least one module.");
      return;
    }

    if (modulesLoading) {
      setFormError("Please wait while modules are loading.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: formData.title.trim(),
        youtubeUrl: formData.youtubeUrl.trim(),
        modules: selectedModuleIds,
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
      setSelectedModuleIds([]);
      setShowModuleDropdown(false);
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

  // ==============================
  // DELETE VIDEO
  // ==============================

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

  // ==============================
  // PUBLISH / UNPUBLISH
  // ==============================

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

  // ==============================
  // RENDER
  // ==============================

  return (
    <div className="admin-video-page">

      {/* PAGE HEADER */}

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

      {/* VIDEO SUMMARY */}

      <div className="admin-video-summary">
        <div className="admin-video-summary-icon">
          <Video size={22} />
        </div>

        <div>
          <span>Total Videos</span>
          <strong>{videos.length}</strong>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="admin-video-error">
          {error}

          <button type="button" onClick={fetchVideos}>
            Retry
          </button>
        </div>
      )}

      {/* VIDEO LIST */}

      {loading ? (
        <div className="admin-video-loading">
          <LoaderCircle
            className="admin-video-spinner"
            size={28}
          />
          <span>Loading video tutorials...</span>
        </div>
      ) : videos.length === 0 ? (
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

                {/* ASSIGNED MODULES */}

                {video.modules?.length > 0 && (
                  <div className="admin-video-card-modules">
                    {video.modules.map((module, index) => (
                      <span
                        key={
                          typeof module === "string"
                            ? module
                            : module._id || index
                        }
                      >
                        {typeof module === "string"
                          ? "Assigned Module"
                          : `Module ${module.moduleNumber}: ${module.name}`}
                      </span>
                    ))}
                  </div>
                )}

                <div className="admin-video-card-actions">

                  <button
                    type="button"
                    className="admin-video-action-btn"
                    onClick={() => openEditModal(video)}
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

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

      {/* ADD / EDIT MODAL */}

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
                  {editingVideo ? "Edit Video" : "Add New Video"}
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

              {/* VIDEO TITLE */}

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

              {/* YOUTUBE URL */}

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

              {/* COURSE DROPDOWN */}

            
{/* CUSTOM COURSE DROPDOWN */}

<div className="admin-video-form-group">
  <label>Select Course</label>

  <div
    className="admin-video-course-dropdown"
    ref={courseDropdownRef}
  >
    <button
      type="button"
      className={`admin-video-course-trigger ${
        showCourseDropdown ? "open" : ""
      }`}
      onClick={() =>
        setShowCourseDropdown((prev) => !prev)
      }
      disabled={courses.length === 0}
      aria-expanded={showCourseDropdown}
    >
      <span>
        {courses.find(
          (course) =>
            String(course._id || course.id) ===
            String(selectedCourseId)
        )?.name ||
          courses.find(
            (course) =>
              String(course._id || course.id) ===
              String(selectedCourseId)
          )?.title ||
          "Choose a course"}
      </span>

      <ChevronDown
        size={18}
        className={showCourseDropdown ? "rotated" : ""}
      />
    </button>

    {showCourseDropdown && (
      <div className="admin-video-course-menu">
        {courses.map((course) => {
          const courseId = String(course._id || course.id);
          const isSelected =
            String(selectedCourseId) === courseId;

          return (
            <button
              type="button"
              key={courseId}
              className={`admin-video-course-option ${
                isSelected ? "selected" : ""
              }`}
              onClick={() => {
                setSelectedCourseId(courseId);
                setSelectedModuleIds([]);
                setShowCourseDropdown(false);
                setShowModuleDropdown(false);
              }}
            >
              <span>
                {course.name || course.title}
              </span>

              {isSelected && <Check size={17} />}
            </button>
          );
        })}
      </div>
    )}
  </div>
</div>


              {/* MODULE MULTI SELECT */}

              <div className="admin-video-form-group">
                <label>
                  Select Modules
                </label>

                <small>
                  Choose one or more modules related to this video.
                </small>

                <div
                  ref={moduleDropdownRef}
                  style={{
                    position: "relative",
                    width: "100%",
                  }}
                >
                  {/* DROPDOWN BUTTON */}

                  <button
                    type="button"
                    onClick={() =>
                      setShowModuleDropdown((prev) => !prev)
                    }
                    disabled={!selectedCourseId || modulesLoading}
                    aria-expanded={showModuleDropdown}
                    style={{
                      width: "100%",
                      minHeight: "46px",
                      padding: "0 14px",
                      border: showModuleDropdown
                        ? "1px solid #011451"
                        : "1px solid #dce2ec",
                      borderRadius: "9px",
                      background: "#ffffff",
                      color: "#172033",
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>
                      {modulesLoading
                        ? "Loading modules..."
                        : selectedModuleIds.length > 0
                        ? `${selectedModuleIds.length} Modules Selected`
                        : "Choose Modules"}
                    </span>

                    <ChevronDown
                      size={18}
                      style={{
                        color: "#64748b",
                        transition: "transform 0.2s ease",
                        transform: showModuleDropdown
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    />
                  </button>

                  {/* DROPDOWN MENU */}

                  {showModuleDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 7px)",
                        left: 0,
                        width: "100%",
                        maxHeight: "240px",
                        overflowY: "auto",
                        padding: "6px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        boxShadow:
                          "0 12px 30px rgba(15,23,42,0.15)",
                        zIndex: 200,
                      }}
                    >
                      {modules.length === 0 ? (
                        <div
                          style={{
                            padding: "20px",
                            textAlign: "center",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          No active modules available.
                        </div>
                      ) : (
                        modules.map((module) => {
                          const isSelected =
                            selectedModuleIds.includes(module._id);

                          return (
                            <label
                              key={module._id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "11px",
                                padding: "12px",
                                marginBottom: "3px",
                                borderRadius: "7px",
                                background: isSelected
                                  ? "#fff7e6"
                                  : "#ffffff",
                                cursor: "pointer",
                                transition: "background 0.15s ease",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  handleModuleToggle(module._id)
                                }
                                style={{
                                  position: "absolute",
                                  opacity: 0,
                                  width: "1px",
                                  height: "1px",
                                }}
                              />

                              {/* CUSTOM CHECKBOX */}

                              <span
                                style={{
                                  width: "19px",
                                  height: "19px",
                                  minWidth: "19px",
                                  border: isSelected
                                    ? "1.5px solid #f6af1d"
                                    : "1.5px solid #cbd5e1",
                                  borderRadius: "5px",
                                  background: isSelected
                                    ? "#f6af1d"
                                    : "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#011451",
                                }}
                              >
                                {isSelected && <Check size={13} />}
                              </span>

                              {/* MODULE NAME */}

                              <span
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "3px",
                                  minWidth: 0,
                                }}
                              >
                                <strong
                                  style={{
                                    color: "#172033",
                                    fontSize: "12px",
                                    fontWeight: 750,
                                  }}
                                >
                                  Module {module.moduleNumber}
                                </strong>

                                <span
                                  style={{
                                    color: "#64748b",
                                    fontSize: "12px",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {module.name}
                                </span>
                              </span>
                            </label>
                          );
                        })
                      )}

                      {/* CLOSE DROPDOWN */}

                      <button
                        type="button"
                        onClick={() => setShowModuleDropdown(false)}
                        style={{
                          width: "100%",
                          padding: "9px",
                          marginTop: "5px",
                          border: "none",
                          borderRadius: "7px",
                          background: "#011451",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: 650,
                          cursor: "pointer",
                        }}
                      >
                        Done
                      </button>
                    </div>
                  )}

                  {/* SELECTED MODULE TAGS */}

                  {selectedModules.length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      <span
                        style={{
                          display: "block",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#64748b",
                          marginBottom: "7px",
                        }}
                      >
                        Selected Modules
                      </span>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "7px",
                        }}
                      >
                        {selectedModules.map((module) => (
                          <span
                            key={module._id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 9px",
                              borderRadius: "6px",
                              background: "#fff4d6",
                              color: "#805600",
                              fontSize: "11px",
                              fontWeight: 650,
                            }}
                          >
                            Module {module.moduleNumber}

                            <button
                              type="button"
                              onClick={() =>
                                handleModuleToggle(module._id)
                              }
                              aria-label={`Remove ${module.name}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                border: "none",
                                background: "transparent",
                                color: "#805600",
                                cursor: "pointer",
                              }}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <small style={{ marginTop: "8px", display: "block" }}>
                    {selectedModuleIds.length} module(s) selected
                  </small>
                </div>
              </div>

              {/* FORM ERROR */}

              {formError && (
                <div className="admin-video-form-error">
                  {formError}
                </div>
              )}

              {/* FORM ACTIONS */}

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
                  disabled={saving || modulesLoading}
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
                      {editingVideo ? "Save Changes" : "Add Video"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}

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

      {/* ALERT */}

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
