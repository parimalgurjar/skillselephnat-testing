
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  RefreshCw,
  FileText,
  ExternalLink,
  X,
  UserRound,
  MessageSquare,
} from "lucide-react";

import api from "../../services/api";
import "./AdminLeaves.css";

const FILTERS = [
  { label: "All Requests", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

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

const getStudentName = (student) => {
  if (!student) return "Unknown Student";

  return student.name || student.fullName || "Unknown Student";
};

const getBatchName = (batch) => {
  if (!batch) return "Batch not available";

  const timing =
    batch.batchTiming ||
    (batch.startTime && batch.endTime
      ? `${batch.startTime} - ${batch.endTime}`
      : "");

  return [batch.name, timing].filter(Boolean).join(" • ") || "Batch";
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

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchLeaves = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params =
        activeFilter === "ALL"
          ? {}
          : { status: activeFilter };

      const response = await api.get("/leaves", { params });

      setLeaves(
        Array.isArray(response.data?.leaves)
          ? response.data.leaves
          : []
      );
    } catch (err) {
      console.error("Admin Leave Requests Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load leave requests. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const filteredLeaves = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return leaves;

    return leaves.filter((leave) => {
      const student = getStudentName(leave.studentId);
      const email = leave.studentId?.email || "";
      const batch = getBatchName(leave.batchId);
      const reason = leave.reason || "";

      return (
        student.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        batch.toLowerCase().includes(query) ||
        reason.toLowerCase().includes(query)
      );
    });
  }, [leaves, search]);

  const counts = useMemo(() => {
    return {
      total: leaves.length,
      pending: leaves.filter(
        (leave) => leave.status === "PENDING"
      ).length,
      approved: leaves.filter(
        (leave) => leave.status === "APPROVED"
      ).length,
      rejected: leaves.filter(
        (leave) => leave.status === "REJECTED"
      ).length,
    };
  }, [leaves]);

  const openReview = (leave, status) => {
    setSelectedLeave(leave);
    setReviewStatus(status);
    setAdminRemarks(leave.adminRemarks || "");
    setSuccessMessage("");
  };

  const closeReview = () => {
    if (saving) return;

    setSelectedLeave(null);
    setReviewStatus("");
    setAdminRemarks("");
  };

  const submitReview = async (event) => {
    event.preventDefault();

    if (!selectedLeave?._id || !reviewStatus) return;

    if (adminRemarks.trim().length > 1000) {
      setError("Remarks cannot exceed 1000 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.patch(
        `/leaves/${selectedLeave._id}/review`,
        {
          status: reviewStatus,
          adminRemarks: adminRemarks.trim(),
        }
      );

      setSelectedLeave(null);
      setReviewStatus("");
      setAdminRemarks("");

      setSuccessMessage(
        reviewStatus === "APPROVED"
          ? "Leave request approved successfully."
          : "Leave request rejected successfully."
      );

      await fetchLeaves(true);
    } catch (err) {
      console.error("Leave Review Error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update this leave request."
      );
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = leaves.filter(
    (leave) => leave.status === "PENDING"
  ).length;

  return (
    <div className="admin-leaves-page">
      <div className="admin-leaves-header">
        <div>
          <div className="admin-leaves-eyebrow">
            STUDENT MANAGEMENT
          </div>

          <h1>Leave Requests</h1>

          <p>
            Review student leave applications and manage
            approval decisions.
          </p>
        </div>

        <button
          type="button"
          className="admin-leaves-refresh"
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
        <div className="admin-leaves-alert success">
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
        <div className="admin-leaves-alert error">
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

      <div className="admin-leaves-stats">
        <div className="admin-leaves-stat-card">
          <div className="admin-leaves-stat-icon total">
            <FileText size={20} />
          </div>
          <div>
            <span>Total Requests</span>
            <strong>{counts.total}</strong>
          </div>
        </div>

        <div className="admin-leaves-stat-card">
          <div className="admin-leaves-stat-icon pending">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{counts.pending}</strong>
          </div>
        </div>

        <div className="admin-leaves-stat-card">
          <div className="admin-leaves-stat-icon approved">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Approved</span>
            <strong>{counts.approved}</strong>
          </div>
        </div>

        <div className="admin-leaves-stat-card">
          <div className="admin-leaves-stat-icon rejected">
            <XCircle size={20} />
          </div>
          <div>
            <span>Rejected</span>
            <strong>{counts.rejected}</strong>
          </div>
        </div>
      </div>

      <div className="admin-leaves-toolbar">
        <div className="admin-leaves-tabs">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={
                activeFilter === filter.value ? "active" : ""
              }
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
              {filter.value === "PENDING" && pendingCount > 0 && (
                <span className="admin-leaves-tab-count">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="admin-leaves-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search student, batch or reason..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="admin-leaves-list">
        {loading ? (
          <div className="admin-leaves-loading">
            <RefreshCw size={24} className="is-spinning" />
            <p>Loading leave requests...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="admin-leaves-empty">
            <div className="admin-leaves-empty-icon">
              <CalendarDays size={30} />
            </div>

            <h3>No leave requests found</h3>

            <p>
              {search
                ? "Try changing your search."
                : "Student leave applications will appear here."}
            </p>
          </div>
        ) : (
          filteredLeaves.map((leave) => {
            const student = leave.studentId || {};
            const attachment = leave.attachment || {};

            return (
              <article
                className="admin-leave-card"
                key={leave._id}
              >
                <div className="admin-leave-card-top">
                  <div className="admin-leave-student">
                    <div className="admin-leave-avatar">
                      <UserRound size={21} />
                    </div>

                    <div>
                      <h3>{getStudentName(student)}</h3>
                      <p>{student.email || "Email unavailable"}</p>
                    </div>
                  </div>

                  <span
                    className={`admin-leave-status ${getStatusClass(
                      leave.status
                    )}`}
                  >
                    {leave.status || "PENDING"}
                  </span>
                </div>

                <div className="admin-leave-details">
                  <div>
                    <span>Batch</span>
                    <strong>{getBatchName(leave.batchId)}</strong>
                  </div>

                  <div>
                    <span>Leave period</span>
                    <strong>
                      {formatDate(leave.startDate)}
                      {" — "}
                      {formatDate(leave.endDate)}
                    </strong>
                  </div>

                  <div>
                    <span>Submitted</span>
                    <strong>{formatDate(leave.createdAt)}</strong>
                  </div>
                </div>

                <div className="admin-leave-reason">
                  <span>Reason for leave</span>
                  <p>{leave.reason || "No reason provided."}</p>
                </div>

                {attachment.url && (
                  <a
                    className="admin-leave-attachment"
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText size={17} />
                    <span>
                      {attachment.originalName ||
                        "View supporting document"}
                    </span>
                    <ExternalLink size={15} />
                  </a>
                )}

                {leave.adminRemarks && (
                  <div className="admin-leave-remarks">
                    <MessageSquare size={16} />
                    <div>
                      <strong>Admin remarks</strong>
                      <p>{leave.adminRemarks}</p>
                    </div>
                  </div>
                )}

                {leave.status === "PENDING" ? (
                  <div className="admin-leave-actions">
                    <button
                      type="button"
                      className="admin-leave-reject-btn"
                      onClick={() =>
                        openReview(leave, "REJECTED")
                      }
                    >
                      <XCircle size={17} />
                      Reject
                    </button>

                    <button
                      type="button"
                      className="admin-leave-approve-btn"
                      onClick={() =>
                        openReview(leave, "APPROVED")
                      }
                    >
                      <CheckCircle2 size={17} />
                      Approve Leave
                    </button>
                  </div>
                ) : (
                  <div className="admin-leave-reviewed">
                    {leave.reviewedBy?.name
                      ? `Reviewed by ${leave.reviewedBy.name}`
                      : "Request reviewed"}
                    {leave.reviewedAt
                      ? ` • ${formatDate(leave.reviewedAt)}`
                      : ""}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {selectedLeave && (
        <div
          className="admin-leave-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReview();
            }
          }}
        >
          <form
            className="admin-leave-review-modal"
            onSubmit={submitReview}
          >
            <div className="admin-leave-modal-header">
              <div>
                <span>LEAVE REQUEST REVIEW</span>
                <h2>
                  {reviewStatus === "APPROVED"
                    ? "Approve Leave"
                    : "Reject Leave"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeReview}
                disabled={saving}
                aria-label="Close review"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-leave-modal-summary">
              <strong>
                {getStudentName(selectedLeave.studentId)}
              </strong>
              <span>
                {formatDate(selectedLeave.startDate)}
                {" — "}
                {formatDate(selectedLeave.endDate)}
              </span>
            </div>

            <label htmlFor="adminLeaveRemarks">
              Admin remarks
              <span>Optional</span>
            </label>

            <textarea
              id="adminLeaveRemarks"
              value={adminRemarks}
              onChange={(event) =>
                setAdminRemarks(event.target.value)
              }
              placeholder="Write remarks for the student..."
              maxLength={1000}
              rows={4}
            />

            <div className="admin-leave-character-count">
              {adminRemarks.length}/1000
            </div>

            {reviewStatus === "APPROVED" && (
              <div className="admin-leave-approval-note">
                <CheckCircle2 size={17} />
                Applicable class dates will automatically be
                marked as LEAVE in attendance.
              </div>
            )}

            <div className="admin-leave-modal-actions">
              <button
                type="button"
                className="admin-leave-cancel-btn"
                onClick={closeReview}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={
                  reviewStatus === "APPROVED"
                    ? "admin-leave-approve-btn"
                    : "admin-leave-reject-btn"
                }
                disabled={saving}
              >
                {saving
                  ? "Please wait..."
                  : reviewStatus === "APPROVED"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminLeaves;
