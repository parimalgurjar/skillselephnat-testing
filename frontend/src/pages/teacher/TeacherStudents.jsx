
import { useEffect, useMemo, useState } from "react";
import { Search, Users, Mail, TrendingUp } from "lucide-react";

import api from "../../services/api";
import "./TeacherStudents.css";

/* =====================================================
   COMMON HELPERS
===================================================== */

const formatSingleTime = (time) => {
  if (!time) return "";

  const cleanedTime = time.toString().trim().replace(".", ":");
  const parts = cleanedTime.split(":");

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || "0", 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const formatBatchTiming = (timing) => {
  if (!timing) return "-";

  const value = timing.toString().trim();

  if (value.includes("-")) {
    const parts = value.split("-");

    if (parts.length === 2) {
      return `${formatSingleTime(parts[0])} - ${formatSingleTime(parts[1])}`;
    }
  }

  if (value.includes(".") && value.includes(":")) {
    const [startHour, endTime] = value.split(":");
    const endParts = endTime.split(".");

    if (endParts.length === 2) {
      const start = `${startHour}:00`;
      const end = `${endParts[0]}:${endParts[1]}`;

      return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;
    }
  }

  return formatSingleTime(value);
};

const getBatchLabel = (batch) => {
  if (!batch) return "Unnamed Batch";

  const batchTiming =
    batch.batchTiming ||
    (batch.startTime && batch.endTime
      ? `${batch.startTime} - ${batch.endTime}`
      : "");

  const formattedTiming = formatBatchTiming(batchTiming);

  if (batch.name && batchTiming) {
    return `${batch.name} (${formattedTiming})`;
  }

  if (batch.code && batchTiming) {
    return `${batch.code} (${formattedTiming})`;
  }

  return batch.name || batch.code || formattedTiming || "Unnamed Batch";
};

const getStudentBatchId = (student) => {
  if (!student) return "";

  if (student.batch?._id) {
    return student.batch._id.toString();
  }

  if (
    student.batchId &&
    typeof student.batchId === "object" &&
    student.batchId._id
  ) {
    return student.batchId._id.toString();
  }

  if (student.batchId) {
    return student.batchId.toString();
  }

  return "";
};

const getStudentBatchDisplay = (student) => {
  if (student.batch) {
    return getBatchLabel(student.batch);
  }

  if (student.batchId && typeof student.batchId === "object") {
    return getBatchLabel(student.batchId);
  }

  if (student.batchTiming) {
    return formatBatchTiming(student.batchTiming);
  }

  return "-";
};

const isStudentActive = (student) => {
  return (
    student.isActive === true &&
    student.status === "ACTIVE"
  );
};

/* =====================================================
   TEACHER STUDENTS
===================================================== */

const TeacherStudents = () => {
  const [search, setSearch] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("All");
  const [metricFilter, setMetricFilter] = useState("all");

  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     FETCH STUDENTS + ASSIGNED BATCHES
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/teachers/my-students");

        if (!response.data?.success) {
          throw new Error("Unable to fetch students");
        }

        if (!mounted) return;

        setStudents(
          Array.isArray(response.data.students)
            ? response.data.students
            : []
        );

        setBatches(
          Array.isArray(response.data.batches)
            ? response.data.batches
            : []
        );

      } catch (error) {
        console.error(
          "Fetch Students Error:",
          error.response?.data || error
        );

        if (!mounted) return;

        setError(
          error.response?.data?.message ||
          error.message ||
          "Unable to fetch students"
        );

        setStudents([]);
        setBatches([]);

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchStudents();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     BASE FILTER - SEARCH + BATCH
  ===================================================== */

  const matchingStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const studentName = (student.name || "").toLowerCase();
      const studentEmail = (student.email || "").toLowerCase();
      const studentPhone = (student.phone || "").toLowerCase();

      const matchesSearch =
        studentName.includes(query) ||
        studentEmail.includes(query) ||
        studentPhone.includes(query);

      const studentBatchId = getStudentBatchId(student);

      const matchesBatch =
        selectedBatchId === "All" ||
        studentBatchId === selectedBatchId;

      return matchesSearch && matchesBatch;
    });
  }, [students, search, selectedBatchId]);

  /* =====================================================
     CARD CLICK FILTER
  ===================================================== */

  const filteredStudents = useMemo(() => {
    return matchingStudents.filter((student) => {

      if (metricFilter === "active") {
        return isStudentActive(student);
      }

      if (metricFilter === "attendance") {
        return (
          student.attendance != null &&
          Number(student.attendance) < 90
        );
      }

      if (metricFilter === "performance") {
        return (
          student.performance != null &&
          Number(student.performance) < 70
        );
      }

      return true;
    });
  }, [matchingStudents, metricFilter]);

  /* =====================================================
     DYNAMIC STATISTICS
  ===================================================== */

  const totalStudents = matchingStudents.length;

  const activeStudents = matchingStudents.filter(
    isStudentActive
  ).length;

  const attendanceStudents = matchingStudents.filter(
    (student) => student.attendance != null
  );

  const performanceStudents = matchingStudents.filter(
    (student) => student.performance != null
  );

  const averageAttendance =
    attendanceStudents.length > 0
      ? Math.round(
          attendanceStudents.reduce(
            (total, student) =>
              total + Number(student.attendance),
            0
          ) / attendanceStudents.length
        )
      : 0;

  const averagePerformance =
    performanceStudents.length > 0
      ? Math.round(
          performanceStudents.reduce(
            (total, student) =>
              total + Number(student.performance),
            0
          ) / performanceStudents.length
        )
      : 0;

  /* =====================================================
     TABLE HEADING
  ===================================================== */

  const tableHeading = {
    all: "All Students",
    active: "Active Students",
    attendance: "Students Below 90% Attendance",
    performance: "Students Below 70% Performance",
  };

  /* =====================================================
     STUDENT STATUS
  ===================================================== */

  const getStudentStatus = (student) => {
    if (
      student.isActive === false ||
      student.status === "INACTIVE"
    ) {
      return "Inactive";
    }

    if (
      student.attendance != null &&
      Number(student.attendance) < 90
    ) {
      return "Needs Attention";
    }

    if (
      student.performance != null &&
      Number(student.performance) < 70
    ) {
      return "Needs Attention";
    }

    return "Active";
  };

  /* =====================================================
     STUDENT ID
  ===================================================== */

  const getStudentId = (student, index) => {
    if (student.studentId) {
      return student.studentId;
    }

    return `SE-${String(index + 1).padStart(4, "0")}`;
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="teacher-students-page">
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading students...
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <div className="teacher-students-page">
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#dc2626",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  /* =====================================================
     MAIN UI
  ===================================================== */

  return (
    <div className="teacher-students-page">

      {/* HEADER */}

      <div className="teacher-students-header">
        <div>
          <span className="teacher-page-label">
            EDUCATOR PORTAL
          </span>

          <h1>Students</h1>

          <p>
            Manage and track your students' learning progress.
          </p>
        </div>

        <div className="students-total-card">
          <Users size={20} />

          <div>
            <strong>{totalStudents}</strong>
            <span>Total Students</span>
          </div>
        </div>
      </div>

      {/* STATISTICS CARDS */}

      <div className="students-overview-grid">

        {/* TOTAL STUDENTS */}

        <button
          type="button"
          className={`student-overview-card ${
            metricFilter === "all" ? "selected" : ""
          }`}
          onClick={() => setMetricFilter("all")}
          aria-pressed={metricFilter === "all"}
        >
          <span>Total Students</span>
          <strong>{totalStudents}</strong>
          <small>Across all assigned batches</small>
        </button>

        {/* ACTIVE STUDENTS */}

        <button
          type="button"
          className={`student-overview-card ${
            metricFilter === "active" ? "selected" : ""
          }`}
          onClick={() => setMetricFilter("active")}
          aria-pressed={metricFilter === "active"}
        >
          <span>Active Students</span>
          <strong>{activeStudents}</strong>

          <small className="green-text">
            Currently active
          </small>
        </button>

        {/* ATTENDANCE */}

        <button
          type="button"
          className={`student-overview-card ${
            metricFilter === "attendance" ? "selected" : ""
          }`}
          onClick={() => setMetricFilter("attendance")}
          aria-pressed={metricFilter === "attendance"}
        >
          <span>Average Attendance</span>
          <strong>{averageAttendance}%</strong>

          <small>
            Click to view below 90%
          </small>
        </button>

        {/* PERFORMANCE */}

        <button
          type="button"
          className={`student-overview-card ${
            metricFilter === "performance" ? "selected" : ""
          }`}
          onClick={() => setMetricFilter("performance")}
          aria-pressed={metricFilter === "performance"}
        >
          <span>Avg. Performance</span>
          <strong>{averagePerformance}%</strong>

          <small className="yellow-text">
            Click to view below 70%
          </small>
        </button>

      </div>

      {/* STUDENTS TABLE */}

      <div className="students-table-card">

        {/* TABLE HEADER */}

        <div className="students-table-header">

          <div>
            <h2>
              {tableHeading[metricFilter]}
            </h2>

            <p>
              View and manage your assigned students
            </p>
          </div>

          <div className="students-actions">

            {/* SEARCH */}

            <div className="student-search-box">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* BATCH FILTER */}

            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              <option value="All">
                All Batches
              </option>

              {batches.map((batch) => (
                <option
                  key={batch._id}
                  value={batch._id}
                >
                  {getBatchLabel(batch)}
                </option>
              ))}
            </select>

          </div>
        </div>

        {/* TABLE */}

        <div className="students-table-wrapper">

          <table className="students-table">

            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Batch</th>
                <th>Attendance</th>
                <th>Performance</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {filteredStudents.length > 0 ? (

                filteredStudents.map((student, index) => {

                  const status = getStudentStatus(student);

                  return (
                    <tr key={student._id}>

                      {/* STUDENT */}

                      <td>
                        <div className="student-table-profile">

                          <div className="student-table-avatar">
                            {student.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>

                          <div>
                            <strong>
                              {student.name || "Unnamed Student"}
                            </strong>

                            <span>
                              <Mail size={11} />
                              {student.email || "No email"}
                            </span>
                          </div>

                        </div>
                      </td>

                      {/* STUDENT ID */}

                      <td>
                        <span className="student-id">
                          {getStudentId(student, index)}
                        </span>
                      </td>

                      {/* BATCH */}

                      <td>
                        <span className="student-batch">
                          {getStudentBatchDisplay(student)}
                        </span>
                      </td>

                      {/* ATTENDANCE */}

                      <td>
                        <div className="attendance-value">
                          <span>
                            {student.attendance != null
                              ? `${student.attendance}%`
                              : "-"}
                          </span>
                        </div>
                      </td>

                      {/* PERFORMANCE */}

                      <td>
                        <div className="performance-value">
                          <TrendingUp size={14} />

                          {student.performance != null
                            ? `${student.performance}%`
                            : "-"}
                        </div>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`student-status ${
                            status === "Active"
                              ? "active"
                              : status === "Inactive"
                              ? "inactive"
                              : "attention"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                    </tr>
                  );
                })

              ) : (

                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                    }}
                  >
                    No students found
                  </td>
                </tr>

              )}

            </tbody>
          </table>

        </div>

        {/* TABLE FOOTER */}

        <div className="students-table-footer">
          <span>
            Showing {filteredStudents.length} of {matchingStudents.length} students
          </span>
        </div>

      </div>
    </div>
  );
};

export default TeacherStudents;
