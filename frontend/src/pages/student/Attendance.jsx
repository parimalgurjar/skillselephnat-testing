import { useCallback, useEffect, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { getMyAttendance } from "../../services/attendanceApi";

import "./Attendance.css";

const DEFAULT_STATS = {
  totalClasses: 0,
  presentClasses: 0,
  absentClasses: 0,
  attendancePercentage: 0,
  requiredAttendance: 75,
};

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [student, setStudent] = useState(null);
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     FETCH ATTENDANCE
  ===================================================== */

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyAttendance();

      /*
        Supports both:
        response.data
        OR
        direct response object
      */

      const data = response?.data || response;

      if (!data?.success) {
        throw new Error(
          data?.message || "Unable to fetch attendance"
        );
      }

      const attendance = Array.isArray(data.attendance)
        ? data.attendance
        : [];

      const responseStats = data.stats || {};

      setAttendanceData(attendance);

      /* ================= STUDENT / BATCH ================= */

      setStudent(data.student || null);
      setBatch(data.batch || null);

      /* ================= STATS ================= */

      setStats({
        totalClasses:
          Number(responseStats.totalClasses) || 0,

        presentClasses:
          Number(responseStats.presentClasses) || 0,

        absentClasses:
          Number(responseStats.absentClasses) || 0,

        attendancePercentage:
          Number(
            responseStats.attendancePercentage ??
              responseStats.percentage
          ) || 0,

        requiredAttendance:
          Number(responseStats.requiredAttendance) || 75,
      });
    } catch (err) {
      console.error(
        "Attendance fetch error:",
        err
      );

      setAttendanceData([]);
      setStudent(null);
      setBatch(null);
      setStats(DEFAULT_STATS);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to fetch attendance"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
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
     GET DAY
  ===================================================== */

  const getDay = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
      }
    );
  };

  /* =====================================================
     NORMALIZED VALUES
  ===================================================== */

  const attendancePercentage = Math.min(
    Math.max(
      Number(stats.attendancePercentage) || 0,
      0
    ),
    100
  );

  const totalClasses =
    Number(stats.totalClasses) || 0;

  const presentClasses =
    Number(stats.presentClasses) || 0;

  const absentClasses =
    Number(stats.absentClasses) || 0;

  const requiredAttendance =
    Number(stats.requiredAttendance) || 75;

  const isEligible =
    totalClasses > 0 &&
    attendancePercentage >= requiredAttendance;

  /* =====================================================
     BATCH INFORMATION
  ===================================================== */

const batchName =
  batch?.name ||
  "Not Assigned";

  const batchCode =
    batch?.code ||
    student?.batch?.code ||
    "";

