import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Users,
  ClipboardCheck,
  CalendarCheck,
  TrendingUp,
  Clock,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "./TeacherDashboard.css";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    activeTasks: 0,
    avgAttendance: 0,
    performance: 0,
    totalBatches: 0,
  });

  const [recentTasks, setRecentTasks] = useState([]);

  const [upcomingClasses, setUpcomingClasses] = useState([]);

  /* =====================================================
     LOAD DASHBOARD DATA
  ===================================================== */

  useEffect(() => {
  const loadDashboard = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/teachers/dashboard"
      );

      const dashboard =
        response.data?.dashboard;

      setDashboardData({
        totalStudents:
          dashboard?.totalStudents || 0,

        activeTasks:
          dashboard?.activeTasks || 0,

        avgAttendance:
          dashboard?.avgAttendance || 0,

        performance:
          dashboard?.performance || 0,

        totalBatches:
          dashboard?.totalBatches || 0,
      });

      setUpcomingClasses(
        dashboard?.upcomingClasses || []
      );

      setRecentTasks(
        dashboard?.recentTasks || []
      );
    } catch (error) {
      console.error(
        "Dashboard Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  loadDashboard();
}, []);

  /* =====================================================
     DATE FORMAT
  ===================================================== */

  const today = new Date().toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="teacher-dashboard">
        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">

      {/* HEADER */}

      <div className="teacher-dashboard-header">

        <div>

          <span className="teacher-page-label">
            EDUCATOR PORTAL
          </span>

          <h1>
            Good Morning,{" "}
            {user?.name || "Teacher"}! 👋
          </h1>

          <p>
            Here's what's happening with your
            students today.
          </p>

        </div>

        <div className="teacher-date-card">

          <CalendarCheck size={18} />

          <div>

            <span>Today</span>

            <strong>
              {today}
            </strong>

          </div>

        </div>

      </div>

      {/* STATS */}

      <div className="teacher-stats-grid">

        {/* TOTAL STUDENTS */}

        <div className="teacher-stat-card">

          <div className="teacher-stat-icon navy">
            <Users size={21} />
          </div>

          <div>

            <span>Total Students</span>

            <strong>
              {dashboardData.totalStudents}
            </strong>

            <small>
              Across{" "}
              {dashboardData.totalBatches}{" "}
              batches
            </small>

          </div>

        </div>

        {/* ACTIVE TASKS */}

        <div className="teacher-stat-card">

          <div className="teacher-stat-icon yellow">
            <ClipboardCheck size={21} />
          </div>

          <div>

            <span>Active Tasks</span>

            <strong>
              {dashboardData.activeTasks}
            </strong>

            <small>
              Assignments running
            </small>

          </div>

        </div>

        {/* ATTENDANCE */}

        <div className="teacher-stat-card">

          <div className="teacher-stat-icon green">
            <CheckCircle2 size={21} />
          </div>

          <div>

            <span>Avg Attendance</span>

            <strong>
              {dashboardData.avgAttendance}%
            </strong>

            <small>
              Overall attendance
            </small>

          </div>

        </div>

        {/* PERFORMANCE */}

        <div className="teacher-stat-card">

          <div className="teacher-stat-icon purple">
            <TrendingUp size={21} />
          </div>

          <div>

            <span>Performance</span>

            <strong>
              {dashboardData.performance}%
            </strong>

            <small className="teacher-growth">

              <ArrowUpRight size={11} />

              Student progress

            </small>

          </div>

        </div>

      </div>

      {/* MAIN GRID */}

      <div className="teacher-main-grid">

        {/* UPCOMING CLASSES */}

        <div className="teacher-card upcoming-classes-card">

          <div className="teacher-card-header">

            <div>

              <h2>
                Today's Classes
              </h2>

              <p>
                Your assigned batch timings.
              </p>

            </div>

            <button
              onClick={() =>
                navigate(
                  "/teacher/attendance"
                )
              }
            >
              View Schedule
            </button>

          </div>

          <div className="class-list">

            {upcomingClasses.length === 0 ? (

              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                No classes scheduled.
              </div>

            ) : (

              upcomingClasses.map(
                (classItem) => (

                  <div
                    className="class-item"
                    key={classItem.id}
                  >

                    <div className="class-time">

                      <Clock size={15} />

                      <span>
                        {classItem.time}
                      </span>

                    </div>

                    <div className="class-details">

                      <h3>
                        {classItem.title}
                      </h3>

                      <span>
                        {classItem.batch}
                      </span>

                    </div>

                    <div className="class-status">

                      Upcoming

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </div>

        {/* QUICK ACTIONS */}

        <div className="teacher-card quick-actions-card">

          <div className="teacher-card-header">

            <div>

              <h2>
                Quick Actions
              </h2>

              <p>
                Manage your daily activities.
              </p>

            </div>

          </div>

          <div className="teacher-actions-grid">

            <button
              className="teacher-action-btn"
              onClick={() =>
                navigate(
                  "/teacher/attendance"
                )
              }
            >

              <CalendarCheck size={19} />

              <span>
                Mark Attendance
              </span>

            </button>

            <button
              className="teacher-action-btn"
              onClick={() =>
                navigate(
                  "/teacher/tasks"
                )
              }
            >

              <ClipboardCheck size={19} />

              <span>
                Create Task
              </span>

            </button>

            <button
              className="teacher-action-btn"
              onClick={() =>
                navigate(
                  "/teacher/students"
                )
              }
            >

              <Users size={19} />

              <span>
                View Students
              </span>

            </button>

            <button
              className="teacher-action-btn"
              onClick={() =>
                navigate(
                  "/teacher/performance"
                )
              }
            >

              <TrendingUp size={19} />

              <span>
                Performance
              </span>

            </button>

          </div>

        </div>

      </div>

      {/* RECENT TASKS */}

      <div className="teacher-card teacher-recent-tasks">

        <div className="teacher-card-header">

          <div>

            <h2>
              Recent Tasks & Assignments
            </h2>

            <p>
              Track assignments shared with your
              students.
            </p>

          </div>

          <button
            onClick={() =>
              navigate(
                "/teacher/tasks"
              )
            }
          >
            View All Tasks
          </button>

        </div>

        {recentTasks.length === 0 ? (

          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#777",
            }}
          >
            No tasks created yet.
          </div>

        ) : (

          <div className="teacher-task-table-wrapper">

            <table className="teacher-task-table">

              <thead>

                <tr>

                  <th>
                    Task Name
                  </th>

                  <th>
                    Batch
                  </th>

                  <th>
                    Submissions
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {recentTasks.map(
                  (task) => (

                    <tr
                      key={task._id}
                    >

                      <td>

                        <div className="task-name-cell">

                          <div className="task-icon">

                            <BookOpen
                              size={16}
                            />

                          </div>

                          <strong>
                            {task.title}
                          </strong>

                        </div>

                      </td>

                      <td>
                        {task.batch}
                      </td>

                      <td>

                        <strong className="submission-count">

                          {task.submissions}

                        </strong>

                      </td>

                      <td>

                        <span
                          className={
                            task.status ===
                            "COMPLETED"
                              ? "task-status completed"
                              : "task-status active"
                          }
                        >

                          {task.status}

                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};

export default TeacherDashboard;