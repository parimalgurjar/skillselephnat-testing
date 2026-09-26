import {
  useEffect,
  useState,
} from "react";

import {
  Users,
  UserCheck,
  ClipboardCheck,
  TrendingUp,
  ArrowUpRight,
  Download,
  BarChart3,
  Award,
  Loader2,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";

import "./AdminReports.css";

const AdminReports = () => {
  /* =====================================================
     STATE
  ===================================================== */

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =====================================================
     FETCH REPORT DATA
  ===================================================== */

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/dashboard/admin-reports"
        );

      if (
        response.data?.success
      ) {
        setReport(
          response.data
        );
      } else {
        setError(
          response.data?.message ||
            "Unable to load reports"
        );
      }
    } catch (error) {
      console.error(
        "Admin Reports Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load reports"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchReports();
  }, []);

  /* =====================================================
     DOWNLOAD REPORT
  ===================================================== */

  const handleDownload = () => {
    window.print();
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="admin-reports-page">

        <div className="admin-reports-loading">

          <Loader2
            size={34}
            className="reports-spinner"
          />

          <p>
            Loading reports and analytics...
          </p>

        </div>

      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error && !report) {
    return (
      <div className="admin-reports-page">

        <div className="admin-reports-error-state">

          <AlertCircle size={38} />

          <h3>
            Unable to Load Reports
          </h3>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={fetchReports}
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  const stats =
    report?.stats || {};

  const monthlyData =
    report?.monthlyData || [];

  const batchPerformance =
    report?.batchPerformance || [];

  const insights =
    report?.insights || {};

  return (
    <div className="admin-reports-page">

      {/* =============================================
          HEADER
      ============================================= */}

      <div className="admin-reports-header">

        <div>

          <span className="admin-page-label">
            ADMIN PORTAL
          </span>

          <h1>
            Reports & Analytics
          </h1>

          <p>
            Track institute performance and
            student learning progress.
          </p>

        </div>

        <button
          type="button"
          className="download-report-btn"
          onClick={handleDownload}
        >

          <Download size={17} />

          Download Report

        </button>

      </div>

      {/* =============================================
          ERROR MESSAGE
      ============================================= */}

      {error && (
        <div className="reports-inline-error">

          <AlertCircle size={17} />

          <span>
            {error}
          </span>

        </div>
      )}

      {/* =============================================
          STATS
      ============================================= */}

      <div className="report-stats-grid">

        {/* TOTAL STUDENTS */}

        <div className="report-stat-card">

          <div className="report-stat-icon navy">

            <Users size={21} />

          </div>

          <div>

            <span>
              Total Students
            </span>

            <strong>
              {stats.totalStudents || 0}
            </strong>

            <small>
              Across all batches
            </small>

          </div>

        </div>

        {/* ATTENDANCE */}

        <div className="report-stat-card">

          <div className="report-stat-icon green">

            <UserCheck size={21} />

          </div>

          <div>

            <span>
              Avg Attendance
            </span>

            <strong>
              {stats.averageAttendance || 0}%
            </strong>

            <small
              className="positive-growth"
            >

              <ArrowUpRight
                size={11}
              />

              Overall attendance

            </small>

          </div>

        </div>

        {/* TASK COMPLETION */}

        <div className="report-stat-card">

          <div className="report-stat-icon yellow">

            <ClipboardCheck
              size={21}
            />

          </div>

          <div>

            <span>
              Task Completion
            </span>

            <strong>
              {stats.taskCompletion || 0}%
            </strong>

            <small>
              Approved submissions
            </small>

          </div>

        </div>

        {/* OVERALL PERFORMANCE */}

        <div className="report-stat-card">

          <div className="report-stat-icon purple">

            <Award size={21} />

          </div>

          <div>

            <span>
              Overall Performance
            </span>

            <strong>
              {stats.overallPerformance || 0}%
            </strong>

            <small
              className="positive-growth"
            >

              <TrendingUp
                size={11}
              />

              Institute performance

            </small>

          </div>

        </div>

      </div>

      {/* =============================================
          CHARTS ROW
      ============================================= */}

      <div className="reports-charts-grid">

        {/* MONTHLY PERFORMANCE */}

        <div className="report-chart-card">

          <div className="report-card-title">

            <div>

              <h2>
                Monthly Performance
              </h2>

              <p>
                Overall performance based on
                attendance and approved tasks.
              </p>

            </div>

            <div className="chart-icon">

              <TrendingUp
                size={19}
              />

            </div>

          </div>

          <div className="performance-chart">

            {monthlyData.map(
              (item) => (

                <div
                  className="chart-column"
                  key={item.month}
                >

                  <span className="chart-value">

                    {item.value}%

                  </span>

                  <div className="chart-bar-wrapper">

                    <div
                      className="chart-bar"
                      style={{
                        height: `${item.value}%`,
                      }}
                    />

                  </div>

                  <span className="chart-month">

                    {item.month}

                  </span>

                </div>

              )
            )}

          </div>

        </div>

        {/* =============================================
            QUICK INSIGHTS
        ============================================= */}

        <div className="report-insights-card">

          <div className="report-card-title">

            <div>

              <h2>
                Quick Insights
              </h2>

              <p>
                Current institute performance
                highlights.
              </p>

            </div>

            <div className="chart-icon">

              <BarChart3
                size={19}
              />

            </div>

          </div>

          <div className="insights-list">

            {/* BEST BATCH */}

            <div className="insight-item">

              <div className="insight-indicator green" />

              <div>

                <strong>
                  Best Performing Batch
                </strong>

                <span>

                  {insights.bestBatch
                    ? `${insights.bestBatch.batch} with ${insights.bestBatch.performance}% overall performance.`
                    : "No batch performance data available."}

                </span>

              </div>

            </div>

            {/* PENDING TASKS */}

            <div className="insight-item">

              <div className="insight-indicator yellow" />

              <div>

                <strong>
                  Pending Task Completion
                </strong>

                <span>

                  {insights.pendingTaskStudents ||
                    0} students have tasks awaiting approval or completion.

                </span>

              </div>

            </div>

            {/* ATTENDANCE */}

            <div className="insight-item">

              <div className="insight-indicator red" />

              <div>

                <strong>
                  Attendance Alert
                </strong>

                <span>

                  {insights.lowestAttendanceBatch
                    ? `${insights.lowestAttendanceBatch.batch} has the lowest attendance at ${insights.lowestAttendanceBatch.attendance}%.`
                    : "No attendance alerts available."}

                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =============================================
          BATCH PERFORMANCE
      ============================================= */}

      <div className="batch-performance-card">

        <div className="batch-performance-header">

          <div>

            <h2>
              Batch Performance Overview
            </h2>

            <p>
              Compare attendance and approved
              task completion across batches.
            </p>

          </div>

        </div>

        <div className="batch-performance-table-wrapper">

          {batchPerformance.length ===
          0 ? (

            <div className="reports-empty-state">

              <BarChart3 size={38} />

              <h3>
                No Batch Data Available
              </h3>

              <p>
                Create batches and add students
                to view performance analytics.
              </p>

            </div>

          ) : (

            <table className="batch-performance-table">

              <thead>

                <tr>

                  <th>
                    Batch
                  </th>

                  <th>
                    Total Students
                  </th>

                  <th>
                    Attendance
                  </th>

                  <th>
                    Task Completion
                  </th>

                  <th>
                    Performance
                  </th>

                </tr>

              </thead>

              <tbody>

                {batchPerformance.map(
                  (batch) => (

                    <tr
                      key={batch._id}
                    >

                      {/* BATCH */}

                      <td>

                        <div className="batch-name">

                          <div className="batch-icon">

                            <Users
                              size={16}
                            />

                          </div>

                          <div>

                            <strong>
                              {batch.batch}
                            </strong>

                            {batch.batchTiming && (

                              <span className="batch-timing">

                                {batch.batchTiming}

                              </span>

                            )}

                          </div>

                        </div>

                      </td>

                      {/* STUDENTS */}

                      <td>

                        {batch.students}

                      </td>

                      {/* ATTENDANCE */}

                      <td>

                        <div className="table-progress">

                          <div className="table-progress-bar">

                            <div
                              className="attendance-progress"
                              style={{
                                width: `${batch.attendance}%`,
                              }}
                            />

                          </div>

                          <strong>

                            {batch.attendance}%

                          </strong>

                        </div>

                      </td>

                      {/* TASK COMPLETION */}

                      <td>

                        <div className="table-progress">

                          <div className="table-progress-bar">

                            <div
                              className="completion-progress"
                              style={{
                                width: `${batch.completion}%`,
                              }}
                            />

                          </div>

                          <strong>

                            {batch.completion}%

                          </strong>

                        </div>

                      </td>

                      {/* PERFORMANCE */}

                      <td>

                        <span
                          className={`performance-badge ${
                            batch.performance >=
                            85
                              ? "excellent"
                              : batch.performance >=
                                75
                              ? "good"
                              : "average"
                          }`}
                        >

                          {batch.performance >=
                          85
                            ? "Excellent"
                            : batch.performance >=
                              75
                            ? "Good"
                            : "Needs Improvement"}

                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </div>
  );
};

export default AdminReports;