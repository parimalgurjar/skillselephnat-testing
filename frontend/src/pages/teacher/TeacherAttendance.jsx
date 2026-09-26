import {
  useEffect,
  useState,
} from "react";

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
} from "lucide-react";

import api from "../../services/api";

import "./TeacherAttendance.css";

const TeacherAttendance = () => {

  const [batches, setBatches] =
    useState([]);

  const [selectedBatchId, setSelectedBatchId] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [students, setStudents] =
    useState([]);

  const [attendanceMeta, setAttendanceMeta] =
    useState({
      isMarked: false,
      markedBy: null,
      createdAt: null,
      editableUntil: null,
      isOwner: false,
      isLocked: false,
      canEdit: true,
    });

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    studentsLoading,
    setStudentsLoading,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  /* =====================================================
     FORMAT SINGLE TIME
  ===================================================== */

  const formatSingleTime = (time) => {

    if (!time) return "";

    const cleanedTime =
      time
        .toString()
        .trim()
        .replace(".", ":");

    const parts =
      cleanedTime.split(":");

    let hours =
      parseInt(parts[0], 10);

    const minutes =
      parseInt(
        parts[1] || "0",
        10
      );

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return time;
    }

    const period =
      hours >= 12
        ? "PM"
        : "AM";

    hours =
      hours % 12 || 12;

    return `${hours}:${minutes
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  /* =====================================================
     FORMAT DATE TIME
  ===================================================== */

  const formatDateTime = (date) => {

    if (!date) return "";

    return new Date(
      date
    ).toLocaleString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  /* =====================================================
     GET BATCH LABEL
  ===================================================== */

  const getBatchLabel = (batch) => {

    if (!batch) {
      return "Unnamed Batch";
    }

    if (batch.displayTiming) {

      return batch.name
        ? `${batch.name} (${batch.displayTiming})`
        : batch.displayTiming;
    }

    let timing =
      batch.batchTiming;

    if (
      !timing &&
      batch.startTime &&
      batch.endTime
    ) {
      timing =
        `${formatSingleTime(
          batch.startTime
        )} - ${formatSingleTime(
          batch.endTime
        )}`;
    }

    if (
      batch.name &&
      timing
    ) {
      return `${batch.name} (${timing})`;
    }

    return (
      batch.name ||
      batch.code ||
      timing ||
      "Unnamed Batch"
    );
  };

  /* =====================================================
     LOAD BATCHES
  ===================================================== */

  useEffect(() => {

    const loadBatches =
      async () => {

        try {

          setLoading(true);
          setError("");

          const response =
            await api.get(
              "/attendance/my-batches"
            );

          const fetchedBatches =
            response.data?.batches || [];

          setBatches(
            fetchedBatches
          );

          if (
            fetchedBatches.length > 0
          ) {

            setSelectedBatchId(
              fetchedBatches[0]._id
            );

          }

        } catch (error) {

          console.error(
            "Load Batches Error:",
            error
          );

          setError(
            error.response?.data?.message ||
            "Unable to load batches"
          );

        } finally {

          setLoading(false);

        }

      };

    loadBatches();

  }, []);

  /* =====================================================
     LOAD STUDENTS
  ===================================================== */

  useEffect(() => {

    if (
      !selectedBatchId ||
      !selectedDate
    ) {

      setStudents([]);

      return;

    }

    const loadStudents =
      async () => {

        try {

          setStudentsLoading(true);

          setError("");

          setSuccessMessage("");

          const response =
            await api.get(
              "/attendance/my-students",
              {
                params: {
                  batchId:
                    selectedBatchId,

                  date:
                    selectedDate,
                },
              }
            );

          const fetchedStudents =
            response.data?.students || [];

          setAttendanceMeta(
            response.data?.attendanceMeta || {
              isMarked: false,
              markedBy: null,
              createdAt: null,
              editableUntil: null,
              isOwner: false,
              isLocked: false,
              canEdit: true,
            }
          );

          const formattedStudents =
            fetchedStudents.map(
              (student) => ({

                ...student,

                id:
                  student._id,

                initials:
                  student.name
                    ? student.name
                        .split(" ")
                        .map(
                          (word) =>
                            word.charAt(0)
                        )
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "ST",

                status:
                  student.attendanceStatus ===
                  "ABSENT"
                    ? "Absent"
                    : "Present",

                alreadyMarked:
                  Boolean(
                    student.attendanceStatus
                  ),

              })
            );

          setStudents(
            formattedStudents
          );

        } catch (error) {

          console.error(
            "Load Students Error:",
            error
          );

          setError(
            error.response?.data?.message ||
            "Unable to load students"
          );

          setStudents([]);

        } finally {

          setStudentsLoading(false);

        }

      };

    loadStudents();

  }, [
    selectedBatchId,
    selectedDate,
  ]);

  /* =====================================================
     UPDATE ATTENDANCE
  ===================================================== */

  const updateAttendance = (
    id,
    status
  ) => {

    if (!attendanceMeta.canEdit) {
      return;
    }

    setStudents(
      (previousStudents) =>
        previousStudents.map(
          (student) =>
            student.id === id
              ? {
                  ...student,
                  status,
                }
              : student
        )
    );

  };

  /* =====================================================
     MARK ALL PRESENT
  ===================================================== */

  const markAllPresent = () => {

    if (!attendanceMeta.canEdit) {
      return;
    }

    setStudents(
      (previousStudents) =>
        previousStudents.map(
          (student) => ({
            ...student,
            status: "Present",
          })
        )
    );

  };

  /* =====================================================
     SAVE ATTENDANCE
  ===================================================== */

  const saveAttendance =
    async () => {

      try {

        if (!attendanceMeta.canEdit) {

          setError(
            "You do not have permission to edit this attendance."
          );

          return;

        }

        if (!selectedBatchId) {

          setError(
            "Please select a batch"
          );

          return;

        }

        if (
          students.length === 0
        ) {

          setError(
            "No students available"
          );

          return;

        }

        setSaving(true);

        setError("");

        setSuccessMessage("");

        const attendanceData =
          students.map(
            (student) => ({
              studentId:
                student._id,

              status:
                student.status ===
                "Present"
                  ? "PRESENT"
                  : "ABSENT",
            })
          );

        const response =
          await api.post(
            "/attendance/mark",
            {

              batchId:
                selectedBatchId,

              date:
                selectedDate,

              attendance:
                attendanceData,

            }
          );

        setSuccessMessage(
          response.data?.message ||
          "Attendance saved successfully"
        );

        /*
          Reload students and attendance metadata
          after successful save.
        */

        const refreshResponse =
          await api.get(
            "/attendance/my-students",
            {
              params: {
                batchId:
                  selectedBatchId,

                date:
                  selectedDate,
              },
            }
          );

        setAttendanceMeta(
          refreshResponse.data
            ?.attendanceMeta ||
            attendanceMeta
        );

      } catch (error) {

        console.error(
          "Save Attendance Error:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Unable to save attendance"
        );

      } finally {

        setSaving(false);

      }

    };

  /* =====================================================
     COUNTS
  ===================================================== */

  const presentCount =
    students.filter(
      (student) =>
        student.status ===
        "Present"
    ).length;

  const absentCount =
    students.filter(
      (student) =>
        student.status ===
        "Absent"
    ).length;

  const attendanceRate =
    students.length > 0
      ? Math.round(
          (
            presentCount /
            students.length
          ) * 100
        )
      : 0;

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredStudents =
    students.filter(
      (student) => {

        const searchValue =
          search.toLowerCase();

        return (

          student.name
            ?.toLowerCase()
            .includes(
              searchValue
            ) ||

          student.email
            ?.toLowerCase()
            .includes(
              searchValue
            ) ||

          student.phone
            ?.toLowerCase()
            .includes(
              searchValue
            )

        );

      }
    );

  /* =====================================================
     SELECTED BATCH
  ===================================================== */

  const selectedBatch =
    batches.find(
      (batch) =>
        batch._id ===
        selectedBatchId
    );

  /* =====================================================
     ATTENDANCE STATUS MESSAGE
  ===================================================== */

  const getAttendanceMessage =
    () => {

      if (
        !attendanceMeta.isMarked
      ) {
        return null;
      }

      if (
        attendanceMeta.isLocked
      ) {
        return {
          type: "locked",

          icon:
            <Lock size={17} />,

          message:
            `Attendance is permanently locked. It was marked by ${
              attendanceMeta.markedBy?.name ||
              "another teacher"
            }.`,
        };
      }

      if (
        !attendanceMeta.isOwner
      ) {
        return {
          type: "view",

          icon:
            <Eye size={17} />,

          message:
            `Attendance was marked by ${
              attendanceMeta.markedBy?.name ||
              "another teacher"
            }. You have view-only access.`,
        };
      }

      return {
        type: "editable",

        icon:
          <Clock size={17} />,

        message:
          `You can edit this attendance until ${formatDateTime(
            attendanceMeta.editableUntil
          )}.`,
      };
    };

  const attendanceMessage =
    getAttendanceMessage();

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (
      <div className="teacher-attendance-page">

        <p>
          Loading attendance...
        </p>

      </div>
    );

  }

  return (

    <div className="teacher-attendance-page">

      {/* HEADER */}

      <div className="teacher-attendance-header">

        <div>

          <span className="teacher-page-label">
            EDUCATOR PORTAL
          </span>

          <h1>
            Attendance
          </h1>

          <p>
            Mark and manage student
            attendance for all batches.
          </p>

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
            border:
              "1px solid #fecaca",
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
            border:
              "1px solid #bbf7d0",
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
              attendanceMessage.type ===
              "editable"
                ? "#eff6ff"
                : "#fff7ed",

            color:
              attendanceMessage.type ===
              "editable"
                ? "#1d4ed8"
                : "#9a3412",

            border:
              attendanceMessage.type ===
              "editable"
                ? "1px solid #bfdbfe"
                : "1px solid #fed7aa",
          }}
        >

          {attendanceMessage.icon}

          <span>
            {attendanceMessage.message}
          </span>

        </div>

      )}

      {/* CONTROLS */}

      <div className="attendance-controls-card">

        <div className="attendance-control-group">

          <label>

            <Users size={15} />

            Select Batch

          </label>

          <select
            value={selectedBatchId}
            onChange={(e) =>
              setSelectedBatchId(
                e.target.value
              )
            }
          >

            {batches.length === 0 ? (

              <option value="">
                No batches available
              </option>

            ) : (

              batches.map(
                (batch) => (

                  <option
                    key={batch._id}
                    value={batch._id}
                  >
                    {getBatchLabel(batch)}
                  </option>

                )
              )

            )}

          </select>

        </div>

        <div className="attendance-control-group">

          <label>

            <CalendarDays size={15} />

            Select Date

          </label>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) =>
              setSelectedDate(
                e.target.value
              )
            }
          />

        </div>

      </div>

      {/* STATS */}

      <div className="attendance-stats-grid">

        <div className="attendance-stat-card">

          <div className="attendance-stat-icon total">

            <Users size={21} />

          </div>

          <div>

            <span>
              Total Students
            </span>

            <strong>
              {students.length}
            </strong>

          </div>

        </div>

        <div className="attendance-stat-card">

          <div className="attendance-stat-icon present">

            <CheckCircle2 size={21} />

          </div>

          <div>

            <span>
              Present
            </span>

            <strong>
              {presentCount}
            </strong>

          </div>

        </div>

        <div className="attendance-stat-card">

          <div className="attendance-stat-icon absent">

            <XCircle size={21} />

          </div>

          <div>

            <span>
              Absent
            </span>

            <strong>
              {absentCount}
            </strong>

          </div>

        </div>

        <div className="attendance-stat-card">

          <div className="attendance-stat-icon percentage">

            <CalendarDays size={21} />

          </div>

          <div>

            <span>
              Attendance Rate
            </span>

            <strong>
              {attendanceRate}%
            </strong>

          </div>

        </div>

      </div>

      {/* ATTENDANCE */}

      <div className="attendance-list-card">

        <div className="attendance-list-header">

          <div>

            <h2>

              {selectedBatch
                ? getBatchLabel(
                    selectedBatch
                  )
                : "Select Batch"}

              {" "}Attendance

            </h2>

            <p>
              {attendanceMeta.isMarked
                ? attendanceMeta.canEdit
                  ? "You can update attendance within the allowed edit period."
                  : "Attendance is available in view-only mode."
                : "Students enrolled in the selected batch are shown."}
            </p>

          </div>

          <div className="attendance-search">

            <Search size={16} />

            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        <div className="attendance-table-wrapper">

          {studentsLoading ? (

            <div
              style={{
                padding: "30px",
                textAlign: "center",
              }}
            >
              Loading students...
            </div>

          ) : filteredStudents.length === 0 ? (

            <div
              style={{
                padding: "30px",
                textAlign: "center",
              }}
            >
              No students found for this batch.
            </div>

          ) : (

            <table className="attendance-table">

              <thead>

                <tr>

                  <th>
                    Student
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredStudents.map(
                  (student) => (

                    <tr
                      key={student._id}
                    >

                      <td>

                        <div className="attendance-student-info">

                          <div className="attendance-student-avatar">

                            {student.initials}

                          </div>

                          <div>

                            <strong>
                              {student.name}
                            </strong>

                            <small>
                              {selectedBatch
                                ? getBatchLabel(
                                    selectedBatch
                                  )
                                : ""}
                            </small>

                          </div>

                        </div>

                      </td>

                      <td>

                        <div className="attendance-contact">

                          <span>
                            {student.email}
                          </span>

                          <small>
                            {student.phone || "—"}
                          </small>

                        </div>

                      </td>

                      <td>

                        <div className="attendance-status-buttons">

                          <button
                            className={
                              student.status ===
                              "Present"
                                ? "present active"
                                : "present"
                            }
                            onClick={() =>
                              updateAttendance(
                                student.id,
                                "Present"
                              )
                            }
                            disabled={
                              saving ||
                              !attendanceMeta.canEdit
                            }
                          >

                            <CheckCircle2 size={15} />

                            Present

                          </button>

                          <button
                            className={
                              student.status ===
                              "Absent"
                                ? "absent active"
                                : "absent"
                            }
                            onClick={() =>
                              updateAttendance(
                                student.id,
                                "Absent"
                              )
                            }
                            disabled={
                              saving ||
                              !attendanceMeta.canEdit
                            }
                          >

                            <XCircle size={15} />

                            Absent

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>

        <div className="attendance-save-footer">

          <div>

            <strong>
              {presentCount} Present
            </strong>

            <span>
              {" · "}
              {absentCount} Absent
            </span>

          </div>

          <button
            className="save-attendance-btn"
            onClick={saveAttendance}
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