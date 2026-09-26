import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CircleHelp,
  Clock3,
  CheckCircle2,
  MessageSquare,
  Plus,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { getActiveSpecializations } from "../../services/specializationApi";
import {
  createDoubt,
  getDoubts,
} from "../../services/doubtApi";

import "./MyDoubts.css";

const INITIAL_FORM_DATA = {
  topic: "",
  title: "",
  description: "",
};

const MyDoubts = () => {
  const navigate = useNavigate();

  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  
  const [specializations, setSpecializations] = useState([]);
  const [specializationsLoading, setSpecializationsLoading] = useState(true);

  /* =====================================================
     FETCH SPECIALIZATIONS (TOPICS)
  ===================================================== */

  useEffect(() => {
    const loadSpecializations = async () => {
      try {
        setSpecializationsLoading(true);

        const response = await getActiveSpecializations();

        setSpecializations(
          response?.specializations || []
        );
      } catch (error) {
        console.error(
          "Failed to load specializations:",
          error
        );

        setSpecializations([]);
      } finally {
        setSpecializationsLoading(false);
      }
    };

    loadSpecializations();
  }, []);

  /* =====================================================
     FETCH DOUBTS
  ===================================================== */

  const fetchDoubts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDoubts();

      /*
        Supports both:
        response.data
        OR direct response object
      */

      const data = response?.data || response;

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to fetch doubts"
        );
      }

      setDoubts(
        Array.isArray(data.doubts)
          ? data.doubts
          : []
      );
    } catch (err) {
      console.error(
        "Fetch Doubts Error:",
        err
      );

      setDoubts([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to fetch doubts"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]);

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
     CLOSE FORM
  ===================================================== */

  const closeForm = () => {
    if (submitting) return;

    setShowForm(false);
    setFormData(INITIAL_FORM_DATA);
  };

  /* =====================================================
     CREATE DOUBT
  ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.topic.trim() ||
      !formData.title.trim() ||
      !formData.description.trim()
    ) {
      setError("Please fill all required fields.");
      return;
    }

    const payload = new FormData();
    payload.append("topic", formData.topic.trim());
    payload.append("title", formData.title.trim());
    payload.append("description", formData.description.trim());

    if (selectedFile) {
      payload.append("attachment", selectedFile);
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await createDoubt(payload);

      const data = response?.data || response;

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to submit doubt"
        );
      }

      setSelectedFile(null);
      setFileInputKey(Date.now());
      setFormData(INITIAL_FORM_DATA);
      setShowForm(false);

      await fetchDoubts();
    } catch (err) {
      console.error(
        "Create Doubt Error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to submit doubt"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     STATUS CONFIG
  ===================================================== */

  const getStatusConfig = (status) => {
    const normalizedStatus =
      String(status || "PENDING").toUpperCase();

    switch (normalizedStatus) {
      case "RESOLVED":
        return {
          label: "Resolved",
          className: "resolved",
          icon: <CheckCircle2 size={15} />,
        };

      case "IN_PROGRESS":
        return {
          label: "In Progress",
          className: "progress",
          icon: <Clock3 size={15} />,
        };

      case "CLOSED":
        return {
          label: "Closed",
          className: "closed",
          icon: <CheckCircle2 size={15} />,
        };

      default:
        return {
          label: "Pending",
          className: "pending",
          icon: <Clock3 size={15} />,
        };
    }
  };

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="my-doubts-page">
        <div className="doubts-loading">
          <Loader2
            size={30}
            className="doubts-spinner"
          />

          <p>
            Loading your doubts...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error && doubts.length === 0) {
    return (
      <div className="my-doubts-page">
        <div className="doubts-error-state">
          <AlertCircle size={30} />

          <div>
            <h3>
              Unable to load doubts
            </h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={fetchDoubts}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="my-doubts-page">

      {/* ===============================================
          HEADER
      =============================================== */}

      <div className="my-doubts-header">

        <div className="my-doubts-header-content">

          <span className="doubts-page-label">
            STUDENT PORTAL
          </span>

          <h1>
            My Doubts
          </h1>

          <p>
            Ask questions and get help directly
            from your assigned teacher.
          </p>

        </div>

        <div className="my-doubts-header-actions">

          <button
            type="button"
            className="doubts-refresh-button"
            onClick={fetchDoubts}
          >
            <RefreshCw size={17} />

            Refresh
          </button>

          <button
            type="button"
            className="ask-doubt-button"
            onClick={() => {
              setError("");
              setShowForm(true);
            }}
          >
            <Plus size={18} />

            Ask a Doubt
          </button>

        </div>

      </div>

      {/* ===============================================
          NON-BLOCKING ERROR
      =============================================== */}

      {error && doubts.length > 0 && (
        <div className="doubts-inline-error">

          <AlertCircle size={17} />

          <span>{error}</span>

          <button
            type="button"
            onClick={fetchDoubts}
          >
            Retry
          </button>

        </div>
      )}

      {/* ===============================================
          CREATE DOUBT MODAL
      =============================================== */}

      {showForm && (
        <div
          className="doubt-form-overlay"
          onMouseDown={closeForm}
        >

          <div
            className="doubt-form-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="doubt-modal-header">

              <div>

                <span>
                  NEW QUESTION
                </span>

                <h2>
                  Ask a Doubt
                </h2>

                <p>
                  Explain your question clearly
                  so your teacher can help you
                  better.
                </p>

              </div>

              <button
                type="button"
                className="close-doubt-modal"
                onClick={closeForm}
                disabled={submitting}
                aria-label="Close"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="doubt-form"
            >

              {/* TOPIC */}

              <div className="doubt-form-group">

                <label htmlFor="topic">
                  Topic
                </label>

                <select
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  disabled={submitting || specializationsLoading}
                  required
                >

                  <option value="">
                    {specializationsLoading
                      ? "Loading topics..."
                      : specializations.length === 0
                      ? "No topics available"
                      : "Select Topic"}
                  </option>

                  {specializations.map((item) => (
                    <option
                      key={item._id}
                      value={item.name}
                    >
                      {item.name}
                    </option>
                  ))}

                </select>

              </div>

              {/* TITLE */}

              <div className="doubt-form-group">

                <label htmlFor="title">
                  Doubt Title
                </label>

                <input
                  id="title"
                  type="text"
                  name="title"
                  placeholder="Briefly describe your doubt"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={submitting}
                  maxLength={150}
                  required
                />

              </div>

              {/* DESCRIPTION */}

              <div className="doubt-form-group">

                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  placeholder="Explain your doubt in detail..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  disabled={submitting}
                  required
                />

              </div>

              {/* ATTACHMENT */}

              <div className="doubt-form-group">
                <label htmlFor="attachment">
                  Attach Image
                </label>

                <input
                  key={fileInputKey}
                  id="attachment"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    setSelectedFile(
                      event.target.files?.[0] || null
                    );
                  }}
                  disabled={submitting}
                />

                {selectedFile && (
                  <div className="selected-file">
                    <span>{selectedFile.name}</span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFileInputKey(Date.now());
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* ACTIONS */}

              <div className="doubt-form-actions">

                <button
                  type="button"
                  className="cancel-doubt-button"
                  onClick={closeForm}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-doubt-button"
                  disabled={submitting}
                >

                  {submitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="doubts-spinner"
                      />

                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />

                      Submit Doubt
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ===============================================
          DOUBTS LIST
      =============================================== */}

      {doubts.length === 0 ? (

        <div className="no-doubts">

          <div className="no-doubts-icon">
            <CircleHelp size={42} />
          </div>

          <h3>
            No doubts yet
          </h3>

          <p>
            Have a question? Ask your teacher
            and get help here.
          </p>

          <button
            type="button"
            onClick={() => setShowForm(true)}
          >
            <Plus size={17} />

            Ask Your First Doubt
          </button>

        </div>

      ) : (

        <div className="doubts-list">

          {doubts.map((doubt) => {

            const statusConfig =
              getStatusConfig(
                doubt.status
              );

            return (
              <button
                type="button"
                className="doubt-card"
                key={doubt._id}
                onClick={() =>
                  navigate(
                    `/student/doubts/${doubt._id}`
                  )
                }
              >

                <div className="doubt-card-top">

                  <div className="doubt-topic">
                    {doubt.topic || "General"}
                  </div>

                  <div
                    className={`doubt-status ${statusConfig.className}`}
                  >
                    {statusConfig.icon}

                    {statusConfig.label}

                  </div>

                </div>

                <h3>
                  {doubt.title}
                </h3>

                <p>
                  {doubt.description}
                </p>

                <div className="doubt-card-footer">

                  <div className="assigned-teacher">

                    <MessageSquare size={16} />

                    <span>
                      {doubt.assignedTeacher?.name ||
                        doubt.teacher?.name ||
                        "Teacher"}
                    </span>

                  </div>

                  <span className="doubt-date">
                    {formatDate(
                      doubt.createdAt
                    )}
                  </span>

                </div>

              </button>
            );
          })}

        </div>

      )}

    </div>
  );
};

export default MyDoubts;