
import { useEffect, useState, useRef } from "react";
import {
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  Save,
  Search,
  Lock,
  Clock,
  Eye,
  ChevronDown,
  Check
} from "lucide-react";
import ProfileAvatar from "../../components/common/ProfileAvatar";
import api from "../../services/api";
import "./TeacherAttendance.css";
import {
  formatSingleTime,
  formatBatchTimingString,
} from "../../utils/batchUtils";

const DEFAULT_ATTENDANCE_META = {
  isMarked: false,
  markedBy: null,
  createdAt: null,
  editableUntil: null,
  isOwner: false,
  isLocked: false,
  canEdit: true,
};

// FORMAT STUDENT
const formatStudent = (student) => {
  const attendanceStatus = student.attendanceStatus;

  const isApprovedLeave = Boolean(
    student.isApprovedLeave ||
    attendanceStatus === "LEAVE"
  );

  return {
    ...student,
    id: student._id,
    initials: student.name
      ? student.name
          .split(" ")
          .map((word) => word.charAt(0))
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "ST",

    status:
      attendanceStatus === "ABSENT"
        ? "Absent"
        : attendanceStatus === "LEAVE"
          ? "Leave"
          : "Present",

    alreadyMarked: Boolean(attendanceStatus),
    isApprovedLeave,
  };
};

