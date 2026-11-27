
import { useEffect, useState } from "react";

import {
  CalendarDays,
  Users,
  UserCheck,
  UserX,
  Search,
  Download,
  Clock,
  ChevronDown,
  Check,
  CheckCircle2, XCircle, Save,
  
  X,
} from "lucide-react";

import {
  formatSingleTime,
  formatBatchTimingString,
  getBatchLabel as getCommonBatchLabel,
} from "../../utils/batchUtils";

import api from "../../services/api";
import AlertModal from "../../components/common/AlertModal";
import ProfileAvatar from "../../components/common/ProfileAvatar";
import "./AdminAttendance.css";
import { exportAttendanceReport } from "../../services/attendanceApi";
const AdminAttendance = () => {
  /* GET TODAY DATE */
  const getTodayDate = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /* FORMAT BATCH TIMING */
  const formatBatchTiming = (batch) => {
    if (!batch) return "";

    if (batch.displayTiming) {
      return formatBatchTimingString(batch.displayTiming);
    }

    if (batch.batchTiming) {
      return formatBatchTimingString(batch.batchTiming);
    }

    if (batch.startTime && batch.endTime) {
      return `${formatSingleTime(batch.startTime)} - ${formatSingleTime(
        batch.endTime
      )}`;
    }

    return "";
  };

 
/* GET BATCH LABEL */

const getBatchLabel = (batch) => {
  if (!batch) return "Unnamed Batch";

  return getCommonBatchLabel(batch);
};


  /* STATES */
  const [selectedBatchId, setSelectedBatchId] = useState("All");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);

  const [alert, setAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    leaveToday: 0,
    averageAttendance: 0,
  });

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [savingRecordId, setSavingRecordId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
// ADMIN BULK ATTENDANCE FORM
const [attendanceFormOpen, setAttendanceFormOpen] = useState(false);
const [attendanceStudents, setAttendanceStudents] = useState([]);
const [attendanceLoading, setAttendanceLoading] = useState(false);
const [attendanceSaving, setAttendanceSaving] = useState(false);
const [attendanceFormError, setAttendanceFormError] = useState("");
// ATTENDANCE EXPORT STATES
const [exportModalOpen, setExportModalOpen] = useState(false);

const [exportStartDate, setExportStartDate] = useState(selectedDate);
const [exportEndDate, setExportEndDate] = useState(selectedDate);
const [exportBatchId, setExportBatchId] = useState(selectedBatchId);

const [exportLoading, setExportLoading] = useState(false);
const loadAttendanceStudents = async () => {
  if (!selectedBatchId || selectedBatchId === "All") {
    setAlert({
      isOpen: true,
      type: "warning",
      title: "Select a Batch",
      message: "Please select a specific batch before marking attendance.",
    });
    return;
  }

  try {
    setAttendanceLoading(true);
    setAttendanceFormError("");
    setAttendanceFormOpen(true);

    const response = await api.get("/attendance/my-students", {
      params: {
        batchId: selectedBatchId,
        date: selectedDate,
      },
    });

    const students = response.data?.students || [];

    setAttendanceStudents(
      students.map((student) => {
        const approvedLeave = Boolean(
          student.isApprovedLeave ||
          student.attendanceStatus === "LEAVE"
        );

        return {
          ...student,
          attendanceStatus: approvedLeave
            ? "LEAVE"
            : String(student.attendanceStatus || "PRESENT").toUpperCase(),
          isApprovedLeave: approvedLeave,
        };
      })
    );
  } catch (error) {
    setAttendanceFormError(
      error.response?.data?.message ||
      "Unable to load students for attendance."
    );
    setAttendanceStudents([]);
  } finally {
    setAttendanceLoading(false);
  }
};

const updateBulkAttendanceStatus = (studentId, status) => {
  setAttendanceStudents((previous) =>
    previous.map((student) =>
      String(student._id) === String(studentId)
        ? { ...student, attendanceStatus: status }
        : student
    )
  );
};

const markAllStudentsPresent = () => {
  setAttendanceStudents((previous) =>
    previous.map((student) => ({
      ...student,
      attendanceStatus: student.isApprovedLeave
        ? "LEAVE"
        : "PRESENT",
    }))
  );
};

const saveBulkAttendance = async () => {
  if (
    !selectedBatchId ||
    selectedBatchId === "All" ||
    attendanceStudents.length === 0
  ) {
    setAttendanceFormError("Select a batch with active students first.");
    return;
  }

  try {
    setAttendanceSaving(true);
    setAttendanceFormError("");

    const attendance = attendanceStudents.map((student) => ({
      studentId: student._id,
      status: student.isApprovedLeave
        ? "LEAVE"
        : String(student.attendanceStatus || "PRESENT").toUpperCase(),
    }));

    const response = await api.post("/attendance/mark", {
      batchId: selectedBatchId,
      date: selectedDate,
      attendance,
    });

    setAttendanceFormOpen(false);
    setAttendanceStudents([]);
    setRefreshKey((previous) => previous + 1);

    setAlert({
      isOpen: true,
      type: "success",
      title: "Attendance Saved",
      message: response.data?.message || "Attendance saved successfully.",
    });
  } catch (error) {
    setAttendanceFormError(
      error.response?.data?.message ||
      "Unable to save attendance. Please try again."
    );
  } finally {
    setAttendanceSaving(false);
  }
};
  /* FETCH BATCHES */
  useEffect(() => {
    let active = true;

    const fetchBatches = async () => {
      try {
        const response = await api.get("/attendance/my-batches");

        if (!active) return;

        setBatches(
          Array.isArray(response.data?.batches)
            ? response.data.batches
            : []
        );
      } catch (error) {
        if (!active) return;

        console.error(
          "Fetch batches error:",
          error.response?.data || error
        );

        setBatches([]);
      }
    };

    fetchBatches();

    return () => {
      active = false;
    };
  }, []);

  /* FETCH ATTENDANCE */
  useEffect(() => {
    let active = true;

    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          date: selectedDate,
        };

        if (selectedBatchId && selectedBatchId !== "All") {
          params.batchId = selectedBatchId;
        }

        if (search.trim()) {
          params.search = search.trim();
        }

        const response = await api.get("/attendance", {
          params,
        });

        if (!active) return;

        if (response.data?.success) {
          setAttendanceRecords(
            Array.isArray(response.data.records)
              ? response.data.records
              : []
          );
        } else {
          setAttendanceRecords([]);
        }
      } catch (error) {
        if (!active) return;

        console.error(
          "Fetch attendance error:",
          error.response?.data || error
        );

        setError(
          error.response?.data?.message ||
            "Unable to fetch attendance"
        );

        setAttendanceRecords([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchAttendance();

    return () => {
      active = false;
    };
  }, [selectedBatchId, selectedDate, search, refreshKey]);

  /* FETCH ATTENDANCE STATS */
  useEffect(() => {
    let active = true;

    const fetchStats = async () => {
      try {
        const params = {
          date: selectedDate,
        };

        if (selectedBatchId && selectedBatchId !== "All") {
          params.batchId = selectedBatchId;
        }

        const response = await api.get("/attendance/stats", {
          params,
        });

        if (!active) return;

        if (response.data?.success) {
          setStats({
            totalStudents: response.data.stats?.totalStudents || 0,
            presentToday: response.data.stats?.presentToday || 0,
            absentToday: response.data.stats?.absentToday || 0,
            leaveToday: response.data.stats?.leaveToday || 0,
            averageAttendance:
              response.data.stats?.averageAttendance || 0,
          });
        }
      } catch (error) {
        if (!active) return;

        console.error(
          "Fetch attendance stats error:",
          error.response?.data || error
        );
      }
    };

    fetchStats();

    return () => {
      active = false;
    };
  }, [selectedDate, selectedBatchId, refreshKey]);

  /* ADMIN UPDATE ATTENDANCE */
  const updateStudentAttendance = async (record, newStatus) => {
    if (!record?.batchId || !record?.student?._id) {
      setAlert({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: "Batch or student information is missing.",
      });
      return;
    }

    if (!["PRESENT", "ABSENT", "LEAVE"].includes(newStatus)) {
      return;
    }

    const recordDate = record.date;

    const date =
      typeof recordDate === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(recordDate)
        ? recordDate.slice(0, 10)
        : new Date(recordDate).toISOString().slice(0, 10);

    const batchId =
      typeof record.batchId === "object"
        ? record.batchId._id
        : record.batchId;

    try {
      setSavingRecordId(record._id);

      // Backend requires complete attendance list for the batch/date.
      const response = await api.get("/attendance/my-students", {
        params: {
          batchId,
          date,
        },
      });

      const students = response.data?.students || [];

      if (!students.length) {
        throw new Error("No students found in this batch.");
      }

      const attendance = students.map((student) => ({
        studentId: student._id,
        status:
          String(student._id) === String(record.student._id)
            ? newStatus
            : String(
                student.attendanceStatus || "PRESENT"
              ).toUpperCase(),
      }));

      await api.post("/attendance/mark", {
        batchId,
        date,
        attendance,
      });

      setAlert({
        isOpen: true,
        type: "success",
        title: "Attendance Updated",
        message: `${
          record.student.name || "Student"
        }'s attendance updated successfully.`,
      });

      setRefreshKey((previous) => previous + 1);
    } catch (error) {
      console.error("Admin Attendance Update Error:", error);

      setAlert({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message:
          error.response?.data?.message ||
          error.message ||
          "Unable to update attendance.",
      });
    } finally {
      setSavingRecordId(null);
    }
  };

  /* FORMAT DATE */
  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* GET RECORD BATCH OBJECT */
  const getRecordBatch = (record) => {
    if (record.batch && typeof record.batch === "object") {
      return record.batch;
    }

    if (
      record.batchId &&
      typeof record.batchId === "object"
    ) {
      return record.batchId;
    }

    return null;
  };

  /* GET RECORD BATCH LABEL */
  const getRecordBatchLabel = (record) => {
    const batch = getRecordBatch(record);

    if (batch) {
      return getBatchLabel(batch);
    }

    if (record.batchTiming) {
      return formatBatchTiming({
        batchTiming: record.batchTiming,
      });
    }

    return "-";
  };

  /* FILTER ATTENDANCE RECORDS */
  const filteredAttendanceRecords = attendanceRecords.filter(
    (record) => {
      const status = String(record.status || "").toUpperCase();

      if (statusFilter === "PRESENT") {
        return status === "PRESENT";
      }

      if (statusFilter === "ABSENT") {
        return status === "ABSENT";
      }

      if (statusFilter === "LEAVE") {
        return status === "LEAVE";
      }

      if (statusFilter === "AVERAGE") {
        return (
          status === "PRESENT" ||
          status === "ABSENT" ||
          status === "LEAVE"
        );
      }

      return true;
    }
  );

  /* EXPORT CSV */
  
const handleExport = async () => {
  if (!exportStartDate || !exportEndDate) {
    setAlert({
      isOpen: true,
      type: "warning",
      title: "Select Date Range",
      message: "Please select both start date and end date.",
    });
    return;
  }

  if (exportStartDate > exportEndDate) {
    setAlert({
      isOpen: true,
      type: "warning",
      title: "Invalid Date Range",
      message: "Start date cannot be greater than end date.",
    });
    return;
  }

  try {
    setExportLoading(true);

    const response = await exportAttendanceReport({
      batchId: exportBatchId,
      startDate: exportStartDate,
      endDate: exportEndDate,
    });

    const records = response.records || [];

    if (records.length === 0) {
      setAlert({
        isOpen: true,
        type: "warning",
        title: "No Records Found",
        message: "No attendance records found for the selected date range and batch.",
      });
      return;
    }

    const headers = [
      "Student Name",
      "Email",
      "Batch",
      "Batch Timing",
      "Date",
      "Status",
    ];

    const escapeCSVValue = (value) => {
      let text = String(value ?? "");

      // Prevent spreadsheet formula injection
      if (/^[=+\-@\t\r]/.test(text)) {
        text = "'" + text;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = records.map((record) => [
      record.studentName,
      record.email,
      record.batchName,
      record.batchTiming,
      formatDate(record.date),
      record.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSVValue).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const selectedBatch = batches.find(
      (batch) =>
        String(batch._id) === String(exportBatchId)
    );

    const batchName =
      exportBatchId === "All"
        ? "all-batches"
        : (selectedBatch?.name || selectedBatch?.code || "selected-batch")
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-|-$/g, "")
            .toLowerCase();

    link.href = url;
    link.download =
      `attendance-${batchName}-${exportStartDate}-to-${exportEndDate}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setExportModalOpen(false);

  } catch (error) {
    setAlert({
      isOpen: true,
      type: "error",
      title: "Export Failed",
      message: error.message || "Unable to export attendance.",
    });
  } finally {
    setExportLoading(false);
  }
};


  /* LOADING */
  if (loading) {
    return (
      <div className="admin-attendance-page">
        <div
          style={{
            padding: "50px",
            textAlign: "center",
          }}
        >
          Loading attendance...
        </div>
      </div>
    );
  }

  /* ERROR */
  if (error) {
    return (
      <div className="admin-attendance-page">
        <div
          style={{
            padding: "50px",
            textAlign: "center",
            color: "#dc2626",
          }}
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => {
              setError("");
              setRefreshKey((previous) => previous + 1);
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* RENDER */
  return (
    <div className="admin-attendance-page">
      {/* HEADER */}
      <div className="admin-attendance-header">
        <div>
          <span className="admin-page-label">
            ADMIN PORTAL
          </span>

          <h1>Attendance Management</h1>

          <p>
            Monitor student attendance across all batches.
          </p>
        </div>
<button
  type="button"
  className="attendance-export-btn"
  onClick={loadAttendanceStudents}
  style={{ background: "#011451", color: "#fff" }}
>
  <CalendarDays size={17} />
  Mark Attendance
</button>
        
<button
  type="button"
  className="attendance-export-btn"
  onClick={() => {
    setExportStartDate(selectedDate);
    setExportEndDate(selectedDate);
    setExportBatchId(selectedBatchId);
    setExportModalOpen(true);
  }}
>
  <Download size={17} />
  Export Report
</button>

      </div>

{/* ATTENDANCE EXPORT MODAL */}
{exportModalOpen && (
  <div
    className="attendance-export-overlay"
    onClick={() => {
      if (!exportLoading) setExportModalOpen(false);
    }}
  >
    <div
      className="attendance-export-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="attendance-export-modal-header">
        <div>
          <h2>Export Attendance Report</h2>
          <p>Select date range and batch to download attendance.</p>
        </div>

        <button
          type="button"
          className="attendance-export-close"
          disabled={exportLoading}
          onClick={() => setExportModalOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <div className="attendance-export-fields">

        <div className="attendance-export-field">
          <label>From Date</label>
          <input
            type="date"
            value={exportStartDate}
            max={exportEndDate || undefined}
            onChange={(e) =>
              setExportStartDate(e.target.value)
            }
          />
        </div>

        <div className="attendance-export-field">
          <label>To Date</label>
          <input
            type="date"
            value={exportEndDate}
            min={exportStartDate || undefined}
            onChange={(e) =>
              setExportEndDate(e.target.value)
            }
          />
        </div>

        <div className="attendance-export-field full">
          <label>Select Batch</label>

          <select
            value={exportBatchId}
            onChange={(e) =>
              setExportBatchId(e.target.value)
            }
          >
            <option value="All">All Batches</option>

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

      <div className="attendance-export-info">
        <Download size={17} />
        <span>
          CSV report will include Present, Absent and Leave records.
        </span>
      </div>

      <div className="attendance-export-modal-actions">
        <button
          type="button"
          className="attendance-export-cancel"
          disabled={exportLoading}
          onClick={() => setExportModalOpen(false)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="attendance-export-download"
          onClick={handleExport}
          disabled={exportLoading}
        >
          <Download size={16} />
          {exportLoading ? "Exporting..." : "Download CSV"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* STATS */}
      <div className="attendance-stats-grid">
        {/* TOTAL STUDENTS */}
        <button
          type="button"
          className={`attendance-stat-card ${
            statusFilter === "ALL" ? "selected" : ""
          }`}
          onClick={() => setStatusFilter("ALL")}
          aria-pressed={statusFilter === "ALL"}
        >
          <div className="attendance-stat-icon navy">
            <Users size={21} />
          </div>

          <div>
            <span>Total Students</span>
            <strong>{stats.totalStudents}</strong>
            <small>All attendance records</small>
          </div>
        </button>

        {/* PRESENT */}
        <button
          type="button"
          className={`attendance-stat-card ${
            statusFilter === "PRESENT" ? "selected" : ""
          }`}
          onClick={() => setStatusFilter("PRESENT")}
          aria-pressed={statusFilter === "PRESENT"}
        >
          <div className="attendance-stat-icon green">
            <UserCheck size={21} />
          </div>

          <div>
            <span>Present</span>
            <strong>{stats.presentToday}</strong>
            <small>On selected date</small>
          </div>
        </button>

        {/* ABSENT */}
        <button
          type="button"
          className={`attendance-stat-card ${
            statusFilter === "ABSENT" ? "selected" : ""
          }`}
          onClick={() => setStatusFilter("ABSENT")}
          aria-pressed={statusFilter === "ABSENT"}
        >
          <div className="attendance-stat-icon red">
            <UserX size={21} />
          </div>

          <div>
            <span>Absent</span>
            <strong>{stats.absentToday}</strong>
            <small>On selected date</small>
          </div>
        </button>

        {/* LEAVE */}
        <button
          type="button"
          className={`attendance-stat-card ${
            statusFilter === "LEAVE" ? "selected" : ""
          }`}
          onClick={() => setStatusFilter("LEAVE")}
          aria-pressed={statusFilter === "LEAVE"}
        >
          <div className="attendance-stat-icon yellow">
            <Clock size={21} />
          </div>

          <div>
            <span>Leave</span>
            <strong>{stats.leaveToday}</strong>
            <small>On selected date</small>
          </div>
        </button>

        {/* AVERAGE */}
        <button
          type="button"
          className={`attendance-stat-card ${
            statusFilter === "AVERAGE" ? "selected" : ""
          }`}
          onClick={() => setStatusFilter("AVERAGE")}
          aria-pressed={statusFilter === "AVERAGE"}
        >
          <div className="attendance-stat-icon yellow">
            <CalendarDays size={21} />
          </div>

          <div>
            <span>Average Attendance</span>
            <strong>{stats.averageAttendance}%</strong>
            <small>Present ÷ (Present + Absent + Leave)</small>
          </div>
        </button>
      </div>

{attendanceFormOpen && (
  <div className="attendance-modal-overlay">
    <div className="attendance-modal">

      {/* HEADER */}
      <div className="attendance-modal-header">
        <div>
          <span className="attendance-modal-eyebrow">
            ADMINISTRATION PORTAL
          </span>
          <h2>Mark Batch Attendance</h2>
          <p>
            Manage and update attendance for your students.
          </p>
        </div>

        <button
          type="button"
          className="attendance-modal-close"
          onClick={() => setAttendanceFormOpen(false)}
          disabled={attendanceSaving}
          aria-label="Close attendance"
        >
          ×
        </button>
      </div>

      {/* BATCH INFORMATION */}
      <div className="attendance-modal-info">
        <div>
          <span>SELECTED BATCH</span>
          <strong>
            {getBatchLabel(
              batches.find(
                (batch) =>
                  String(batch._id) === String(selectedBatchId)
              )
            )}
          </strong>
        </div>

        <div>
          <span>DATE</span>
          <strong>{selectedDate}</strong>
        </div>

        <div>
          <span>TOTAL STUDENTS</span>
          <strong>{attendanceStudents.length}</strong>
        </div>
      </div>

      {/* ERROR */}
      {attendanceFormError && (
        <div className="attendance-modal-error">
          {attendanceFormError}
        </div>
      )}

      {/* TOOLBAR */}
      {!attendanceLoading && (
        <div className="attendance-modal-toolbar">
          <div>
            <h3>Student Attendance</h3>
            <p>Select a status for each student.</p>
          </div>

          <button
            type="button"
            className="attendance-mark-all-btn"
            onClick={markAllStudentsPresent}
            disabled={attendanceSaving}
          >
            <CheckCircle2 size={17} />
            Mark All Present
          </button>
        </div>
      )}

      {/* STUDENT LIST */}
      <div className="attendance-modal-body">

        {attendanceLoading ? (
          <div className="attendance-modal-loading">
            Loading students...
          </div>
        ) : attendanceStudents.length === 0 ? (
          <div className="attendance-modal-empty">
            No students found in this batch.
          </div>
        ) : (
          attendanceStudents.map((student, index) => (
            <div
              className="attendance-modal-student"
              key={student._id}
            >
              <div className="attendance-student-details">
                <div className="attendance-student-avatar">
                  {student.name?.charAt(0)?.toUpperCase() || "S"}
                </div>

                <div className="attendance-student-text">
                  <strong>
                    {index + 1}. {student.name}
                  </strong>
                  <span>{student.email}</span>
                </div>
              </div>

              <div className="attendance-status-actions">
                {["PRESENT", "ABSENT", "LEAVE"].map((status) => {
                  const active =
                    student.attendanceStatus === status;

                  const disabled =
                    attendanceSaving ||
                    (student.isApprovedLeave && status !== "LEAVE");

                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={disabled}
                      className={`attendance-status-btn ${status.toLowerCase()} ${
                        active ? "active" : ""
                      }`}
                      onClick={() =>
                        updateBulkAttendanceStatus(
                          student._id,
                          status
                        )
                      }
                    >
                      {status === "PRESENT" && (
                        <CheckCircle2 size={15} />
                      )}
                      {status === "ABSENT" && (
                        <XCircle size={15} />
                      )}
                      {status === "LEAVE" && (
                        <Clock size={15} />
                      )}
                      {status.charAt(0) +
                        status.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER */}
      <div className="attendance-modal-footer">
        <span>
          {attendanceStudents.length} students in this batch
        </span>

        <div>
          <button
            type="button"
            className="attendance-cancel-btn"
            onClick={() => setAttendanceFormOpen(false)}
            disabled={attendanceSaving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="attendance-save-btn"
            onClick={saveBulkAttendance}
            disabled={
              attendanceSaving ||
              attendanceLoading ||
              attendanceStudents.length === 0
            }
          >
            <Save size={17} />
            {attendanceSaving
              ? "Saving..."
              : "Save Attendance"}
          </button>
        </div>
      </div>

    </div>
  </div>
)}

      {/* MAIN CARD */}
      <div className="attendance-management-card">
        {/* CARD HEADER */}
        <div className="attendance-card-header">
          <div>
            <h2>Daily Attendance</h2>

            <p>
              {statusFilter === "AVERAGE"
  ? "Showing Present, Absent and Leave records included in attendance calculation."
  : "View attendance records for selected date and batch."}
            </p>
          </div>

          {/* FILTERS */}
          <div className="attendance-filters">
            {/* BATCH FILTER */}
         {/* CUSTOM BATCH FILTER */}
<div className="attendance-batch-select">
  <button
    type="button"
    className={`attendance-batch-trigger ${
      batchDropdownOpen ? "active" : ""
    }`}
    onClick={() => setBatchDropdownOpen((prev) => !prev)}
  >
    <span className="attendance-batch-trigger-content">
      <span className="attendance-batch-trigger-label">
        {selectedBatchId === "All"
          ? "All Batches"
          : getBatchLabel(
              batches.find(
                (batch) =>
                  String(batch._id) === String(selectedBatchId)
              )
            )}
      </span>

      <span className="attendance-batch-trigger-subtitle">
        {selectedBatchId === "All"
          ? `${batches.length} batches available`
          : "Selected batch"}
      </span>
    </span>

    <ChevronDown
      size={18}
      className={batchDropdownOpen ? "rotated" : ""}
    />
  </button>

  {batchDropdownOpen && (
    <>
      <div
        className="attendance-dropdown-backdrop"
        onClick={() => setBatchDropdownOpen(false)}
      />

      <div className="attendance-batch-options">
        <button
          type="button"
          className={`attendance-batch-option ${
            selectedBatchId === "All" ? "selected" : ""
          }`}
          onClick={() => {
            setSelectedBatchId("All");
            setBatchDropdownOpen(false);
          }}
        >
          <span className="attendance-option-icon">A</span>

          <span className="attendance-option-text">
            <strong>All Batches</strong>
            <small>View attendance across all batches</small>
          </span>

          {selectedBatchId === "All" && (
            <Check size={17} className="attendance-option-check" />
          )}
        </button>

        {batches.map((batch) => {
          const isSelected =
            String(selectedBatchId) === String(batch._id);

          return (
            <button
              type="button"
              key={batch._id}
              className={`attendance-batch-option ${
                isSelected ? "selected" : ""
              }`}
              onClick={() => {
                setSelectedBatchId(batch._id);
                setBatchDropdownOpen(false);
              }}
            >
              <span className="attendance-option-icon">
                <Users size={17} />
              </span>

            <span className="attendance-option-text">
  <strong>
    {getBatchLabel(batch)}
  </strong>
</span>

              {isSelected && (
                <Check size={17} className="attendance-option-check" />
              )}
            </button>
          );
        })}
      </div>
    </>
  )}
</div>

            {/* DATE FILTER */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) =>
                setSelectedDate(e.target.value)
              }
            />
          </div>
        </div>

        {/* SEARCH */}
        <div className="attendance-search-row">
          <div className="attendance-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <span className="attendance-record-count">
            {filteredAttendanceRecords.length} Records Found
          </span>
        </div>

        {/* TABLE */}
        <div className="attendance-table-wrapper">
          <table className="admin-attendance-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Batch</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredAttendanceRecords.length > 0 ? (
                filteredAttendanceRecords.map((record) => {
                  const status = String(
                    record.status || ""
                  ).toUpperCase();

                  const isPresent = status === "PRESENT";
                  const isAbsent = status === "ABSENT";
                  const isLeave = status === "LEAVE";

                  return (
                    <tr key={record._id}>
                      {/* STUDENT */}
                      <td>
                        <div className="attendance-student-profile">
                          <ProfileAvatar
                            user={record.student}
                            size={39}
                            className="attendance-avatar"
                          />

                          <div>
                            <strong>
                              {record.student?.name ||
                                "Unknown Student"}
                            </strong>

                            <span>
                              {record.student?.email || "No email"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* BATCH */}
                      <td>
                        <span className="attendance-batch-badge">
                          {getRecordBatchLabel(record)}
                        </span>
                      </td>

                      {/* DATE */}
                      <td>{formatDate(record.date)}</td>

                      {/* EDITABLE STATUS */}
                      {/* CUSTOM STATUS DROPDOWN */}
                      <td>
                        <div
                          className="attendance-custom-dropdown"
                          onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                              setOpenStatusMenuId(null);
                            }
                          }}
                        >
                          <button
                            type="button"
                            className={`attendance-dropdown-trigger ${
                              isPresent
                                ? "present"
                                : isAbsent
                                  ? "absent"
                                 : isLeave
  ? "leave"
  : "not-marked"
                            }`}
                            disabled={savingRecordId !== null}
                            aria-haspopup="listbox"
                            aria-expanded={openStatusMenuId === record._id}
                            onClick={() =>
                              setOpenStatusMenuId((previous) =>
                                previous === record._id ? null : record._id
                              )
                            }
                          >
                            <span>
                             {isPresent
  ? "Present"
  : isAbsent
    ? "Absent"
    : isLeave
      ? "Leave"
      : "Not Marked"}
                            </span>

                            <ChevronDown
                              size={16}
                              className={
                                openStatusMenuId === record._id
                                  ? "rotated"
                                  : ""
                              }
                            />
                          </button>

                          {openStatusMenuId === record._id && (
                            <div
                              className="attendance-dropdown-menu"
                              role="listbox"
                            >
                              {[
                                {
                                  value: "PRESENT",
                                  label: "Present",
                                  className: "present",
                                },
                                {
                                  value: "ABSENT",
                                  label: "Absent",
                                  className: "absent",
                                },
                                {
                                  value: "LEAVE",
                                  label: "Leave",
                                  className: "leave",
                                },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  role="option"
                                  aria-selected={status === option.value}
                                  className={`attendance-dropdown-option ${
                                    option.className
                                  } ${
                                    status === option.value ? "active" : ""
                                  }`}
                                  onClick={() => {
                                    setOpenStatusMenuId(null);

                                    if (status !== option.value) {
                                      updateStudentAttendance(
                                        record,
                                        option.value
                                      );
                                    }
                                  }}
                                >
                                  <span className="attendance-option-indicator" />
                                  <span>{option.label}</span>

                                  {status === option.value && (
                                    <Check
                                      size={16}
                                      className="attendance-option-check"
                                    />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}

                          {savingRecordId === record._id && (
                            <small className="admin-attendance-saving">
                              Saving...
                            </small>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "35px",
                    }}
                  >
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={() =>
          setAlert((previous) => ({
            ...previous,
            isOpen: false,
          }))
        }
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </div>
  );
};

export default AdminAttendance;
