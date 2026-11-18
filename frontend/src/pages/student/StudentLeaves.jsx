
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  RefreshCw,
  MessageSquare,
  X,
  Send,
  Trash2,
} from "lucide-react";
import api from "../../services/api";
import "./StudentLeaves.css";

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusClass = (status) => {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    default:
      return "pending";
  }
};

const StudentLeaves = () => {
  const [leaves, setLeaves] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [proof, setProof] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [cancellingLeaveId, setCancellingLeaveId] = useState(null);
  const [leaveToCancel, setLeaveToCancel] = useState(null);

  const proofInputRef = useRef(null);

  const today = getTodayString();

  const fetchLeaves = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/leaves/my");

      setLeaves(
        Array.isArray(response.data?.leaves)
          ? response.data.leaves
          : []
      );
    } catch (err) {
      console.error("Student Leave History Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your leave requests."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleProofChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setProof(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG, WEBP, PDF, DOC and DOCX files are allowed."
      );

      event.target.value = "";
      setProof(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Supporting document must be smaller than 10 MB.");

      event.target.value = "";
      setProof(null);
      return;
    }

    setError("");
    setProof(file);
  };

  const removeProof = () => {
    setProof(null);

    if (proofInputRef.current) {
      proofInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setStartDate("");
    setEndDate("");
    setReason("");
    removeProof();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!startDate || !endDate) {
      setError("Please select both leave dates.");
      return;
    }

    if (startDate < today) {
      setError("Past dates cannot be selected.");
      return;
    }

    if (endDate < startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    if (!reason.trim()) {
      setError("Please enter the reason for your leave.");
      return;
    }

    if (reason.trim().length > 1000) {
      setError("Reason cannot exceed 1000 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("reason", reason.trim());

      if (proof) {
        formData.append("proof", proof);
      }

      await api.post("/leaves", formData);

      setSuccessMessage(
        "Your leave request has been submitted successfully."
      );

      resetForm();

      await fetchLeaves(true);
    } catch (err) {
      console.error("Submit Leave Request Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to submit your leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Open custom confirmation modal
  const handleCancelLeave = (leave) => {
    if (!leave?._id || leave.status !== "PENDING") return;
    if (cancellingLeaveId !== null) return;

    setLeaveToCancel(leave);
  };

  // Confirm and cancel pending leave
  const confirmCancelLeave = async () => {
    if (!leaveToCancel?._id || cancellingLeaveId !== null) return;

    try {
      setCancellingLeaveId(leaveToCancel._id);
      setError("");
      setSuccessMessage("");

      const response = await api.delete(
        `/leaves/${leaveToCancel._id}`
      );

      setLeaveToCancel(null);

      setSuccessMessage(
        response.data?.message ||
          "Leave request cancelled successfully."
      );

      await fetchLeaves(true);
    } catch (err) {
      console.error("Cancel Leave Request Error:", err);

      setLeaveToCancel(null);

      setError(
        err.response?.data?.message ||
          "Unable to cancel leave request."
      );
    } finally {
      setCancellingLeaveId(null);
    }
  };

  const pendingCount = leaves.filter(
    (leave) => leave.status === "PENDING"
  ).length;

  const approvedCount = leaves.filter(
    (leave) => leave.status === "APPROVED"
  ).length;

  const rejectedCount = leaves.filter(
    (leave) => leave.status === "REJECTED"
  ).length;

  return (
    <div className="student-leaves-page">
      <div className="student-leaves-header">
        <div>
          <div className="student-leaves-eyebrow">
            STUDENT PORTAL
          </div>

          <h1>Leave Management</h1>

          <p>
            Apply for leave and track the status of your applications.
          </p>
        </div>

        <button
          type="button"
          className="student-leaves-refresh"
          onClick={() => fetchLeaves(true)}
          disabled={refreshing || loading}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "is-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="student-leaves-alert success">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Close message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="student-leaves-alert error">
          <XCircle size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="student-leaves-stats">
        <div className="student-leaves-stat-card">
          <div className="student-leaves-stat-icon total">
            <FileText size={20} />
          </div>
          <div>
            <span>Total Requests</span>
            <strong>{leaves.length}</strong>
          </div>
        </div>

        <div className="student-leaves-stat-card">
          <div className="student-leaves-stat-icon pending">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>

        <div className="student-leaves-stat-card">
          <div className="student-leaves-stat-icon approved">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </div>
        </div>

        <div className="student-leaves-stat-card">
          <div className="student-leaves-stat-icon rejected">
            <XCircle size={20} />
          </div>
          <div>
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
          </div>
        </div>
      </div>

      <div className="student-leaves-content">
        <section className="student-leave-form-card">
          <div className="student-leave-section-heading">
            <div className="student-leave-heading-icon">
              <CalendarDays size={21} />
            </div>

            <div>
              <h2>Apply for Leave</h2>
              <p>Fill in the details below to submit your request.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="student-leave-date-grid">
              <div className="student-leave-field">
                <label htmlFor="studentLeaveStart">
                  From Date <span>*</span>
                </label>

                <input
                  id="studentLeaveStart"
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(event) => {
                    setStartDate(event.target.value);

                    if (
                      endDate &&
                      event.target.value > endDate
                    ) {
                      setEndDate("");
                    }
                  }}
                  required
                />
              </div>

              <div className="student-leave-field">
                <label htmlFor="studentLeaveEnd">
                  To Date <span>*</span>
                </label>

                <input
                  id="studentLeaveEnd"
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="student-leave-field">
              <label htmlFor="studentLeaveReason">
                Reason for Leave <span>*</span>
              </label>

              <textarea
                id="studentLeaveReason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                placeholder="Explain why you need leave..."
                maxLength={1000}
                rows={5}
                required
              />

              <div className="student-leave-character-count">
                {reason.length}/1000
              </div>
            </div>

            <div className="student-leave-field">
              <label htmlFor="studentLeaveProof">
                Supporting Document
                <span className="optional-label">Optional</span>
              </label>

              <div className="student-leave-upload-row">
                <input
                  ref={proofInputRef}
                  id="studentLeaveProof"
                  className="student-leave-file-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                  onChange={handleProofChange}
                />

                <label
                  htmlFor="studentLeaveProof"
                  className="student-leave-upload"
                >
                  <Upload size={20} />

                  <div>
                    <strong>
                      {proof ? proof.name : "Choose a document"}
                    </strong>

                    <span>
                      {proof
                        ? `${(proof.size / (1024 * 1024)).toFixed(2)} MB`
                        : "JPG, PNG, WEBP, PDF, DOC or DOCX • Max 10 MB"}
                    </span>
                  </div>
                </label>

                {proof && (
                  <button
                    type="button"
                    className="student-leave-remove-file"
                    onClick={removeProof}
                    aria-label="Remove document"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
            </div>

            <div className="student-leave-form-note">
              <Clock3 size={16} />
              Your application will remain pending until an
              administrator reviews it.
            </div>

            <button
              type="submit"
              className="student-leave-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw
                    size={17}
                    className="is-spinning"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Submit Leave Request
                </>
              )}
            </button>
          </form>
        </section>

        <section className="student-leave-history">
          <div className="student-leave-history-header">
            <div>
              <h2>My Leave Requests</h2>
              <p>Track your application history and decisions.</p>
            </div>

            <span className="student-leave-history-count">
              {leaves.length} Requests
            </span>
          </div>

          {loading ? (
            <div className="student-leave-history-state">
              <RefreshCw
                size={24}
                className="is-spinning"
              />
              <p>Loading your leave history...</p>
            </div>
          ) : leaves.length === 0 ? (
            <div className="student-leave-history-state">
              <div className="student-leave-empty-icon">
                <CalendarDays size={28} />
              </div>

              <h3>No leave applications yet</h3>

              <p>
                Your submitted leave requests will appear here.
              </p>
            </div>
          ) : (
            <div className="student-leave-history-list">
              {leaves.map((leave) => (
                <article
                  className="student-leave-history-card"
                  key={leave._id}
                >
                  <div className="student-leave-history-top">
                    <div>
                      <span className="student-leave-date-label">
                        LEAVE PERIOD
                      </span>

                      <h3>
                        {formatDate(leave.startDate)}
                        {" — "}
                        {formatDate(leave.endDate)}
                      </h3>
                    </div>

                    <span
                      className={`student-leave-status ${getStatusClass(
                        leave.status
                      )}`}
                    >
                      {leave.status || "PENDING"}
                    </span>
                  </div>

                  <div className="student-leave-history-reason">
                    <span>Reason</span>
                    <p>{leave.reason}</p>
                  </div>

                  {leave.attachment?.url && (
                    <a
                      href={leave.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="student-leave-history-attachment"
                    >
                      <FileText size={16} />
                      {leave.attachment.originalName ||
                        "View supporting document"}
                    </a>
                  )}

                  {leave.adminRemarks && (
                    <div className="student-leave-admin-remarks">
                      <MessageSquare size={17} />

                      <div>
                        <strong>Admin Remarks</strong>
                        <p>{leave.adminRemarks}</p>
                      </div>
                    </div>
                  )}

                  <div className="student-leave-submitted">
                    Submitted on {formatDate(leave.createdAt)}

                    {leave.reviewedAt && (
                      <>
                        {" • "}
                        Reviewed on {formatDate(leave.reviewedAt)}
                      </>
                    )}
                  </div>

                  {leave.status === "PENDING" && (
                    <div className="student-leave-card-actions">
                      <button
                        type="button"
                        className="student-leave-cancel-btn"
                        onClick={() => handleCancelLeave(leave)}
                        disabled={cancellingLeaveId === leave._id}
                      >
                        <Trash2 size={15} />

                        {cancellingLeaveId === leave._id
                          ? "Cancelling..."
                          : "Cancel Request"}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* CUSTOM LEAVE CANCEL CONFIRMATION MODAL */}
      {leaveToCancel && (
        <div
          className="leave-confirm-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              cancellingLeaveId === null
            ) {
              setLeaveToCancel(null);
            }
          }}
        >
          <div
            className="leave-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-confirm-title"
          >
            <div className="leave-confirm-icon">
              <Trash2 size={25} />
            </div>

            <h2 id="leave-confirm-title">
              Cancel Leave Request?
            </h2>

            <p>
              Are you sure you want to cancel this leave application?
              This action cannot be undone.
            </p>

            <div className="leave-confirm-details">
              <span>Leave Period</span>
              <strong>
                {formatDate(leaveToCancel.startDate)}
                {" — "}
                {formatDate(leaveToCancel.endDate)}
              </strong>
            </div>

            <div className="leave-confirm-actions">
              <button
                type="button"
                className="leave-confirm-back"
                onClick={() => setLeaveToCancel(null)}
                disabled={cancellingLeaveId !== null}
              >
                Keep Request
              </button>

              <button
                type="button"
                className="leave-confirm-delete"
                onClick={confirmCancelLeave}
                disabled={cancellingLeaveId !== null}
              >
                {cancellingLeaveId !== null
                  ? "Cancelling..."
                  : "Yes, Cancel Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLeaves;
