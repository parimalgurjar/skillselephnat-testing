import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import api from "../../services/api";

import "./StudentDashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD DASHBOARD
  ===================================================== */

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/dashboard/student");

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load dashboard"
        );
      }

      setDashboard(response.data.dashboard || {});
    } catch (error) {
      console.error("Dashboard Load Error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="dashboard-loading">
          <RefreshCw
            size={28}
            className="dashboard-spinner"
          />

          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <div className="student-dashboard">
        <div className="dashboard-error">
          <AlertCircle size={24} />

          <div>
            <h3>Unable to load dashboard</h3>

            <p>{error}</p>

            <button onClick={() => loadDashboard()}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     DATA
  ===================================================== */

  const student = dashboard?.student || {};
  const attendance = dashboard?.attendance || {};
  const tasks = dashboard?.tasks || {};

  const courseProgress = Number(
    dashboard?.courseProgress || 0
  );

  const attendancePercentage = Number(
    attendance?.percentage || 0
  );

  const totalTasks = Number(tasks?.total || 0);
  const completedTasks = Number(tasks?.completed || 0);
  const pendingTasks = Number(tasks?.pending || 0);

  /* =====================================================
     ATTENDANCE STATUS
  ===================================================== */

  const attendanceStatus =
    attendancePercentage >= 75
      ? "Good Standing"
      : "Needs Improvement";

  /* =====================================================
     KEYBOARD NAVIGATION
  ===================================================== */

  const handleCardKeyDown = (event, path) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      navigate(path);
    }
  };

  /* =====================================================
     TASK STATUS
  ===================================================== */

  const getTaskStatus = (task) => {
    const rawStatus = String(
      task?.status ||
        task?.submission?.status ||
        task?.taskStatus ||
        ""
    ).toUpperCase();

    if (
      rawStatus === "APPROVED" ||
      rawStatus === "COMPLETED" ||
      rawStatus === "COMPLETE" ||
      rawStatus === "DONE"
    ) {
      return {
        label: "Completed",
        completed: true,
      };
    }

    if (rawStatus === "PENDING") {
      return {
        label: "Pending Review",
        completed: false,
      };
    }

    if (rawStatus === "REJECTED") {
      return {
        label: "Rejected",
        completed: false,
      };
    }

    return {
      label: "Pending",
      completed: false,
    };
  };

  return (
    <div className="student-dashboard">

      {/* ===============================================
         HEADER
      =============================================== */}

      <div className="student-dashboard-header">
        <div>
          <span className="dashboard-label">
            STUDENT PORTAL
          </span>

          <h1>
            Welcome back, {student.name || "Student"}!
          </h1>

          <p>
            Track your learning progress,
            attendance and tasks.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh-btn"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? "dashboard-spinner" : ""
            }
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ===============================================
         STATS
      =============================================== */}

      <div className="student-stats-grid">

        {/* ATTENDANCE */}

        <div
          className="student-stat-card dashboard-clickable-card"
          onClick={() => navigate("/student/attendance")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) =>
            handleCardKeyDown(
              event,
              "/student/attendance"
            )
          }
        >
          <div className="student-stat-icon">
            <CalendarCheck size={22} />
          </div>

          <div className="student-stat-content">
            <span>Attendance</span>

            <strong>
              {attendancePercentage}%
            </strong>

            <small>
              {attendanceStatus}
            </small>
          </div>
        </div>

        {/* COURSE PROGRESS */}

        <div
          className="student-stat-card dashboard-clickable-card"
          onClick={() => navigate("/student/course")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) =>
            handleCardKeyDown(
              event,
              "/student/course"
            )
          }
        >
          <div className="student-stat-icon">
            <BookOpen size={22} />
          </div>

          <div className="student-stat-content">
            <span>Course Progress</span>

            <strong>
              {courseProgress}%
            </strong>

            <small>
              {student.course?.name ||
                "Learning Progress"}
            </small>
          </div>
        </div>

        {/* PENDING TASKS */}

        <div
          className="student-stat-card dashboard-clickable-card"
          onClick={() => navigate("/student/work")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) =>
            handleCardKeyDown(
              event,
              "/student/work"
            )
          }
        >
          <div className="student-stat-icon">
            <Clock size={22} />
          </div>

          <div className="student-stat-content">
            <span>Pending Tasks</span>

            <strong>
              {pendingTasks}
            </strong>

            <small>
              Requires your attention
            </small>
          </div>
        </div>

        {/* COMPLETED TASKS */}

        <div
          className="student-stat-card dashboard-clickable-card"
          onClick={() => navigate("/student/work")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) =>
            handleCardKeyDown(
              event,
              "/student/work"
            )
          }
        >
          <div className="student-stat-icon">
            <CheckCircle2 size={22} />
          </div>

          <div className="student-stat-content">
            <span>Completed Tasks</span>

            <strong>
              {completedTasks}
            </strong>

            <small>
              {totalTasks > 0
                ? `Out of ${totalTasks} total`
                : "No tasks yet"}
            </small>
          </div>
        </div>

      </div>

      {/* ===============================================
         MAIN GRID
      =============================================== */}

      <div className="student-dashboard-grid">

        {/* =============================================
           COURSE PROGRESS
        ============================================= */}

        <div className="student-dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h2>
                Learning Progress
              </h2>

              <p>
                Your current course progress
              </p>
            </div>

            <BookOpen size={22} />
          </div>

          <div className="progress-section">

            <div className="progress-circle-wrapper">
              <div
                className="progress-circle"
                style={{
                  "--progress": `${Math.min(
                    Math.max(courseProgress, 0),
                    100
                  )}%`,
                }}
              >
                <div className="progress-circle-inner">
                  <strong>
                    {courseProgress}%
                  </strong>

                  <span>
                    Complete
                  </span>
                </div>
              </div>
            </div>

            <div className="progress-details">
              <h3>
                {student.course?.name ||
                  "Your Course"}
              </h3>

              <p>
                Progress is calculated from
                your completed tasks.
              </p>

              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(
                      Math.max(courseProgress, 0),
                      100
                    )}%`,
                  }}
                />
              </div>

              <span>
                {completedTasks} of {totalTasks} tasks
                completed
              </span>
            </div>

          </div>
        </div>

        {/* =============================================
           ATTENDANCE SUMMARY
        ============================================= */}

        <div className="student-dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h2>
                Attendance Overview
              </h2>

              <p>
                Your attendance performance
              </p>
            </div>

            <CalendarCheck size={22} />
          </div>

          <div className="attendance-overview">

            <div className="attendance-big-number">
              <strong>
                {attendancePercentage}%
              </strong>

              <span>
                Current Attendance
              </span>
            </div>

            <div className="attendance-details">

              <div>
                <span>
                  Total Classes
                </span>

                <strong>
                  {attendance.totalClasses || 0}
                </strong>
              </div>

              <div>
                <span>
                  Present
                </span>

                <strong>
                  {attendance.presentClasses || 0}
                </strong>
              </div>

              <div>
                <span>
                  Absent
                </span>

                <strong>
                  {attendance.absentClasses || 0}
                </strong>
              </div>

            </div>

            <div
              className={
                attendancePercentage >= 75
                  ? "attendance-status good"
                  : "attendance-status warning"
              }
            >
              {attendancePercentage >= 75 ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}

              {attendanceStatus}
            </div>

          </div>
        </div>

      </div>

      {/* ===============================================
         RECENT TASKS
      =============================================== */}

      <div className="student-dashboard-card recent-tasks-card">

        <div className="dashboard-card-header">
          <div>
            <h2>
              Recent Tasks
            </h2>

            <p>
              Your latest assigned tasks
            </p>
          </div>

          <ClipboardList size={22} />
        </div>

        {!Array.isArray(tasks.recent) ||
        tasks.recent.length === 0 ? (

          <div className="empty-dashboard-state">
            <ClipboardList size={36} />

            <h3>
              No tasks assigned yet
            </h3>

            <p>
              Tasks assigned to your batch
              will appear here.
            </p>
          </div>

        ) : (

          <div className="recent-tasks-list">

            {tasks.recent.map((task) => {
              const taskState =
                getTaskStatus(task);

              return (
                <div
                  className="recent-task-item dashboard-clickable-task"
                  key={task._id}
                  onClick={() =>
                    navigate("/student/work")
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) =>
                    handleCardKeyDown(
                      event,
                      "/student/work"
                    )
                  }
                >

                  <div
                    className={
                      taskState.completed
                        ? "task-status-icon completed"
                        : "task-status-icon pending"
                    }
                  >
                    {taskState.completed ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Clock size={18} />
                    )}
                  </div>

                  <div className="recent-task-content">
                    <h3>
                      {task.title || "Untitled Task"}
                    </h3>

                    {task.description && (
                      <p>
                        {task.description}
                      </p>
                    )}

                    {task.dueDate && (
                      <small>
                        Due:{" "}
                        {new Date(
                          task.dueDate
                        ).toLocaleDateString()}
                      </small>
                    )}
                  </div>

                  <span
                    className={
                      taskState.completed
                        ? "task-badge completed"
                        : "task-badge pending"
                    }
                  >
                    {taskState.label}
                  </span>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
};

export default StudentDashboard;