import {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  Users,
  UserCheck,
  UserX,
  Search,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import api from "../../services/api";
import AlertModal from "../../components/common/AlertModal";
import "./AdminAttendance.css";

const AdminAttendance = () => {

  /* =====================================================
     GET TODAY DATE
  ===================================================== */

  const getTodayDate = () => {
    return new Date()
      .toISOString()
      .split("T")[0];
  };


  /* =====================================================
     FORMAT TIME
     09:00 -> 9:00 AM
  ===================================================== */

  const formatTimeToAMPM = (time) => {

    if (!time) return "";

    const cleanedTime =
      time
        .toString()
        .trim()
        .replace(".", ":");

    const [hours, minutes = "00"] =
      cleanedTime.split(":");

    let hour = Number(hours);

    if (Number.isNaN(hour)) {
      return time;
    }

    const period =
      hour >= 12
        ? "PM"
        : "AM";

    hour =
      hour % 12 || 12;

    return `${hour}:${minutes} ${period}`;
  };


  /* =====================================================
     FORMAT BATCH TIMING

     Supports:
     - batch.displayTiming
     - batch.batchTiming
     - startTime + endTime
  ===================================================== */

  const formatBatchTiming = (batch) => {

    if (!batch) return "";

    if (batch.displayTiming) {
      return batch.displayTiming;
    }

    if (batch.batchTiming) {

      const parts =
        batch.batchTiming
          .split("-")
          .map(
            (item) =>
              item.trim()
          );

      if (parts.length === 2) {

        return `${formatTimeToAMPM(
          parts[0]
        )} - ${formatTimeToAMPM(
          parts[1]
        )}`;

      }

      return batch.batchTiming;
    }

    if (
      batch.startTime &&
      batch.endTime
    ) {

      return `${formatTimeToAMPM(
        batch.startTime
      )} - ${formatTimeToAMPM(
        batch.endTime
      )}`;

    }

    return "";
  };


  /* =====================================================
     GET BATCH LABEL
  ===================================================== */

  const getBatchLabel = (batch) => {

    if (!batch) {
      return "Unnamed Batch";
    }

    const timing =
      formatBatchTiming(batch);

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
     STATES
  ===================================================== */

  const [
    selectedBatchId,
    setSelectedBatchId,
  ] = useState("All");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getTodayDate()
  );

  const [
    search,
    setSearch,
  ] = useState("");
const [alert, setAlert] = useState({
  isOpen: false,
  type: "info",
  title: "",
  message: "",
});
  const [
    attendanceRecords,
    setAttendanceRecords,
  ] = useState([]);

  const [
    stats,
    setStats,
  ] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    averageAttendance: 0,
  });

  const [
    batches,
    setBatches,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /* =====================================================
     FETCH BATCHES
  ===================================================== */

  useEffect(() => {

    const fetchBatches =
      async () => {

        try {

          const response =
            await api.get(
              "/attendance/my-batches"
            );

          if (
            response.data?.success
          ) {

            setBatches(
              response.data?.batches || []
            );

          } else {

            setBatches([]);

          }

        } catch (error) {

          console.error(
            "Fetch batches error:",
            error.response?.data ||
              error
          );

          setBatches([]);

        }

      };

    fetchBatches();

  }, []);


  /* =====================================================
     FETCH ATTENDANCE
  ===================================================== */

  useEffect(() => {

    const fetchAttendance =
      async () => {

        try {

          setLoading(true);

          setError("");

          const params = {
            date:
              selectedDate,
          };


          /*
            IMPORTANT:

            Send batchId instead of batchTiming.

            MongoDB batch _id is the
            stable relationship identifier.
          */

          if (
            selectedBatchId &&
            selectedBatchId !== "All"
          ) {

            params.batchId =
              selectedBatchId;

          }


          if (
            search.trim()
          ) {

            params.search =
              search.trim();

          }


          const response =
            await api.get(
              "/attendance",
              {
                params,
              }
            );

          if (
            response.data?.success
          ) {

            setAttendanceRecords(
              response.data.records || []
            );

          } else {

            setAttendanceRecords([]);

          }

        } catch (error) {

          console.error(
            "Fetch attendance error:",
            error.response?.data ||
              error
          );

          setError(
            error.response?.data?.message ||
              "Unable to fetch attendance"
          );

          setAttendanceRecords([]);

        } finally {

          setLoading(false);

        }

      };

    fetchAttendance();

  }, [
    selectedBatchId,
    selectedDate,
    search,
  ]);


  /* =====================================================
     FETCH ATTENDANCE STATS
  ===================================================== */

  useEffect(() => {

    const fetchStats =
      async () => {

        try {

          const params = {
            date:
              selectedDate,
          };


          if (
            selectedBatchId &&
            selectedBatchId !== "All"
          ) {

            params.batchId =
              selectedBatchId;

          }


          const response =
            await api.get(
              "/attendance/stats",
              {
                params,
              }
            );

          if (
            response.data?.success
          ) {

            setStats(
              response.data.stats || {
                totalStudents: 0,
                presentToday: 0,
                absentToday: 0,
                averageAttendance: 0,
              }
            );

          }

        } catch (error) {

          console.error(
            "Fetch attendance stats error:",
            error.response?.data ||
              error
          );

        }

      };

    fetchStats();

  }, [
    selectedDate,
    selectedBatchId,
  ]);


  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (
    dateValue
  ) => {

    if (!dateValue) {
      return "-";
    }

    return new Date(
      dateValue
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  /* =====================================================
     GET RECORD BATCH OBJECT

     Backend may return:
     record.batch

     or populated:
     record.batchId

     Fallback support is included.
  ===================================================== */

  const getRecordBatch = (
    record
  ) => {

    if (
      record.batch &&
      typeof record.batch === "object"
    ) {
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


  /* =====================================================
     GET RECORD BATCH LABEL
  ===================================================== */

  const getRecordBatchLabel = (
    record
  ) => {

    const batch =
      getRecordBatch(record);

    if (batch) {
      return getBatchLabel(batch);
    }


    /*
      Legacy fallback.
    */

    if (
      record.batchTiming
    ) {

      return formatBatchTiming({
        batchTiming:
          record.batchTiming,
      });

    }

    return "-";

  };


  /* =====================================================
     EXPORT CSV
  ===================================================== */

  const handleExport = () => {
  if (attendanceRecords.length === 0) {
    setAlert({
      isOpen: true,
      type: "warning",
      title: "No Records Found",
      message:
        "There are no attendance records for the selected date and batch.",
    });

    return;
  }

  const headers = [
    "Student Name",
    "Email",
    "Batch",
    "Date",
    "Status",
  ];

  const rows = attendanceRecords.map((record) => [
    record.student?.name || "",
    record.student?.email || "",
    getRecordBatchLabel(record),
    formatDate(record.date),
    record.status || "",
  ]);

  const csvContent = [
    headers,
    ...rows,
  ]
    .map((row) =>
      row
        .map(
          (value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
        )
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csvContent],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  const batchName =
    selectedBatchId === "All"
      ? "all-batches"
      : getRecordBatchLabel(
          attendanceRecords[0]
        )
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-|-$/g, "")
            .toLowerCase();

  link.setAttribute(
    "download",
    `attendance-${batchName}-${selectedDate}.csv`
  );

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};


  /* =====================================================
     LOADING
  ===================================================== */

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


  /* =====================================================
     ERROR
  ===================================================== */

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

          {error}

        </div>

      </div>

    );

  }


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="admin-attendance-page">


      {/* ================= HEADER ================= */}

      <div className="admin-attendance-header">

        <div>

          <span className="admin-page-label">
            ADMIN PORTAL
          </span>

          <h1>
            Attendance Management
          </h1>

          <p>
            Monitor student attendance
            across all batches.
          </p>

        </div>

<button
  className="attendance-export-btn"
  onClick={handleExport}
>

          <Download size={17} />

          Export Report

        </button>

      </div>


      {/* ================= STATS ================= */}

      <div className="attendance-stats-grid">


        {/* TOTAL STUDENTS */}

        <div className="attendance-stat-card">

          <div className="attendance-stat-icon navy">

            <Users size={21} />

          </div>

          <div>

            <span>
              Total Students
            </span>

            <strong>
              {stats.totalStudents}
            </strong>

            <small>
              Active students
            </small>

          </div>

        </div>


        {/* PRESENT */}

        <div className="attendance-stat-card">

          <div className="attendance-stat-icon green">

            <UserCheck size={21} />

          </div>

          <div>

            <span>
              Present
            </span>

            <strong>
              {stats.presentToday}
            </strong>

            <small>
              On selected date
            </small>

          </div>

        </div>


        {/* ABSENT */}

        <div className="attendance-stat-card">

          <div className="attendance-stat-icon red">

            <UserX size={21} />

          </div>

          <div>

            <span>
              Absent
            </span>

            <strong>
              {stats.absentToday}
            </strong>

            <small>
              On selected date
            </small>

          </div>

        </div>


        {/* AVERAGE */}

        <div className="attendance-stat-card">

          <div className="attendance-stat-icon yellow">

            <CalendarDays size={21} />

          </div>

          <div>

            <span>
              Average Attendance
            </span>

            <strong>
              {stats.averageAttendance}%
            </strong>

            <small>
              Selected filter
            </small>

          </div>

        </div>

      </div>


      {/* ================= MAIN CARD ================= */}

      <div className="attendance-management-card">


        {/* ================= CARD HEADER ================= */}

        <div className="attendance-card-header">

          <div>

            <h2>
              Daily Attendance
            </h2>

            <p>
              View attendance records for
              selected date and batch.
            </p>

          </div>


          {/* ================= FILTERS ================= */}

          <div className="attendance-filters">


            {/* BATCH FILTER */}

            <select
              value={selectedBatchId}
              onChange={(e) =>
                setSelectedBatchId(
                  e.target.value
                )
              }
            >

              <option value="All">
                All Batches
              </option>


              {batches.map(
                (batch) => (

                  <option
                    key={batch._id}
                    value={batch._id}
                  >

                    {getBatchLabel(
                      batch
                    )}

                  </option>

                )
              )}

            </select>


            {/* DATE FILTER */}

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


        {/* ================= SEARCH ================= */}

        <div className="attendance-search-row">

          <div className="attendance-search">

            <Search size={17} />

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


          <span className="attendance-record-count">

            {attendanceRecords.length} Records Found

          </span>

        </div>


        {/* ================= TABLE ================= */}

        <div className="attendance-table-wrapper">

          <table className="admin-attendance-table">

            <thead>

              <tr>

                <th>
                  Student
                </th>

                <th>
                  Batch
                </th>

                <th>
                  Date
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>


            <tbody>

              {attendanceRecords.length > 0 ? (

                attendanceRecords.map(
                  (record) => {

                    const isPresent =
                      record.status ===
                      "PRESENT";

                    return (

                      <tr
                        key={record._id}
                      >


                        {/* STUDENT */}

                        <td>

                          <div className="attendance-student-profile">

                            <div className="attendance-avatar">

                              {record.student?.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "S"}

                            </div>


                            <div>

                              <strong>

                                {record.student?.name ||
                                  "Unknown Student"}

                              </strong>

                              <span>

                                {record.student?.email ||
                                  "No email"}

                              </span>

                            </div>

                          </div>

                        </td>


                        {/* BATCH */}

                        <td>

                          <span className="attendance-batch-badge">

                            {getRecordBatchLabel(
                              record
                            )}

                          </span>

                        </td>


                        {/* DATE */}

                        <td>

                          {formatDate(
                            record.date
                          )}

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={`attendance-status ${
                              isPresent
                                ? "present"
                                : "absent"
                            }`}
                          >

                            {isPresent ? (

                              <CheckCircle2
                                size={13}
                              />

                            ) : (

                              <XCircle
                                size={13}
                              />

                            )}

                            {isPresent
                              ? "Present"
                              : "Absent"}

                          </span>

                        </td>

                      </tr>

                    );

                  }
                )

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