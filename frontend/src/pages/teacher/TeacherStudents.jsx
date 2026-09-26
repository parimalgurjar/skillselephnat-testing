import { useEffect, useMemo, useState } from "react";
import { Search, Users, Mail, MoreVertical, TrendingUp } from "lucide-react";

import api from "../../services/api";
import "./TeacherStudents.css";

const TeacherStudents = () => {
  const [search, setSearch] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("All");
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     FORMAT SINGLE TIME
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

  /* =====================================================
     FORMAT BATCH TIMING
  ===================================================== */
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

  /* =====================================================
     GET BATCH LABEL
  ===================================================== */
  const getBatchLabel = (batch) => {
    if (!batch) {
      return "Unnamed Batch";
    }

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

  /* =====================================================
     GET STUDENT BATCH ID
  ===================================================== */
  const getStudentBatchId = (student) => {
    if (!student) {
      return "";
    }

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

  /* =====================================================
     GET STUDENT BATCH DISPLAY
  ===================================================== */
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

  /* =====================================================
     FETCH STUDENTS + ACTUAL ASSIGNED BATCHES
  ===================================================== */
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const [studentsResponse, batchesResponse] = await Promise.all([
          api.get("/teachers/my-students"),
          api.get("/batches/public"),
        ]);

        if (studentsResponse.data?.success) {
          setStudents(
            Array.isArray(studentsResponse.data.students)
              ? studentsResponse.data.students
              : []
          );
        } else {
          setStudents([]);
        }

        setBatches(
          Array.isArray(batchesResponse.data?.batches)
            ? batchesResponse.data.batches
            : []
        );
      } catch (error) {
        console.error(
          "Fetch Students Error:",
          error.response?.data || error
        );

        setError(
          error.response?.data?.message || "Unable to fetch students"
        );

        setStudents([]);
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  /* =====================================================
     FILTER STUDENTS
  ===================================================== */
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const studentName = student.name || "";
      const studentEmail = student.email || "";
      const studentPhone = student.phone || "";

      const matchesSearch =
        studentName.toLowerCase().includes(search.toLowerCase()) ||
        studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        studentPhone.toLowerCase().includes(search.toLowerCase());

      const studentBatchId = getStudentBatchId(student);

      const matchesBatch =
        selectedBatchId === "All" || studentBatchId === selectedBatchId;

      return matchesSearch && matchesBatch;
    });
  }, [students, search, selectedBatchId]);

  /* =====================================================
     CALCULATIONS
  ===================================================== */
  const totalStudents = filteredStudents.length;

  const activeStudents = filteredStudents.filter(
    (student) => student.isActive === true && student.status === "ACTIVE"
  ).length;

  const averageAttendance =
    filteredStudents.length > 0
      ? Math.round(
          filteredStudents.reduce(
            (total, student) => total + (Number(student.attendance) || 0),
            0
          ) / filteredStudents.length
        )
      : 0;

  const averagePerformance =
    filteredStudents.length > 0
      ? Math.round(
          filteredStudents.reduce(
            (total, student) => total + (Number(student.performance) || 0),
            0
          ) / filteredStudents.length
        )
      : 0;

  /* =====================================================
     STUDENT STATUS
  ===================================================== */
  const getStudentStatus = (student) => {
    if (student.isActive === false || student.status === "INACTIVE") {
      return "Inactive";
    }

    if (
      student.attendance !== undefined &&
      Number(student.attendance) < 75
    ) {
      return "Needs Attention";
    }

    if (
      student.performance !== undefined &&
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

  return (
    <div className="teacher-students-page">
      {/* ================= HEADER ================= */}
      <div className="teacher-students-header">
        <div>
          <span className="teacher-page-label">EDUCATOR PORTAL</span>
          <h1>Students</h1>
          <p>Manage and track your students' learning progress.</p>
        </div>

        <div className="students-total-card">
          <Users size={20} />
          <div>
            <strong>{totalStudents}</strong>
            <span>Total Students</span>
          </div>
        </div>
      </div>

      {/* ================= OVERVIEW ================= */}
      <div className="students-overview-grid">
        <div className="student-overview-card">
          <span>Total Students</span>
          <strong>{totalStudents}</strong>
          <small>Across all batches</small>
        </div>

        <div className="student-overview-card">
          <span>Active Students</span>
          <strong>{activeStudents}</strong>
          <small className="green-text">Currently active</small>
        </div>

        <div className="student-overview-card">
          <span>Average Attendance</span>
          <strong>{averageAttendance}%</strong>
          <small>Overall attendance</small>
        </div>

        <div className="student-overview-card">
          <span>Avg. Performance</span>
          <strong>{averagePerformance}%</strong>
          <small className="yellow-text">Overall student progress</small>
        </div>
      </div>

      {/* ================= TABLE CARD ================= */}
      <div className="students-table-card">
        <div className="students-table-header">
          <div>
            <h2>All Students</h2>
            <p>View and manage your assigned students</p>
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
              <option value="All">All Batches</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {getBatchLabel(batch)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ================= TABLE ================= */}
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
                <th></th>
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
                            <strong>{student.name}</strong>
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
                            {student.attendance !== undefined
                              ? `${student.attendance}%`
                              : "-"}
                          </span>
                        </div>
                      </td>

                      {/* PERFORMANCE */}
                      <td>
                        <div className="performance-value">
                          <TrendingUp size={14} />
                          {student.performance !== undefined
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

                      {/* ACTION */}
                      <td>
                        <button className="student-more-btn" type="button">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
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

        {/* ================= FOOTER ================= */}
        <div className="students-table-footer">
          <span>
            Showing {filteredStudents.length} of {students.length} students
          </span>
        </div>
      </div>
    </div>
  );
};

export default TeacherStudents;