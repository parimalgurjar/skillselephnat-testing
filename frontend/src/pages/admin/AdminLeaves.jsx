
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
  Trash2,
  UserRound,
  MessageSquare,
  ChevronDown,
} from "lucide-react";

import api from "../../services/api";
import "./AdminLeaves.css";
import { getBatchLabel } from "../../utils/batchUtils";
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

// Convert dates into YYYY-MM-DD without UTC date shifting.
const getDateKey = (value) => {
  if (!value) return "";

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
  ) {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getStudentName = (student) => {
  if (!student) return "Unknown Student";

  if (typeof student === "string") {
    return "Unknown Student";
  }

  return (
    student.name ||
    student.fullName ||
    "Unknown Student"
  );
};

const getBatchName = (batch) => {
  if (!batch) return "Batch not available";

  if (typeof batch === "string") {
    return "Batch not available";
  }

  return getBatchLabel(batch);
};

const getBatchId = (batch) => {
  if (!batch) return "";

  if (typeof batch === "string") {
    return batch;
  }

  return String(batch._id || "");
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

  // Filters
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
const [batches, setBatches] = useState([]);
const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  // Loading and messages
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
const [confirmDeleteLeave, setConfirmDeleteLeave] = useState(null);
  // Review modal
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");

  // Action loading
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch all requests.
  // Filters are applied locally so multiple filters work together.
  const fetchLeaves = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/leaves");

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
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);
  // Fetch all batches independently of leave requests
useEffect(() => {
  const fetchBatches = async () => {
    try {
      const response = await api.get("/batches");

      setBatches(
        Array.isArray(response.data?.batches)
          ? response.data.batches
          : []
      );
    } catch (error) {
      console.error("Fetch Batches Error:", error);
      setBatches([]);
    }
  };

  fetchBatches();
}, []);

 

  // Combined filtering: status + batch + date + search.
  const filteredLeaves = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leaves.filter((leave) => {
      // Status filter
      if (
        activeFilter !== "ALL" &&
        leave.status !== activeFilter
      ) {
        return false;
      }

      // Batch filter
      if (batchFilter !== "ALL") {
        const currentBatchId = getBatchId(leave.batchId);

        if (currentBatchId !== batchFilter) {
          return false;
        }
      }

      // Search student name, email, batch and reason
      if (query) {
        const student = getStudentName(leave.studentId);
        const email = leave.studentId?.email || "";
        const batch = getBatchName(leave.batchId);
        const reason = leave.reason || "";

        const matchesSearch = [
          student,
          email,
          batch,
          reason,
        ].some((value) =>
          String(value).toLowerCase().includes(query)
        );

        if (!matchesSearch) {
          return false;
        }
      }

      // Date filter:
      // Show requests whose leave period contains selected date.
      if (dateFilter) {
        const startDate = getDateKey(leave.startDate);
        const endDate = getDateKey(leave.endDate);

        if (
          !startDate ||
          !endDate ||
          dateFilter < startDate ||
          dateFilter > endDate
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    leaves,
    activeFilter,
    batchFilter,
    dateFilter,
    search,
  ]);

  // Summary counts
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

  const pendingCount = counts.pending;

  // Review modal
  const openReview = (leave, status) => {
    setSelectedLeave(leave);
    setReviewStatus(status);
    setAdminRemarks(leave.adminRemarks || "");
    setSuccessMessage("");
    setError("");
  };

  const closeReview = () => {
    if (saving) return;

    setSelectedLeave(null);
    setReviewStatus("");
    setAdminRemarks("");
  };

  // Approve / Reject request
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
      setSuccessMessage("");

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

  // Delete individual leave request.
const handleDeleteLeave = async () => {
  if (!confirmDeleteLeave?._id || saving || deletingId) return;

  const leave = confirmDeleteLeave;

  try {
    setDeletingId(leave._id);
    setError("");
    setSuccessMessage("");

    await api.delete(`/leaves/admin/${leave._id}`);

    setConfirmDeleteLeave(null);

    setLeaves((previous) =>
      previous.filter((item) => item._id !== leave._id)
    );

    setSuccessMessage("Leave request deleted successfully.");

    await fetchLeaves(true);
  } catch (err) {
    console.error("Delete Leave Request Error:", err);

    setError(
      err.response?.data?.message ||
        "Unable to delete this leave request."
    );
  } finally {
    setDeletingId(null);
  }
};

  const clearFilters = () => {
    setActiveFilter("ALL");
    setBatchFilter("ALL");
    setDateFilter("");
    setSearch("");
  };

  const hasActiveFilters =
    activeFilter !== "ALL" ||
    batchFilter !== "ALL" ||
    Boolean(dateFilter) ||
    Boolean(search);

  return (
    <div className="admin-leaves-page">
      {/* HEADER */}
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

      {/* SUCCESS MESSAGE */}
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

      {/* ERROR MESSAGE */}
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

      {/* STATISTICS */}
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

      {/* FILTER TOOLBAR */}
      <div className="admin-leaves-toolbar">
        {/* STATUS TABS */}
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

              {filter.value === "PENDING" &&
                pendingCount > 0 && (
                  <span className="admin-leaves-tab-count">
                    {pendingCount}
                  </span>
                )}
            </button>
          ))}
        </div>

        {/* ADVANCED FILTERS */}
        <div className="admin-leaves-filters">
          {/* BATCH FILTER */}
         <div className="admin-leaves-batch-select">
  <button
    type="button"
    className={`admin-leaves-batch-trigger ${
      batchDropdownOpen ? "active" : ""
    }`}
    onClick={() => setBatchDropdownOpen((prev) => !prev)}
  >
    <span>
      <strong>
        {batchFilter === "ALL"
          ? "All Batches"
          : getBatchName(
              batches.find(
                (batch) => String(batch._id) === batchFilter
              )
            )}
      </strong>

      <small>
        {batchFilter === "ALL"
          ? `${batches.length} batches available`
          : "Selected batch"}
      </small>
    </span>

    <ChevronDown
      size={18}
      className={batchDropdownOpen ? "rotated" : ""}
    />
  </button>

  {batchDropdownOpen && (
    <>
      <div
        className="admin-leaves-batch-backdrop"
        onClick={() => setBatchDropdownOpen(false)}
      />

      <div className="admin-leaves-batch-menu">
        <button
          type="button"
          className={`admin-leaves-batch-option ${
            batchFilter === "ALL" ? "selected" : ""
          }`}
          onClick={() => {
            setBatchFilter("ALL");
            setBatchDropdownOpen(false);
          }}
        >
          <span className="admin-leaves-batch-option-icon">
            A
          </span>

          <span className="admin-leaves-batch-option-text">
            <strong>All Batches</strong>
            <small>Show all leave requests</small>
          </span>

          {batchFilter === "ALL" && <CheckCircle2 size={17} />}
        </button>

        {batches.map((batch) => {
          const selected =
            batchFilter === String(batch._id);

          return (
            <button
              key={batch._id}
              type="button"
              className={`admin-leaves-batch-option ${
                selected ? "selected" : ""
              }`}
              onClick={() => {
                setBatchFilter(String(batch._id));
                setBatchDropdownOpen(false);
              }}
            >
              <span className="admin-leaves-batch-option-icon">
                <CalendarDays size={17} />
              </span>

             <span className="admin-leaves-batch-option-text">
  <strong>{getBatchLabel(batch)}</strong>
</span>

              {selected && <CheckCircle2 size={17} />}
            </button>
          );
        })}

        {batches.length === 0 && (
          <p className="admin-leaves-no-batches">
            No batches available
          </p>
        )}
      </div>
    </>
  )}
</div>

          {/* DATE FILTER */}
          <div className="admin-leaves-filter-field admin-leaves-date-field">
            <CalendarDays size={16} />

            <input
              type="date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value)
              }
              className="admin-leaves-filter-date"
              aria-label="Filter by leave date"
              title="Show requests active on this leave date"
            />
          </div>

          {/* SEARCH */}
          <div className="admin-leaves-search">
            <Search size={17} />

            <input
              type="search"
              placeholder="Search name, email or reason..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          {/* CLEAR FILTERS */}
          {hasActiveFilters && (
            <button
              type="button"
              className="admin-leaves-clear-filters"
              onClick={clearFilters}
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* RESULTS COUNT */}
      {!loading && (
        <div className="admin-leaves-results-count">
          Showing {filteredLeaves.length} of {leaves.length} requests
        </div>
      )}

      {/* LEAVE REQUEST LIST */}
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
              {hasActiveFilters
                ? "Try changing your filters or search."
                : "Student leave applications will appear here."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                className="admin-leaves-clear-filters"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredLeaves.map((leave) => {
            const student = leave.studentId || {};
            const attachment = leave.attachment || {};
            const isDeleting = deletingId === leave._id;

            return (
              <article
                className="admin-leave-card"
                key={leave._id}
              >
                {/* CARD HEADER */}
                <div className="admin-leave-card-top">
                  <div className="admin-leave-student">
                    <div className="admin-leave-avatar">
                      <UserRound size={21} />
                    </div>

                    <div>
                      <h3>{getStudentName(student)}</h3>

                      <p>
                        {student.email || "Email unavailable"}
                      </p>
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

                {/* DETAILS */}
                <div className="admin-leave-details">
                  <div>
                    <span>Batch</span>

                    <strong>
                      {getBatchName(leave.batchId)}
                    </strong>
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

                    <strong>
                      {formatDate(leave.createdAt)}
                    </strong>
                  </div>
                </div>

                {/* REASON */}
                <div className="admin-leave-reason">
                  <span>Reason for leave</span>
                  <p>{leave.reason || "No reason provided."}</p>
                </div>

                {/* ATTACHMENT */}
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

                {/* ADMIN REMARKS */}
                {leave.adminRemarks && (
                  <div className="admin-leave-remarks">
                    <MessageSquare size={16} />

                    <div>
                      <strong>Admin remarks</strong>
                      <p>{leave.adminRemarks}</p>
                    </div>
                  </div>
                )}

                {/* REVIEW ACTIONS */}
                {leave.status === "PENDING" ? (
                  <div className="admin-leave-actions">
                    <button
                      type="button"
                      className="admin-leave-reject-btn"
                      onClick={() =>
                        openReview(leave, "REJECTED")
                      }
                      disabled={saving || Boolean(deletingId)}
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
                      disabled={saving || Boolean(deletingId)}
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

                {/* DELETE REQUEST */}
                <div className="admin-leave-delete-row">
                  <button
                    type="button"
                    className="admin-leave-delete-btn"
                    onClick={() => setConfirmDeleteLeave(leave)}
                    disabled={
                      saving ||
                      Boolean(deletingId)
                    }
                  >
                    {isDeleting ? (
                      <RefreshCw
                        size={16}
                        className="is-spinning"
                      />
                    ) : (
                      <Trash2 size={16} />
                    )}

                    {isDeleting
                      ? "Deleting..."
                      : "Delete Request"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
{confirmDeleteLeave && (
  <div
    className="admin-delete-modal-overlay"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget && !deletingId) {
        setConfirmDeleteLeave(null);
      }
    }}
  >
    <div className="admin-delete-modal">
      <div className="admin-delete-modal-icon">
        <Trash2 size={25} />
      </div>

      <h2>Delete Leave Request?</h2>

      <p>
        Are you sure you want to delete the leave request
        of <strong>{getStudentName(confirmDeleteLeave.studentId)}</strong>?
      </p>

      <div className="admin-delete-modal-warning">
        <XCircle size={17} />
        <span>
          This request and its related notifications will be deleted.
          Existing attendance history will remain unchanged.
        </span>
      </div>

      <div className="admin-delete-modal-actions">
        <button
          type="button"
          className="admin-delete-cancel"
          onClick={() => setConfirmDeleteLeave(null)}
          disabled={Boolean(deletingId)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="admin-delete-confirm"
          onClick={handleDeleteLeave}
          disabled={Boolean(deletingId)}
        >
          {deletingId ? (
            <>
              <RefreshCw size={16} className="is-spinning" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 size={16} />
              Delete Request
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
      {/* REVIEW MODAL */}
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
