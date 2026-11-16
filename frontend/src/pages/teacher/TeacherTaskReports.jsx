
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  Clock3,
  Users,
  Loader2,
  ChevronRight,
  ArrowLeft,
  XCircle,
  AlertTriangle,
  Link2,
  ExternalLink,
} from "lucide-react";

import { formatBatchTimingString } from "../../utils/batchUtils";
import api from "../../services/api";
import "./TeacherTaskReports.css";

const TeacherTaskReport = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Student-list filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("ALL");
  const [activeSummaryFilter, setActiveSummaryFilter] = useState("ALL");

  // Student detail
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeDetailFilter, setActiveDetailFilter] = useState("ALL");

  // Review
  const [reviewingId, setReviewingId] = useState(null);
  const [rejectingProgress, setRejectingProgress] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewError, setReviewError] = useState("");

  /* BATCH HELPERS */

  const getBatchLabel = (student) => {
    if (!student) return "No Batch";

    if (student.batch?.name) return student.batch.name;
    if (student.batch?.code) return student.batch.code;

    if (student.batch?.batchTiming) {
      return formatBatchTimingString(student.batch.batchTiming);
    }

    if (student.batchTiming) {
      return formatBatchTimingString(student.batchTiming);
    }

    if (student.batchName) return student.batchName;

    return "No Batch";
  };

  const getBatchId = (student) => {
    if (!student) return "";

    if (student.batch?._id) {
      return String(student.batch._id);
    }

    if (student.batchId) {
      if (typeof student.batchId === "object") {
        return String(student.batchId._id || "");
      }

      return String(student.batchId);
    }

    return "";
  };

  /* FETCH STUDENTS */

  const fetchStudentsReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/task-report/teacher/students");

      if (response.data?.success) {
        setStudents(response.data.students || []);
      } else {
        setError(
          response.data?.message || "Unable to load student reports"
        );
      }
    } catch (error) {
      console.error("Fetch Teacher Task Reports Error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load student reports"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsReport();
  }, []);

  /* OPEN STUDENT REPORT */

  const handleViewStudentReport = async (student) => {
    try {
      setActiveDetailFilter("ALL");
      setSelectedStudent(student);
      setStudentReport(null);
      setReportLoading(true);
      setReviewError("");

      const response = await api.get(
        `/task-report/students/${student._id}`
      );

      if (response.data?.success) {
        setStudentReport(response.data);
      } else {
        setReviewError(
          response.data?.message || "Unable to load student report"
        );
      }
    } catch (error) {
      console.error("Fetch Student Detail Report Error:", error);

      setReviewError(
        error.response?.data?.message ||
          "Unable to load student report"
      );
    } finally {
      setReportLoading(false);
    }
  };

  /* BACK TO STUDENTS */

  const handleBackToStudents = () => {
    setSelectedStudent(null);
    setStudentReport(null);
    setRejectingProgress(null);
    setRejectionReason("");
    setReviewError("");
    setActiveDetailFilter("ALL");
  };

  /* APPROVE TASK */

  const handleApproveTask = async (progressId) => {
    try {
      setReviewingId(progressId);
      setReviewError("");

      const response = await api.put(
        `/task-report/progress/${progressId}/review`,
        { status: "COMPLETED" }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to approve task"
        );
      }

      if (selectedStudent) {
        await handleViewStudentReport(selectedStudent);
      }

      await fetchStudentsReport();
    } catch (error) {
      console.error("Approve Task Error:", error);

      setReviewError(
        error.response?.data?.message ||
          error.message ||
          "Unable to approve task"
      );
    } finally {
      setReviewingId(null);
    }
  };

  /* REJECT TASK */

  const handleOpenReject = (progressId) => {
    setRejectingProgress(progressId);
    setRejectionReason("");
    setReviewError("");
  };

  const handleCancelReject = () => {
    if (reviewingId) return;

    setRejectingProgress(null);
    setRejectionReason("");
  };

  const handleRejectTask = async () => {
    if (!rejectingProgress) return;

    if (!rejectionReason.trim()) {
      setReviewError("Please provide a rejection reason");
      return;
    }

    try {
      setReviewingId(rejectingProgress);
      setReviewError("");

      const response = await api.put(
        `/task-report/progress/${rejectingProgress}/review`,
        {
          status: "REJECTED",
          rejectionReason: rejectionReason.trim(),
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to reject task"
        );
      }

      setRejectingProgress(null);
      setRejectionReason("");

      if (selectedStudent) {
        await handleViewStudentReport(selectedStudent);
      }

      await fetchStudentsReport();
    } catch (error) {
      console.error("Reject Task Error:", error);

      setReviewError(
        error.response?.data?.message ||
          error.message ||
          "Unable to reject task"
      );
    } finally {
      setReviewingId(null);
    }
  };

  /* STATUS CONFIG */

  const getStatusConfig = (status) => {
    switch (status) {
      case "COMPLETED":
        return {
          label: "Completed",
          className: "completed",
          icon: <CheckCircle2 size={15} />,
        };

      case "PENDING":
        return {
          label: "Pending Review",
          className: "pending",
          icon: <Clock3 size={15} />,
        };

      case "REJECTED":
        return {
          label: "Rejected",
          className: "rejected",
          icon: <XCircle size={15} />,
        };

      default:
        return {
          label: "Not Started",
          className: "not-started",
          icon: <AlertTriangle size={15} />,
        };
    }
  };

  /* STUDENT DETAIL TASK FILTER */

  const filteredStudentCategories = useMemo(() => {
    if (!studentReport?.categories) return [];

    return studentReport.categories
      .map((category) => ({
        ...category,
        tasks: (category.tasks || []).filter((task) => {
          if (activeDetailFilter === "ALL") return true;
          return task.status === activeDetailFilter;
        }),
      }))
      .filter((category) => category.tasks.length > 0);
  }, [studentReport, activeDetailFilter]);

  /* BATCH LIST */

  const batches = useMemo(() => {
    const batchMap = new Map();

    students.forEach((student) => {
      const batchId = getBatchId(student);

      if (!batchId) return;

      if (!batchMap.has(batchId)) {
        batchMap.set(batchId, {
          _id: batchId,
          label: getBatchLabel(student),
        });
      }
    });

    return Array.from(batchMap.values());
  }, [students]);

  /* SEARCH + BATCH FILTER */

  const batchSearchFilteredStudents = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return students.filter((student) => {
      const studentName = student.name?.toLowerCase() || "";
      const studentEmail = student.email?.toLowerCase() || "";

      const matchesSearch =
        studentName.includes(search) ||
        studentEmail.includes(search);

      const studentBatchId = getBatchId(student);

      const matchesBatch =
        selectedBatchId === "ALL" ||
        studentBatchId === selectedBatchId;

      return matchesSearch && matchesBatch;
    });
  }, [students, searchTerm, selectedBatchId]);

  /* SUMMARY FILTER */

  const filteredStudents = useMemo(() => {
    if (activeSummaryFilter === "COMPLETED") {
      return batchSearchFilteredStudents.filter(
        (student) => Number(student.stats?.completed || 0) > 0
      );
    }

    if (activeSummaryFilter === "PENDING") {
      return batchSearchFilteredStudents.filter(
        (student) => Number(student.stats?.pending || 0) > 0
      );
    }

    return batchSearchFilteredStudents;
  }, [batchSearchFilteredStudents, activeSummaryFilter]);

  /* SUMMARY COUNTS */

  const totalStudents = batchSearchFilteredStudents.length;

  const totalCompleted = batchSearchFilteredStudents.filter(
    (student) => Number(student.stats?.completed || 0) > 0
  ).length;

  const totalPending = batchSearchFilteredStudents.filter(
    (student) => Number(student.stats?.pending || 0) > 0
  ).length;

  /* LOADING */

  if (loading && !selectedStudent) {
    return (
      <div className="teacher-task-report-page">
        <div className="task-report-loading">
          <Loader2 size={32} className="task-report-spinner" />
          <p>Loading student task reports...</p>
        </div>
      </div>
    );
  }

  /* STUDENT DETAIL VIEW */

  if (selectedStudent) {
    return (
      <div className="teacher-task-report-page">
        <button
          type="button"
          className="back-to-students-btn"
          onClick={handleBackToStudents}
          disabled={reviewingId !== null}
        >
          <ArrowLeft size={18} />
          Back to Students
        </button>

        {reportLoading && (
          <div className="task-report-loading">
            <Loader2 size={32} className="task-report-spinner" />
            <p>Loading student report...</p>
          </div>
        )}

        {reviewError && !reportLoading && (
          <div className="teacher-report-error">
            {reviewError}
          </div>
        )}

        {!reportLoading && studentReport && (
          <>
            {/* STUDENT HEADER */}

            <div className="student-detail-header">
              <div className="student-detail-profile">
                <div className="student-detail-avatar">
                  {studentReport.student?.name
                    ?.charAt(0)
                    ?.toUpperCase() || "S"}
                </div>

                <div>
                  <span>STUDENT TASK REPORT</span>
                  <h1>{studentReport.student?.name}</h1>
                  <p>{studentReport.student?.email}</p>
                </div>
              </div>

              <div className="student-detail-score">
                <span>Overall Score</span>
                <strong>
                  {studentReport.stats?.score || 0}%
                </strong>
              </div>
            </div>

            {/* CLICKABLE STATS */}

            <div className="student-detail-stats-grid">
              <button
                type="button"
                className={`student-detail-stat total-stat ${
                  activeDetailFilter === "ALL" ? "selected" : ""
                }`}
                onClick={() => setActiveDetailFilter("ALL")}
                aria-pressed={activeDetailFilter === "ALL"}
              >
                <span>Total Tasks</span>
                <strong>
                  {studentReport.stats?.totalTasks || 0}
                </strong>
              </button>

              <button
                type="button"
                className={`student-detail-stat completed-stat ${
                  activeDetailFilter === "COMPLETED" ? "selected" : ""
                }`}
                onClick={() => setActiveDetailFilter("COMPLETED")}
                aria-pressed={activeDetailFilter === "COMPLETED"}
              >
                <span>Completed</span>
                <strong>
                  {studentReport.stats?.completedTasks || 0}
                </strong>
              </button>

              <button
                type="button"
                className={`student-detail-stat pending-stat ${
                  activeDetailFilter === "PENDING" ? "selected" : ""
                }`}
                onClick={() => setActiveDetailFilter("PENDING")}
                aria-pressed={activeDetailFilter === "PENDING"}
              >
                <span>Pending Review</span>
                <strong>
                  {studentReport.stats?.pendingTasks || 0}
                </strong>
              </button>

              <button
                type="button"
                className={`student-detail-stat rejected-stat ${
                  activeDetailFilter === "REJECTED" ? "selected" : ""
                }`}
                onClick={() => setActiveDetailFilter("REJECTED")}
                aria-pressed={activeDetailFilter === "REJECTED"}
              >
                <span>Rejected</span>
                <strong>
                  {studentReport.stats?.rejectedTasks || 0}
                </strong>
              </button>
            </div>

            {/* FILTERED CATEGORIES */}

            <div className="student-report-categories">
              {filteredStudentCategories.length === 0 && (
                <div className="teacher-report-empty">
                  <ClipboardCheck size={35} />
                  <h3>
                    {activeDetailFilter === "ALL"
                      ? "No tasks found"
                      : `No ${activeDetailFilter
                          .toLowerCase()
                          .replace("_", " ")} tasks`}
                  </h3>
                  <p>
                    No tasks are available for this filter.
                  </p>
                </div>
              )}

              {filteredStudentCategories.map((category) => (
                <div
                  className="student-report-category"
                  key={category._id}
                >
                  <div className="student-report-category-header">
                    <div>
                      <h2>{category.name}</h2>

                      {category.description && (
                        <p>{category.description}</p>
                      )}
                    </div>

                    <span>{category.tasks.length} Tasks</span>
                  </div>

                  <div className="student-report-task-list">
                    {category.tasks.map((task) => {
                      const statusConfig = getStatusConfig(task.status);
                      const isReviewing =
                        reviewingId === task.progressId;

                      return (
                        <div
                          className="student-report-task-card"
                          key={task._id}
                        >
                          <div className="student-report-task-info">
                            <h3>{task.title}</h3>

                            {task.description && (
                              <p>{task.description}</p>
                            )}

                            {(task.submissionLink ||
                              task.submissionImages?.length > 0) && (
                              <div className="teacher-submitted-work">
                                <strong>Student Submission</strong>

                                {task.submissionLink && (
                                  <a
                                    className="teacher-submitted-link"
                                    href={task.submissionLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Link2 size={15} />
                                    Open Project / Website
                                    <ExternalLink size={14} />
                                  </a>
                                )}

                                {task.submissionImages?.length > 0 && (
                                  <div className="teacher-submitted-images">
                                    {task.submissionImages.map(
                                      (image, index) => (
                                        <a
                                          key={
                                            image.publicId ||
                                            image.url ||
                                            index
                                          }
                                          href={image.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <img
                                            src={image.url}
                                            alt={`Student submission ${index + 1}`}
                                            loading="lazy"
                                          />
                                        </a>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {task.rejectionReason && (
                              <div className="task-rejection-reason">
                                <strong>Rejection Reason:</strong>
                                {task.rejectionReason}
                              </div>
                            )}
                          </div>

                          <div className="student-report-task-action">
                            <span
                              className={`teacher-task-status ${statusConfig.className}`}
                            >
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>

                            {task.status === "PENDING" &&
                              task.progressId && (
                                <div className="teacher-review-actions">
                                  <button
                                    type="button"
                                    className="approve-task-btn"
                                    disabled={isReviewing}
                                    onClick={() =>
                                      handleApproveTask(task.progressId)
                                    }
                                  >
                                    {isReviewing ? (
                                      <Loader2
                                        size={15}
                                        className="task-spinner"
                                      />
                                    ) : (
                                      <CheckCircle2 size={15} />
                                    )}
                                    Approve
                                  </button>

                                  <button
                                    type="button"
                                    className="reject-task-btn"
                                    disabled={isReviewing}
                                    onClick={() =>
                                      handleOpenReject(task.progressId)
                                    }
                                  >
                                    <XCircle size={15} />
                                    Reject
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* REJECT MODAL */}

        {rejectingProgress && (
          <div className="teacher-reject-modal-overlay">
            <div className="teacher-reject-modal">
              <div className="teacher-reject-modal-header">
                <div className="reject-modal-icon">
                  <XCircle size={22} />
                </div>

                <div>
                  <h2>Reject Task</h2>
                  <p>
                    Please provide a reason for rejecting this task.
                  </p>
                </div>
              </div>

              <div className="teacher-reject-form">
                <label>Rejection Reason</label>

                <textarea
                  rows="4"
                  placeholder="Explain what the student needs to improve..."
                  value={rejectionReason}
                  disabled={reviewingId !== null}
                  onChange={(event) =>
                    setRejectionReason(event.target.value)
                  }
                />
              </div>

              <div className="teacher-reject-modal-actions">
                <button
                  type="button"
                  className="cancel-reject-btn"
                  onClick={handleCancelReject}
                  disabled={reviewingId !== null}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="confirm-reject-btn"
                  onClick={handleRejectTask}
                  disabled={reviewingId !== null}
                >
                  {reviewingId ? (
                    <>
                      <Loader2
                        size={16}
                        className="task-spinner"
                      />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Confirm Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* STUDENT LIST VIEW */

  return (
    <div className="teacher-task-report-page">
      {/* HEADER */}

      <div className="teacher-task-report-header">
        <div>
          <span className="teacher-report-label">
            EDUCATOR PORTAL
          </span>

          <h1>Student Task Reports</h1>
          <p>Track student progress and review submitted tasks.</p>
        </div>

        <div className="teacher-report-filters">
          <div className="teacher-search-box">
            <input
              type="text"
              placeholder="Search student by name or email..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <div className="teacher-batch-filter">
            <select
              value={selectedBatchId}
              onChange={(event) =>
                setSelectedBatchId(event.target.value)
              }
            >
              <option value="ALL">All Batches</option>

              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="teacher-report-header-icon">
          <ClipboardCheck size={28} />
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="teacher-report-error">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="teacher-report-summary-grid">
        <button
          type="button"
          className={`teacher-report-summary-card summary-blue ${
            activeSummaryFilter === "ALL" ? "selected" : ""
          }`}
          onClick={() => setActiveSummaryFilter("ALL")}
          aria-pressed={activeSummaryFilter === "ALL"}
        >
          <div className="teacher-summary-icon blue">
            <Users size={22} />
          </div>

          <div className="teacher-report-summary-content">
            <span>Total Students</span>
            <h2>{totalStudents}</h2>
            <small>View all students</small>
          </div>
        </button>

        <button
          type="button"
          className={`teacher-report-summary-card summary-green ${
            activeSummaryFilter === "COMPLETED" ? "selected" : ""
          }`}
          onClick={() => setActiveSummaryFilter("COMPLETED")}
          aria-pressed={activeSummaryFilter === "COMPLETED"}
        >
          <div className="teacher-summary-icon green">
            <CheckCircle2 size={22} />
          </div>

          <div className="teacher-report-summary-content">
            <span>Completed Tasks</span>
            <h2>{totalCompleted}</h2>
            <small>Students with completed tasks</small>
          </div>
        </button>

        <button
          type="button"
          className={`teacher-report-summary-card summary-yellow ${
            activeSummaryFilter === "PENDING" ? "selected" : ""
          }`}
          onClick={() => setActiveSummaryFilter("PENDING")}
          aria-pressed={activeSummaryFilter === "PENDING"}
        >
          <div className="teacher-summary-icon yellow">
            <Clock3 size={22} />
          </div>

          <div className="teacher-report-summary-content">
            <span>Pending Review</span>
            <h2>{totalPending}</h2>
            <small>Students with pending tasks</small>
          </div>
        </button>
      </div>

      {/* STUDENTS */}

      <div className="teacher-student-report-section">
        <div className="teacher-student-report-section-header">
          <div>
            <h2>My Students</h2>

            <p>
              {activeSummaryFilter === "COMPLETED"
                ? "Students with completed tasks"
                : activeSummaryFilter === "PENDING"
                ? "Students with pending tasks"
                : "View progress and review submitted work."}
            </p>
          </div>
        </div>

        {!error && filteredStudents.length === 0 && (
          <div className="teacher-report-empty">
            <Users size={40} />

            <h3>
              {activeSummaryFilter === "COMPLETED"
                ? "No students with completed tasks"
                : activeSummaryFilter === "PENDING"
                ? "No students with pending tasks"
                : "No students assigned"}
            </h3>

            <p>
              No students match your current search or batch filter.
            </p>
          </div>
        )}

        <div className="teacher-student-report-list">
          {filteredStudents.map((student) => {
            const stats = student.stats || {};

            return (
              <div
                className="teacher-student-report-card"
                key={student._id}
              >
                <div className="teacher-student-report-info">
                  <div className="teacher-student-avatar">
                    {student.name
                      ?.charAt(0)
                      ?.toUpperCase() || "S"}
                  </div>

                  <div>
                    <h3>{student.name}</h3>
                    <p>{student.email}</p>

                    <span className="student-batch-tag">
                      {getBatchLabel(student)}
                    </span>
                  </div>
                </div>

                <div className="teacher-student-progress">
                  <div className="teacher-progress-item">
                    <span>Score</span>
                    <strong className="score">
                      {stats.score || 0}%
                    </strong>
                  </div>

                  <div className="teacher-progress-item">
                    <span>Completed</span>
                    <strong className="completed">
                      {stats.completed || 0}
                    </strong>
                  </div>

                  <div className="teacher-progress-item">
                    <span>Pending</span>
                    <strong className="pending">
                      {stats.pending || 0}
                    </strong>
                  </div>

                  <div className="teacher-progress-item">
                    <span>Rejected</span>
                    <strong className="rejected">
                      {stats.rejected || 0}
                    </strong>
                  </div>
                </div>

                <button
                  className="view-student-report-btn"
                  type="button"
                  onClick={() =>
                    handleViewStudentReport(student)
                  }
                >
                  View Report
                  <ChevronRight size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeacherTaskReport;
