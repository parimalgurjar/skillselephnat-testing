import { useEffect, useState } from "react";

import {
  ClipboardCheck,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertTriangle,
  Loader2,
  Send,
  ListChecks,
} from "lucide-react";

import api from "../../services/api";

import "./StudentTaskReport.css";


const StudentTaskReport = () => {
  /* =====================================================
     STATES
  ===================================================== */

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [submittingTaskId, setSubmittingTaskId] =
    useState(null);


  /* =====================================================
     FETCH MY TASK REPORT
  ===================================================== */

  const fetchMyTaskReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/task-report/my-report"
      );

      if (response.data?.success) {
        setReport(response.data);
      } else {
        setError(
          response.data?.message ||
            "Unable to load task report"
        );
      }
    } catch (error) {
      console.error(
        "Fetch My Task Report Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load task report"
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchMyTaskReport();
  }, []);


  /* =====================================================
     SUBMIT TASK FOR APPROVAL
  ===================================================== */

  const handleSubmitTask = async (
    taskId
  ) => {
    try {
      setSubmittingTaskId(taskId);
      setError("");

      const response = await api.post(
        `/task-report/tasks/${taskId}/submit`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to submit task"
        );
      }

      /* Refresh report */

      await fetchMyTaskReport();

    } catch (error) {
      console.error(
        "Submit Task Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to submit task"
      );
    } finally {
      setSubmittingTaskId(null);
    }
  };


  /* =====================================================
     STATUS CONFIG
  ===================================================== */

  const getStatusConfig = (status) => {
    switch (status) {
      case "COMPLETED":
        return {
          label: "Completed",
          className: "completed",
          icon: <CheckCircle2 size={16} />,
        };

      case "PENDING":
        return {
          label: "Pending Review",
          className: "pending",
          icon: <Clock3 size={16} />,
        };

      case "REJECTED":
        return {
          label: "Rejected",
          className: "rejected",
          icon: <XCircle size={16} />,
        };

      default:
        return {
          label: "Not Started",
          className: "not-started",
          icon: <AlertTriangle size={16} />,
        };
    }
  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading && !report) {
    return (
      <div className="student-task-report-page">

        <div className="student-task-report-loading">

          <Loader2
            size={32}
            className="student-task-report-spinner"
          />

          <p>
            Loading your task report...
          </p>

        </div>

      </div>
    );
  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="student-task-report-page">

      {/* ===============================================
          HEADER
      =============================================== */}

      <div className="student-task-report-header">

        <div>

          <span className="student-task-report-label">
            LEARNING PROGRESS
          </span>

          <h1>
            My Task Report
          </h1>

          <p>
            Track your assigned tasks and submit
            completed work for teacher approval.
          </p>

        </div>


        <div className="student-task-report-header-icon">
          <ClipboardCheck size={30} />
        </div>

      </div>


      {/* ===============================================
          ERROR
      =============================================== */}

      {error && (
        <div className="student-task-report-error">

          <AlertTriangle size={18} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={fetchMyTaskReport}
          >
            Try Again
          </button>

        </div>
      )}


      {/* ===============================================
          STATS
      =============================================== */}

      <div className="student-task-stats-grid">

        {/* TOTAL */}

        <div className="student-task-stat-card">

          <div className="student-task-stat-icon blue">
            <ListChecks size={22} />
          </div>

          <div>

            <span>
              Total Tasks
            </span>

            <strong>
              {report?.stats?.totalTasks || 0}
            </strong>

          </div>

        </div>


        {/* COMPLETED */}

        <div className="student-task-stat-card">

          <div className="student-task-stat-icon green">
            <CheckCircle2 size={22} />
          </div>

          <div>

            <span>
              Completed
            </span>

            <strong>
              {report?.stats?.completedTasks || 0}
            </strong>

          </div>

        </div>


        {/* PENDING */}

        <div className="student-task-stat-card">

          <div className="student-task-stat-icon yellow">
            <Clock3 size={22} />
          </div>

          <div>

            <span>
              Pending Review
            </span>

            <strong>
              {report?.stats?.pendingTasks || 0}
            </strong>

          </div>

        </div>


        {/* SCORE */}

        <div className="student-task-stat-card score-card">

          <div>

            <span>
              Overall Score
            </span>

            <strong>
              {report?.stats?.score || 0}%
            </strong>

          </div>

        </div>

      </div>


      {/* ===============================================
          PROGRESS BAR
      =============================================== */}

      <div className="student-task-progress-card">

        <div className="student-task-progress-header">

          <div>

            <h3>
              Overall Progress
            </h3>

            <p>
              Complete tasks and get teacher
              approval to improve your score.
            </p>

          </div>

          <strong>
            {report?.stats?.score || 0}%
          </strong>

        </div>


        <div className="student-task-progress-track">

          <div
            className="student-task-progress-fill"
            style={{
              width: `${report?.stats?.score || 0}%`,
            }}
          />

        </div>

      </div>


      {/* ===============================================
          EMPTY STATE
      =============================================== */}

      {!loading &&
        !error &&
        report?.categories?.length === 0 && (
          <div className="student-task-report-empty">

            <ClipboardCheck size={45} />

            <h3>
              No Tasks Assigned Yet
            </h3>

            <p>
              Your teacher hasn't assigned any
              tasks yet.
            </p>

          </div>
        )}


      {/* ===============================================
          CATEGORIES
      =============================================== */}

      <div className="student-task-categories">

        {report?.categories?.map(
          (category, categoryIndex) => (
            <div
              className="student-task-category"
              key={category._id}
            >

              {/* CATEGORY HEADER */}

              <div className="student-task-category-header">

                <div className="student-task-category-title">

                  <div className="student-task-category-number">

                    {String(
                      categoryIndex + 1
                    ).padStart(2, "0")}

                  </div>


                  <div>

                    <h2>
                      {category.name}
                    </h2>

                    {category.description && (
                      <p>
                        {category.description}
                      </p>
                    )}

                  </div>

                </div>


                <div className="student-task-category-count">

                  {category.tasks?.length || 0} Tasks

                </div>

              </div>


              {/* =========================================
                  TASK LIST
              ========================================= */}

              <div className="student-task-list">

                {category.tasks?.map(
                  (task, taskIndex) => {
                    const statusConfig =
                      getStatusConfig(
                        task.status
                      );

                    const isSubmitting =
                      submittingTaskId ===
                      task._id;

                    const canSubmit =
                      task.status ===
                        "NOT_STARTED" ||
                      task.status ===
                        "REJECTED";


                    return (
                      <div
                        className="student-task-card"
                        key={task._id}
                      >

                        {/* TASK NUMBER */}

                        <div className="student-task-number">

                          {taskIndex + 1}

                        </div>


                        {/* TASK INFO */}

                        <div className="student-task-info">

                          <h3>
                            {task.title}
                          </h3>

                          {task.description && (
                            <p>
                              {task.description}
                            </p>
                          )}


                          {/* REJECTION REASON */}

                          {task.status ===
                            "REJECTED" &&
                            task.rejectionReason && (
                              <div className="student-task-rejection-reason">

                                <strong>
                                  Rejection Reason:
                                </strong>

                                <span>
                                  {
                                    task.rejectionReason
                                  }
                                </span>

                              </div>
                            )}

                        </div>


                        {/* TASK ACTION */}

                        <div className="student-task-action">

                          {/* STATUS */}

                          <span
                            className={`student-task-status ${statusConfig.className}`}
                          >

                            {
                              statusConfig.icon
                            }

                            {
                              statusConfig.label
                            }

                          </span>


                          {/* SUBMIT BUTTON */}

                          {canSubmit && (
                            <button
                              type="button"
                              className="student-submit-task-btn"
                              disabled={
                                isSubmitting
                              }
                              onClick={() =>
                                handleSubmitTask(
                                  task._id
                                )
                              }
                            >

                              {isSubmitting ? (
                                <>
                                  <Loader2
                                    size={15}
                                    className="student-task-spinner"
                                  />

                                  Submitting...

                                </>
                              ) : (
                                <>
                                  <Send
                                    size={15}
                                  />

                                  Submit for Approval

                                </>
                              )}

                            </button>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>
          )
        )}

      </div>

    </div>
  );
};


export default StudentTaskReport;