const TeacherAttendance = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
});

  const [students, setStudents] = useState([]);
  const [attendanceMeta, setAttendanceMeta] = useState(
    DEFAULT_ATTENDANCE_META
  );

  const [search, setSearch] = useState("");
  const [activeStatFilter, setActiveStatFilter] = useState("TOTAL");

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const autoSaveTimerRef = useRef(null);
  const savingRef = useRef(false);

  const selectionRef = useRef({
    batchId: selectedBatchId,
    date: selectedDate,
  });

  selectionRef.current = {
    batchId: selectedBatchId,
    date: selectedDate,
  };

  const formatDateTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getBatchLabel = (batch) => {
    if (!batch) return "Unnamed Batch";

    if (batch.name) return batch.name;
    if (batch.code) return batch.code;

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

    return "Unnamed Batch";
  };

  // LOAD BATCHES
  useEffect(() => {
    let active = true;

    const loadBatches = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/attendance/my-batches");
        const fetchedBatches = response.data?.batches || [];

        if (!active) return;

        setBatches(fetchedBatches);

        if (fetchedBatches.length > 0) {
          setSelectedBatchId(fetchedBatches[0]._id);
        }
      } catch (error) {
        if (!active) return;

        console.error("Load Batches Error:", error);

        setError(
          error.response?.data?.message || "Unable to load batches"
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBatches();

    return () => {
      active = false;
    };
  }, []);

  // LOAD STUDENTS
  useEffect(() => {
    if (!selectedBatchId || !selectedDate) {
      setStudents([]);
      setHasUnsavedChanges(false);
      setAutoSaveStatus("idle");
      return;
    }

    let active = true;

    const loadStudents = async () => {
      try {
        setStudentsLoading(true);
        setHasUnsavedChanges(false);
        setAutoSaveStatus("idle");
        setError("");
        setSuccessMessage("");

        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
        }

        const response = await api.get("/attendance/my-students", {
          params: {
            batchId: selectedBatchId,
            date: selectedDate,
          },
        });

        if (!active) return;

        setAttendanceMeta(
          response.data?.attendanceMeta || DEFAULT_ATTENDANCE_META
        );

        const fetchedStudents = response.data?.students || [];

        setStudents(fetchedStudents.map(formatStudent));
      } catch (error) {
        if (!active) return;

        console.error("Load Students Error:", error);

        setError(
          error.response?.data?.message || "Unable to load students"
        );

        setStudents([]);
      } finally {
        if (active) setStudentsLoading(false);
      }
    };

    loadStudents();

    return () => {
      active = false;
    };
  }, [selectedBatchId, selectedDate]);

  // UPDATE ATTENDANCE
  const updateAttendance = (id, status) => {
    if (!attendanceMeta.canEdit || savingRef.current) return;

    const currentStudent = students.find(
      (student) => student.id === id
    );

    // Teachers cannot manually add Leave or change approved Leave.
    if (
      !currentStudent ||
      currentStudent.status === status ||
      currentStudent.isApprovedLeave ||
      status === "Leave"
    ) {
      return;
    }

    setStudents((previousStudents) =>
      previousStudents.map((student) =>
        student.id === id ? { ...student, status } : student
      )
    );

    setHasUnsavedChanges(true);
    setAutoSaveStatus("pending");
    setError("");
    setSuccessMessage("");
  };

  // MARK ALL PRESENT
  // Approved Leave students remain on Leave.
  const markAllPresent = () => {
    if (!attendanceMeta.canEdit || savingRef.current) return;

    const hasChanges = students.some(
      (student) =>
        !student.isApprovedLeave &&
        student.status !== "Present"
    );

    if (!hasChanges) return;

    setStudents((previousStudents) =>
      previousStudents.map((student) => ({
        ...student,
        status: student.isApprovedLeave
          ? "Leave"
          : "Present",
      }))
    );

    setHasUnsavedChanges(true);
    setAutoSaveStatus("pending");
    setError("");
    setSuccessMessage("");
  };

  // SAVE ATTENDANCE
  const saveAttendance = async ({ silent = false } = {}) => {
    if (savingRef.current) return;

    if (!attendanceMeta.canEdit) {
      if (!silent) {
        setError(
          "You do not have permission to edit this attendance."
        );
      }
      return;
    }

    if (!selectedBatchId || !selectedDate || students.length === 0) {
      if (!silent) {
        setError("Please select a batch with students.");
      }
      return;
    }

    const batchIdToSave = selectedBatchId;
    const dateToSave = selectedDate;
    const studentsToSave = students;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    savingRef.current = true;
    setSaving(true);
    setAutoSaveStatus("saving");
    setError("");

    if (!silent) {
      setSuccessMessage("");
    }

    try {
      const attendanceData = studentsToSave.map((student) => ({
        studentId: student._id,
        status: student.status.toUpperCase(),
      }));

      const response = await api.post("/attendance/mark", {
        batchId: batchIdToSave,
        date: dateToSave,
        attendance: attendanceData,
      });

      const selectionIsSame =
        selectionRef.current.batchId === batchIdToSave &&
        selectionRef.current.date === dateToSave;

      if (selectionIsSame) {
        const refreshResponse = await api.get(
          "/attendance/my-students",
          {
            params: {
              batchId: batchIdToSave,
              date: dateToSave,
            },
          }
        );

        if (
          selectionRef.current.batchId === batchIdToSave &&
          selectionRef.current.date === dateToSave
        ) {
          setStudents(
            (refreshResponse.data?.students || []).map(formatStudent)
          );

          setAttendanceMeta(
            refreshResponse.data?.attendanceMeta || attendanceMeta
          );

          setHasUnsavedChanges(false);
          setAutoSaveStatus("saved");

          if (!silent) {
            setSuccessMessage(
              response.data?.message ||
                "Attendance saved successfully"
            );
          }
        }
      }
    } catch (error) {
      console.error("Save Attendance Error:", error);

      const selectionIsSame =
        selectionRef.current.batchId === batchIdToSave &&
        selectionRef.current.date === dateToSave;

      if (selectionIsSame) {
        setAutoSaveStatus("error");
        setHasUnsavedChanges(true);

        setError(
          error.response?.data?.message ||
            "Unable to save attendance. Please try again."
        );
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // AUTO-SAVE ATTENDANCE
  useEffect(() => {
    if (
      !hasUnsavedChanges ||
      autoSaveStatus === "error" ||
      !attendanceMeta.canEdit ||
      studentsLoading ||
      students.length === 0 ||
      saving
    ) {
      return undefined;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveAttendance({ silent: true });
    }, 700);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [
    hasUnsavedChanges,
    autoSaveStatus,
    students,
    attendanceMeta.canEdit,
    studentsLoading,
    saving,
  ]);

  // COUNTS
  const presentCount = students.filter(
    (student) => student.status === "Present"
  ).length;

  const absentCount = students.filter(
    (student) => student.status === "Absent"
  ).length;

  const leaveCount = students.filter(
    (student) => student.status === "Leave"
  ).length;

  // ATTENDANCE PERCENTAGE

// Leave is counted as absent for percentage calculation.
const attendanceEligibleCount =
  presentCount + absentCount + leaveCount;

const attendanceRate =
  attendanceEligibleCount > 0
    ? Math.round(
        (presentCount / attendanceEligibleCount) * 100
      )
    : 0;

  // SEARCH + STAT FILTER
  const filteredStudents = students.filter((student) => {
    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      student.name?.toLowerCase().includes(searchValue) ||
      student.email?.toLowerCase().includes(searchValue) ||
      student.phone?.toLowerCase().includes(searchValue);

    let matchesStatus = true;

    if (activeStatFilter === "PRESENT") {
      matchesStatus = student.status === "Present";
    } else if (activeStatFilter === "ABSENT") {
      matchesStatus = student.status === "Absent";
    } else if (activeStatFilter === "LEAVE") {
      matchesStatus = student.status === "Leave";
    } else if (activeStatFilter === "RATE") {
  matchesStatus =
    student.status === "Present" ||
    student.status === "Absent" ||
    student.status === "Leave";
}

    return matchesSearch && matchesStatus;
  });

  const selectedBatch = batches.find(
    (batch) => batch._id === selectedBatchId
  );

  // ATTENDANCE STATUS MESSAGE
  const getAttendanceMessage = () => {
    if (!attendanceMeta.isMarked) return null;

    if (attendanceMeta.isLocked) {
      return {
        type: "locked",
        icon: <Lock size={17} />,
        message: `Attendance is permanently locked. It was marked by ${
          attendanceMeta.markedBy?.name || "another teacher"
        }.`,
      };
    }

   

    return {
      type: "editable",
      icon: <Clock size={17} />,
      message: `You can edit this attendance until ${formatDateTime(
        attendanceMeta.editableUntil
      )}.`,
    };
  };

  const attendanceMessage = getAttendanceMessage();

  const getStatCardClass = (filter) =>
    `attendance-stat-card clickable-stat-card ${
      activeStatFilter === filter ? "selected" : ""
    }`;

  // LOADING
  if (loading) {
    return (
      <div className="teacher-attendance-page">
        <p>Loading attendance...</p>
      </div>
    );
  }

  return (
    <div className="teacher-attendance-page">
      {/* HEADER */}
      <div className="teacher-attendance-header">
        <div>
          <span className="teacher-page-label">EDUCATOR PORTAL</span>
          <h1>Attendance</h1>
          <p>Mark and manage student attendance for all batches.</p>
        </div>

        <button
          className="mark-all-present-btn"
          onClick={markAllPresent}
          disabled={
            students.length === 0 ||
            studentsLoading ||
            saving ||
            !attendanceMeta.canEdit
          }
        >
          <CheckCircle2 size={17} />
          Mark All Present
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div
          style={{
            marginBottom: "16px",
            color: "#dc2626",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {successMessage && (
        <div
          style={{
            marginBottom: "16px",
            color: "#166534",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          {successMessage}
        </div>
      )}

      {/* ATTENDANCE ACCESS STATUS */}
      {attendanceMessage && (
        <div
          style={{
            marginBottom: "16px",
            padding: "14px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background:
              attendanceMessage.type === "editable"
                ? "#eff6ff"
                : "#fff7ed",
            color:
              attendanceMessage.type === "editable"
                ? "#1d4ed8"
                : "#9a3412",
            border:
              attendanceMessage.type === "editable"
                ? "1px solid #bfdbfe"
                : "1px solid #fed7aa",
          }}
        >
          {attendanceMessage.icon}
          <span>{attendanceMessage.message}</span>
        </div>
      )}

      {/* CONTROLS */}
      <div className="attendance-controls-card">
        <div className="attendance-control-group">
          <label>
            <Users size={15} />
            Select Batch
          </label>

          <div className="attendance-custom-batch">
  <button
    type="button"
    className={`attendance-custom-batch-trigger ${
      batchDropdownOpen ? "active" : ""
    }`}
    onClick={() => setBatchDropdownOpen((prev) => !prev)}
    disabled={saving || batches.length === 0}
  >
    <span className="attendance-custom-batch-info">
      <strong>
        {getBatchLabel(selectedBatch)}
      </strong>
      <small>
        {selectedBatch
          ? "Currently selected batch"
          : "Select a batch"}
      </small>
    </span>

    <ChevronDown
      size={18}
      className={batchDropdownOpen ? "rotated" : ""}
    />
  </button>

  {batchDropdownOpen && (
    <>
      <div
        className="attendance-custom-batch-backdrop"
        onClick={() => setBatchDropdownOpen(false)}
      />

      <div className="attendance-custom-batch-menu">
        {batches.map((batch) => {
          const isSelected =
            String(batch._id) === String(selectedBatchId);

          return (
            <button
              type="button"
              key={batch._id}
              className={`attendance-custom-batch-option ${
                isSelected ? "selected" : ""
              }`}
              onClick={() => {
                if (hasUnsavedChanges) {
                  saveAttendance({ silent: true });
                }

                setSelectedBatchId(batch._id);
                setActiveStatFilter("TOTAL");
                setBatchDropdownOpen(false);
              }}
              disabled={saving}
            >
              <span className="attendance-custom-batch-icon">
                <Users size={17} />
              </span>

              <span className="attendance-custom-batch-text">
                <strong>{getBatchLabel(batch)}</strong>
                <small>
                  {batch.displayTiming ||
                    batch.batchTiming ||
                    "Batch timing"}
                </small>
              </span>

              {isSelected && (
                <Check
                  size={18}
                  className="attendance-custom-batch-check"
                />
              )}
            </button>
          );
        })}
      </div>
    </>
  )}
</div>
        </div>

        <div className="attendance-control-group">
          <label>
            <CalendarDays size={15} />
            Select Date
          </label>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (hasUnsavedChanges) {
                saveAttendance({ silent: true });
              }

              setSelectedDate(e.target.value);
              setActiveStatFilter("TOTAL");
            }}
            disabled={saving}
          />
        </div>
      </div>

      {/* CLICKABLE STATS */}
      <div className="attendance-stats-grid">
        <button
          type="button"
          className={getStatCardClass("TOTAL")}
          onClick={() => setActiveStatFilter("TOTAL")}
          aria-pressed={activeStatFilter === "TOTAL"}
        >
          <div className="attendance-stat-icon total">
            <Users size={21} />
          </div>
          <div>
            <span>Total Students</span>
            <strong>{students.length}</strong>
          </div>
        </button>

        <button
          type="button"
          className={getStatCardClass("PRESENT")}
          onClick={() => setActiveStatFilter("PRESENT")}
          aria-pressed={activeStatFilter === "PRESENT"}
        >
          <div className="attendance-stat-icon present">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Present</span>
            <strong>{presentCount}</strong>
          </div>
        </button>

        <button
          type="button"
          className={getStatCardClass("ABSENT")}
          onClick={() => setActiveStatFilter("ABSENT")}
          aria-pressed={activeStatFilter === "ABSENT"}
        >
          <div className="attendance-stat-icon absent">
            <XCircle size={21} />
          </div>
          <div>
            <span>Absent</span>
            <strong>{absentCount}</strong>
          </div>
        </button>

        <button
          type="button"
          className={getStatCardClass("LEAVE")}
          onClick={() => setActiveStatFilter("LEAVE")}
          aria-pressed={activeStatFilter === "LEAVE"}
        >
          <div className="attendance-stat-icon leave">
            <Clock size={21} />
          </div>
          <div>
            <span>Leave</span>
            <strong>{leaveCount}</strong>
          </div>
        </button>

        <button
          type="button"
          className={getStatCardClass("RATE")}
          onClick={() => setActiveStatFilter("RATE")}
          aria-pressed={activeStatFilter === "RATE"}
        >
          <div className="attendance-stat-icon percentage">
            <CalendarDays size={21} />
          </div>
          <div>
            <span>Attendance Rate</span>
            <strong>{attendanceRate}%</strong>
          </div>
        </button>
      </div>

      {/* ATTENDANCE LIST */}
      <div className="attendance-list-card">
        <div className="attendance-list-header">
          <div>
            <h2>
              {selectedBatch
                ? getBatchLabel(selectedBatch)
                : "Select Batch"}{" "}
              Attendance
            </h2>

            <p>
              {activeStatFilter === "TOTAL"
                ? "Showing all students."
                : activeStatFilter === "PRESENT"
                  ? "Showing present students."
                  : activeStatFilter === "ABSENT"
                    ? "Showing absent students."
                    : activeStatFilter === "LEAVE"
                      ? "Showing students on leave."
                      : "Showing students included in attendance rate."}
            </p>
          </div>

          <div className="attendance-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="attendance-table-wrapper">
          {studentsLoading ? (
            <div style={{ padding: "30px", textAlign: "center" }}>
              Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center" }}>
              No students found for the selected filter.
            </div>
          ) : (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Contact</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <div className="attendance-student-info">
                        <ProfileAvatar
                          user={student}
                          size={40}
                          className="attendance-student-avatar"
                        />

                        <div>
                          <strong>{student.name}</strong>
                          <small>
                            {selectedBatch
                              ? getBatchLabel(selectedBatch)
                              : ""}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="attendance-contact">
                        <span>{student.email}</span>
                        <small>{student.phone || "—"}</small>
                      </div>
                    </td>

                    <td>
                      <div className="attendance-status-buttons">
                        {/* PRESENT */}
                        <button
                          className={
                            student.status === "Present"
                              ? "present active"
                              : "present"
                          }
                          onClick={() =>
                            updateAttendance(student.id, "Present")
                          }
                          disabled={
                            saving ||
                            !attendanceMeta.canEdit ||
                            student.isApprovedLeave
                          }
                          title={
                            student.isApprovedLeave
                              ? "Approved leave cannot be changed by teacher"
                              : "Mark Present"
                          }
                        >
                          <CheckCircle2 size={15} />
                          Present
                        </button>

                        {/* ABSENT */}
                        <button
                          className={
                            student.status === "Absent"
                              ? "absent active"
                              : "absent"
                          }
                          onClick={() =>
                            updateAttendance(student.id, "Absent")
                          }
                          disabled={
                            saving ||
                            !attendanceMeta.canEdit ||
                            student.isApprovedLeave
                          }
                          title={
                            student.isApprovedLeave
                              ? "Approved leave cannot be changed by teacher"
                              : "Mark Absent"
                          }
                        >
                          <XCircle size={15} />
                          Absent
                        </button>

                        {/* LEAVE - ADMIN APPROVAL ONLY */}
                        <button
                          className={
                            student.status === "Leave"
                              ? "leave active"
                              : "leave"
                          }
                          disabled={true}
                          title="Leave can only be added after admin approval"
                        >
                          <Clock size={15} />
                          Leave
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* SAVE FOOTER */}
        <div className="attendance-save-footer">
          <div>
            <strong>{presentCount} Present</strong>
            <span>{" · "}{absentCount} Absent</span>
            <span>{" · "}{leaveCount} Leave</span>

            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: "6px",
                fontSize: "13px",
                fontWeight: 500,
                color:
                  autoSaveStatus === "error"
                    ? "#dc2626"
                    : autoSaveStatus === "saved"
                      ? "#15803d"
                      : autoSaveStatus === "saving"
                        ? "#2563eb"
                        : "#64748b",
              }}
            >
              {autoSaveStatus === "pending"
                ? "Changes pending — auto-save shortly"
                : autoSaveStatus === "saving"
                  ? "Saving attendance..."
                  : autoSaveStatus === "saved"
                    ? "Attendance saved ✓"
                    : autoSaveStatus === "error"
                      ? "Auto-save failed — use Save Attendance to retry"
                      : "Changes are saved automatically"}
            </div>
          </div>

          <button
            className="save-attendance-btn"
            onClick={() => saveAttendance()}
            disabled={
              students.length === 0 ||
              saving ||
              studentsLoading ||
              !attendanceMeta.canEdit
            }
          >
            {attendanceMeta.isLocked ? (
              <Lock size={17} />
            ) : (
              <Save size={17} />
            )}

            {saving
              ? "Saving..."
              : attendanceMeta.isLocked
                ? "Attendance Locked"
                : attendanceMeta.isMarked &&
                    !attendanceMeta.isOwner
                  ? "View Only"
                  : attendanceMeta.isMarked
                    ? "Update Attendance"
                    : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;