const batchTiming =
  batch?.displayTiming ||
  batch?.batchTiming ||
  student?.batchTiming ||
  "";

  /* =====================================================
     ATTENDANCE STATS
  ===================================================== */

  const attendanceStats = [
    {
      title: "Overall Attendance",
      value: `${attendancePercentage}%`,
      subtitle:
        totalClasses === 0
          ? "No classes conducted yet"
          : attendancePercentage >= requiredAttendance
          ? "Good Standing"
          : "Needs Improvement",
      icon: TrendingUp,
      status:
        attendancePercentage >= requiredAttendance
          ? "success"
          : "warning",
    },

    {
      title: "Classes Attended",
      value: presentClasses,
      subtitle: `Out of ${totalClasses} Classes`,
      icon: CheckCircle2,
      status: "success",
    },

    {
      title: "Classes Absent",
      value: absentClasses,
      subtitle:
        totalClasses === 0
          ? "No attendance records"
          : "Classes Missed",
      icon: XCircle,
      status: "danger",
    },

    {
      title: "Required Attendance",
      value: `${requiredAttendance}%`,
      subtitle: "Minimum Required",
      icon: CalendarDays,
      status: "primary",
    },
  ];

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="attendance-loading">
          <RefreshCw
            size={26}
            className="attendance-spinner"
          />

          <p>Loading attendance...</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <div className="attendance-page">
        <div className="attendance-error">
          <AlertCircle size={28} />

          <div>
            <h3>
              Unable to load attendance
            </h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={fetchAttendance}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-page">

      {/* =================================================
         PAGE HEADER
      ================================================= */}

      <div className="attendance-page-header">

        <div className="attendance-header-content">

          <span className="page-label">
            STUDENT PORTAL
          </span>

          <h1>Attendance</h1>

          <p>
            Track your class attendance and maintain
            your course eligibility.
          </p>

        </div>

        <div className="attendance-header-actions">

          <button
            type="button"
            className="attendance-refresh-btn"
            onClick={fetchAttendance}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "refresh-spinning"
                  : ""
              }
            />

            <span>Refresh</span>
          </button>

          <div className="attendance-header-icon">
            <CalendarDays size={25} />
          </div>

        </div>

      </div>

      {/* =================================================
         ELIGIBILITY BANNER
      ================================================= */}

      <div
        className={`attendance-eligibility ${
          totalClasses === 0
            ? "no-data"
            : isEligible
            ? "eligible"
            : "not-eligible"
        }`}
      >

        <div className="eligibility-icon">

          {totalClasses === 0 ? (
            <CalendarDays size={28} />
          ) : isEligible ? (
            <CheckCircle2 size={28} />
          ) : (
            <XCircle size={28} />
          )}

        </div>

        <div className="eligibility-content">

          <h3>
            {totalClasses === 0
              ? "No classes recorded yet"
              : isEligible
              ? "You're doing great!"
              : "Attendance needs improvement"}
          </h3>

          <p>
            {totalClasses === 0
              ? "Your attendance percentage will appear once classes are conducted."
              : isEligible
              ? "Your attendance is above the minimum requirement for course completion."
              : `You need at least ${requiredAttendance}% attendance for course completion.`}
          </p>

        </div>

        <div className="eligibility-percentage">
          {attendancePercentage}%
        </div>

      </div>

      {/* =================================================
         STATS
      ================================================= */}

      <div className="attendance-stats-grid">

        {attendanceStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              className="attendance-stat-card"
              key={stat.title}
            >

              <div className="attendance-stat-top">

                <span>
                  {stat.title}
                </span>

                <div
                  className={`attendance-stat-icon ${stat.status}`}
                >
                  <Icon size={20} />
                </div>

              </div>

              <h2>{stat.value}</h2>

              <p>{stat.subtitle}</p>

            </div>
          );
        })}

      </div>

      {/* =================================================
         ATTENDANCE PROGRESS
      ================================================= */}

      <div className="attendance-progress-card">

        <div className="attendance-progress-header">

          <div>

            <h3>
              Attendance Progress
            </h3>

            <p>
              Your attendance is calculated based on
              total conducted classes.
            </p>

          </div>

          <span className="attendance-class-count">
            {presentClasses} / {totalClasses} Classes
          </span>

        </div>

        <div className="attendance-progress-track">

          <div
            className={`attendance-progress-fill ${
              attendancePercentage >= requiredAttendance
                ? "good"
                : "warning"
            }`}
            style={{
              width: `${attendancePercentage}%`,
            }}
          />

          <div
            className="attendance-required-marker"
            style={{
              left: `${requiredAttendance}%`,
            }}
          />

        </div>

        <div className="attendance-progress-labels">

          <span>0%</span>

          <span className="minimum-label">
            Minimum Required:{" "}
            {requiredAttendance}%
          </span>

          <span>100%</span>

        </div>

      </div>

      {/* =================================================
         ATTENDANCE HISTORY
      ================================================= */}

      <div className="attendance-history-card">

        <div className="attendance-history-header">

          <div className="attendance-history-title">

            <div className="history-title-icon">
              <Clock size={21} />
            </div>

            <div>

              <h3>
                Attendance History
              </h3>

              <p>
                {student?.name
                  ? `${student.name}'s class attendance records`
                  : "Your class attendance records"}
              </p>

            </div>

          </div>

          <div className="attendance-history-meta">

            {batchName !== "Not Assigned" && (
              <div className="attendance-batch-info">

                <div className="batch-info-text">

                  <span className="batch-info-label">
                    BATCH
                  </span>

                  <strong>
                    {batchName}
                    {batchCode
                      ? ` • ${batchCode}`
                      : ""}
                  </strong>

                  {batchTiming && (
                    <small>
                      {batchTiming}
                    </small>
                  )}

                </div>

              </div>
            )}

            <span className="attendance-record-count">
              {attendanceData.length}{" "}
              {attendanceData.length === 1
                ? "Record"
                : "Records"}
            </span>

          </div>

        </div>

        <div className="attendance-table-wrapper">

          <table className="attendance-table">

            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {attendanceData.length === 0 ? (

                <tr>
                  <td colSpan="3">

                    <div className="attendance-empty-state">

                      <CalendarDays size={34} />

                      <div>
                        <h4>
                          No attendance records found
                        </h4>

                        <p>
                          Your attendance history will
                          appear here once attendance is
                          marked.
                        </p>
                      </div>

                    </div>

                  </td>
                </tr>

              ) : (

                attendanceData.map((record) => {

                  const isPresent =
                    String(record.status)
                      .toUpperCase() ===
                    "PRESENT";

                  return (
                    <tr
                      key={
                        record._id ||
                        `${record.date}-${record.status}`
                      }
                    >

                      <td>
                        {formatDate(record.date)}
                      </td>

                      <td>
                        {getDay(record.date)}
                      </td>

                      <td>

                        <span
                          className={`attendance-status ${
                            isPresent
                              ? "present"
                              : "absent"
                          }`}
                        >

                          {isPresent ? (
                            <CheckCircle2 size={15} />
                          ) : (
                            <XCircle size={15} />
                          )}

                          {isPresent
                            ? "Present"
                            : "Absent"}

                        </span>

                      </td>

                    </tr>
                  );
                })

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};

export default Attendance;