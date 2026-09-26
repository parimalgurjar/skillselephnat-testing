import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Clock3,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Save,
  Send,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";

import api from "../../services/api";

import "./MyWork.css";

const MyWork = () => {
  /* =====================================================
     STATE
  ===================================================== */

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedTask, setExpandedTask] = useState(null);

  const [savingTaskId, setSavingTaskId] =
    useState(null);

  const [submittingTaskId, setSubmittingTaskId] =
    useState(null);

  const [taskProgress, setTaskProgress] =
    useState({});

  const [remarks, setRemarks] = useState({});

  /* =====================================================
     FETCH STUDENT TASKS
  ===================================================== */

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/tasks/my-work"
      );

      if (response.data?.success) {
        const fetchedTasks =
          response.data.tasks || [];

        setTasks(fetchedTasks);

        const progressData = {};
        const remarksData = {};

        fetchedTasks.forEach((task) => {
          progressData[task._id] =
            task.submission?.completedTasks || [];

          remarksData[task._id] =
            task.submission?.remarks || "";
        });

        setTaskProgress(progressData);
        setRemarks(remarksData);
      } else {
        setError(
          response.data?.message ||
            "Unable to load tasks"
        );
      }
    } catch (error) {
      console.error(
        "Fetch Student Tasks Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchTasks();
  }, []);

  /* =====================================================
     GET STATUS
  ===================================================== */

  const getTaskStatus = (task) => {
    if (!task.submission) {
      return "NOT_STARTED";
    }

    return (
      task.submission.status ||
      "DRAFT"
    );
  };

  /* =====================================================
     STATUS CONFIG
  ===================================================== */

  const getStatusConfig = (status) => {
    switch (status) {
      case "APPROVED":
        return {
          label: "Approved",
          className: "approved",
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

      case "DRAFT":
        return {
          label: "In Progress",
          className: "draft",
          icon: <Save size={16} />,
        };

      default:
        return {
          label: "Not Started",
          className: "not-started",
          icon: <AlertCircle size={16} />,
        };
    }
  };

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {
    if (!date) {
      return "No due date";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
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
     TOGGLE CHECKLIST
  ===================================================== */

  const toggleTaskItem = (
    reportId,
    taskItemId,
    disabled
  ) => {
    if (disabled) return;

    setTaskProgress((previous) => {
      const current =
        previous[reportId] || [];

      const taskId =
        taskItemId.toString();

      const exists = current.some(
        (id) =>
          id.toString() === taskId
      );

      return {
        ...previous,

        [reportId]: exists
          ? current.filter(
              (id) =>
                id.toString() !== taskId
            )
          : [...current, taskId],
      };
    });
  };

  /* =====================================================
     SAVE PROGRESS
  ===================================================== */

  const handleSaveProgress = async (
    task
  ) => {
    try {
      setSavingTaskId(task._id);
      setError("");

      const response = await api.put(
        `/tasks/${task._id}/progress`,
        {
          completedTasks:
            taskProgress[task._id] || [],

          remarks:
            remarks[task._id] || "",
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to save progress"
        );
      }

      await fetchTasks();
    } catch (error) {
      console.error(
        "Save Task Progress Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to save progress"
      );
    } finally {
      setSavingTaskId(null);
    }
  };

  /* =====================================================
     SUBMIT TASK
  ===================================================== */

  const handleSubmitTask = async (
    task
  ) => {
    try {
      setSubmittingTaskId(task._id);
      setError("");

      const response = await api.post(
        `/tasks/${task._id}/submit`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to submit task"
        );
      }

      await fetchTasks();
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
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="my-work-page">

        <div className="my-work-loading">

          <Loader2
            className="task-spinner"
            size={32}
          />

          <p>
            Loading your assignments...
          </p>

        </div>

      </div>
    );
  }

  /* =====================================================
     COUNTS
  ===================================================== */

  const totalTasks = tasks.length;

  const pendingTasks = tasks.filter(
    (task) => {
      const status =
        getTaskStatus(task);

      return (
        status === "NOT_STARTED" ||
        status === "DRAFT" ||
        status === "REJECTED"
      );
    }
  ).length;

  const submittedTasks = tasks.filter(
    (task) => {
      const status =
        getTaskStatus(task);

      return (
        status === "PENDING" ||
        status === "APPROVED"
      );
    }
  ).length;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="my-work-page">

      {/* HEADER */}

      <div className="work-page-header">

        <div>

          <span className="work-page-label">
            STUDENT PORTAL
          </span>

          <h1>
            My Tasks
          </h1>

          <p>
            Complete your assigned tasks and submit
            them for teacher review.
          </p>

        </div>

        <div className="work-header-icon">
          <FileText size={28} />
        </div>

      </div>

      {/* SUMMARY */}

      <div className="work-summary-grid">

        <div className="work-summary-card">

          <div className="summary-icon navy">
            <FileText size={22} />
          </div>

          <div>
            <span>Total Tasks</span>
            <h2>{totalTasks}</h2>
          </div>

        </div>

        <div className="work-summary-card">

          <div className="summary-icon yellow">
            <Clock3 size={22} />
          </div>

          <div>
            <span>In Progress</span>
            <h2>{pendingTasks}</h2>
          </div>

        </div>

        <div className="work-summary-card">

          <div className="summary-icon green">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Submitted</span>
            <h2>{submittedTasks}</h2>
          </div>

        </div>

      </div>

      {/* TASK SECTION */}

      <div className="tasks-section">

        <div className="tasks-section-header">

          <div>

            <h2>
              Assignments & Tasks
            </h2>

            <p>
              Track your checklist progress and submit
              completed work for review.
            </p>

          </div>

        </div>

        {/* ERROR */}

        {error && (

          <div className="my-work-error">

            <XCircle size={18} />

            <span>
              {error}
            </span>

          </div>

        )}

        {/* EMPTY */}

        {tasks.length === 0 && (

          <div className="my-work-empty">

            <FileText size={42} />

            <h3>
              No Tasks Available
            </h3>

            <p>
              No tasks have been assigned to your
              batch yet.
            </p>

          </div>

        )}

        {/* TASK LIST */}

        <div className="task-list">

          {tasks.map((task) => {

            const status =
              getTaskStatus(task);

            const statusConfig =
              getStatusConfig(status);

            const isExpanded =
              expandedTask === task._id;

            const isLocked =
              status === "PENDING" ||
              status === "APPROVED";

            const completedItems =
              taskProgress[task._id] || [];

            const totalItems =
              task.tasks?.length || 0;

            const completedCount =
              completedItems.length;

            const progress =
              totalItems > 0
                ? Math.round(
                    (completedCount /
                      totalItems) *
                      100
                  )
                : 0;

            const isSaving =
              savingTaskId === task._id;

            const isSubmitting =
              submittingTaskId === task._id;

            return (

              <div
                className={`student-task-card ${statusConfig.className}`}
                key={task._id}
              >

                {/* TASK HEADER */}

                <div className="task-card-main">

                  <div className="task-card-left">

                    <div className="task-module-badge">
                      Assignment
                    </div>

                    <div className="task-content">

                      <div className="task-title-row">

                        <h3>
                          {task.title}
                        </h3>

                        <span
                          className={`priority-badge ${
                            (
                              task.priority ||
                              "Medium"
                            ).toLowerCase()
                          }`}
                        >
                          {task.priority ||
                            "Medium"}
                        </span>

                      </div>

                      <p>
                        {task.description ||
                          "No description provided."}
                      </p>

                      <div className="task-meta">

                        <span>
                          <Clock3 size={14} />

                          Due:{" "}
                          {formatDate(
                            task.dueDate
                          )}
                        </span>

                        <span
                          className={`task-status ${statusConfig.className}`}
                        >
                          {statusConfig.icon}

                          {statusConfig.label}
                        </span>

                      </div>

                    </div>

                  </div>

                  {/* ACTION */}

                  <div className="task-action">

                    <button
                      type="button"
                      className="view-task-btn"
                      onClick={() =>
                        setExpandedTask(
                          isExpanded
                            ? null
                            : task._id
                        )
                      }
                    >

                      {isExpanded ? (
                        <>
                          Hide Tasks
                          <ChevronUp size={17} />
                        </>
                      ) : (
                        <>
                          View Tasks
                          <ChevronDown size={17} />
                        </>
                      )}

                    </button>

                  </div>

                </div>

                {/* EXPANDED */}

                {isExpanded && (

                  <div className="task-checklist-container">

                    {/* PROGRESS */}

                    <div className="task-progress-header">

                      <div>

                        <strong>
                          Task Progress
                        </strong>

                        <span>
                          {completedCount} of{" "}
                          {totalItems} completed
                        </span>

                      </div>

                      <strong>
                        {progress}%
                      </strong>

                    </div>

                    <div className="task-progress-bar">

                      <div
                        className="task-progress-fill"
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>

                    {/* CHECKLIST */}

                    <div className="task-checklist">

                      {task.tasks?.map(
                        (item, index) => {

                          const isCompleted =
                            completedItems.some(
                              (id) =>
                                id.toString() ===
                                item._id.toString()
                            );

                          return (

                            <label
                              className={`checklist-item ${
                                isCompleted
                                  ? "checked"
                                  : ""
                              } ${
                                isLocked
                                  ? "locked"
                                  : ""
                              }`}
                              key={item._id}
                            >

                              <input
                                type="checkbox"
                                checked={
                                  isCompleted
                                }
                                disabled={
                                  isLocked
                                }
                                onChange={() =>
                                  toggleTaskItem(
                                    task._id,
                                    item._id,
                                    isLocked
                                  )
                                }
                              />

                              <span className="custom-checkbox">

                                {isCompleted && (
                                  <CheckCircle2
                                    size={18}
                                  />
                                )}

                              </span>

                              <div className="checklist-content">

                                <strong>
                                  {index + 1}.{" "}
                                  {item.title}
                                </strong>

                                {item.description && (
                                  <p>
                                    {
                                      item.description
                                    }
                                  </p>
                                )}

                              </div>

                            </label>

                          );
                        }
                      )}

                    </div>

                    {/* TEACHER FEEDBACK */}

                    {status === "REJECTED" &&
                      task.submission
                        ?.teacherRemarks && (

                        <div className="teacher-rejection-box">

                          <strong>
                            Teacher Feedback
                          </strong>

                          <p>
                            {
                              task.submission
                                .teacherRemarks
                            }
                          </p>

                        </div>

                      )}

                    {/* REMARKS */}

                    {!isLocked && (

                      <div className="task-remarks-group">

                        <label>
                          Remarks
                        </label>

                        <textarea
                          rows="3"
                          placeholder="Add notes about your progress..."
                          value={
                            remarks[
                              task._id
                            ] || ""
                          }
                          onChange={(event) =>
                            setRemarks(
                              (previous) => ({
                                ...previous,

                                [task._id]:
                                  event.target
                                    .value,
                              })
                            )
                          }
                        />

                      </div>

                    )}

                    {/* ACTIONS */}

                    {!isLocked && (

                      <div className="task-checklist-actions">

                        <button
                          type="button"
                          className="save-progress-btn"
                          onClick={() =>
                            handleSaveProgress(
                              task
                            )
                          }
                          disabled={
                            isSaving ||
                            isSubmitting
                          }
                        >

                          {isSaving ? (
                            <>
                              <Loader2
                                className="task-spinner"
                                size={16}
                              />

                              Saving...
                            </>
                          ) : (
                            <>
                              <Save
                                size={16}
                              />

                              Save Progress
                            </>
                          )}

                        </button>

                        {(status === "DRAFT" ||
                          status ===
                            "REJECTED") && (

                          <button
                            type="button"
                            className="submit-review-btn"
                            onClick={() =>
                              handleSubmitTask(
                                task
                              )
                            }
                            disabled={
                              isSaving ||
                              isSubmitting
                            }
                          >

                            {isSubmitting ? (
                              <>
                                <Loader2
                                  className="task-spinner"
                                  size={16}
                                />

                                Submitting...
                              </>
                            ) : (
                              <>
                                {status ===
                                "REJECTED" ? (
                                  <RotateCcw
                                    size={16}
                                  />
                                ) : (
                                  <Send
                                    size={16}
                                  />
                                )}

                                Submit for Review
                              </>
                            )}

                          </button>

                        )}

                      </div>

                    )}

                    {/* PENDING */}

                    {status === "PENDING" && (

                      <div className="task-review-message pending">

                        <Clock3 size={18} />

                        Your task has been submitted
                        and is waiting for teacher
                        review.

                      </div>

                    )}

                    {/* APPROVED */}

                    {status === "APPROVED" && (

                      <div className="task-review-message approved">

                        <CheckCircle2
                          size={18}
                        />

                        Congratulations! Your task has
                        been approved by your teacher.

                      </div>

                    )}

                  </div>

                )}

              </div>

            );
          })}

        </div>

      </div>

    </div>
  );
};

export default MyWork;