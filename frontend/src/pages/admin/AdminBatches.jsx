import { useEffect, useState } from "react";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  Plus,
  Users,
  UserCheck,
  CalendarDays,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Clock,
  ClipboardCheck,
} from "lucide-react";

import api from "../../services/api";
import AlertModal from "../../components/common/AlertModal";
import "./AdminBatches.css";

const initialFormState = {
  name: "",
  code: "",
  educator: "",
  attendanceTeachers: [],
  capacity: 30,
  startTime: "",
  endTime: "",
  classDays: [],
  startDate: "",
  status: "ACTIVE",
};

/* ============================================
   CLASS DAYS
============================================ */

const weekDays = [
  {
    value: "MONDAY",
    label: "Monday",
  },
  {
    value: "TUESDAY",
    label: "Tuesday",
  },
  {
    value: "WEDNESDAY",
    label: "Wednesday",
  },
  {
    value: "THURSDAY",
    label: "Thursday",
  },
  {
    value: "FRIDAY",
    label: "Friday",
  },
  {
    value: "SATURDAY",
    label: "Saturday",
  },
  {
    value: "SUNDAY",
    label: "Sunday",
  },
];

const AdminBatches = () => {
  const [showModal, setShowModal] = useState(false);

  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [editingBatch, setEditingBatch] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState(initialFormState);

  const [alert, setAlert] = useState({
    isOpen: false,
    type: "error",
    title: "",
    message: "",
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    batchId: null,
  });

  /* ============================================
     FORMAT TIME TO AM/PM
  ============================================ */

  const formatTimeToAMPM = (time) => {
    if (!time) return "—";

    const [hours, minutes] = time.split(":");
    const hour = Number(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minutes || "00"} ${ampm}`;
  };

  /* ============================================
     FORMAT BATCH TIMING
  ============================================ */

  const getBatchTiming = (batch) => {
    if (batch.batchTiming) {
      return batch.batchTiming;
    }

    if (batch.startTime && batch.endTime) {
      return `${formatTimeToAMPM(batch.startTime)} - ${formatTimeToAMPM(
        batch.endTime
      )}`;
    }

    return "Not Set";
  };

  /* ============================================
     FORMAT CLASS DAYS
  ============================================ */

  const getClassDaysDisplay = (classDays) => {
    if (!classDays) {
      return "Not Set";
    }

    if (Array.isArray(classDays)) {
      if (classDays.length === 0) {
        return "Not Set";
      }

      return classDays
        .map(
          (day) => weekDays.find((item) => item.value === day)?.label || day
        )
        .join(", ");
    }

    return classDays;
  };

  /* ============================================
     NORMALIZE LEGACY CLASS DAYS
  ============================================ */

  const normalizeClassDays = (classDays) => {
    if (Array.isArray(classDays)) {
      return classDays;
    }

    if (classDays === "Monday - Friday") {
      return ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    }

    if (classDays === "Monday - Saturday") {
      return [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ];
    }

    if (classDays === "Weekend Batch") {
      return ["SATURDAY", "SUNDAY"];
    }

    return [];
  };

  /* ============================================
     LOAD BATCHES
  ============================================ */

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/batches");

      if (response.data?.success) {
        setBatches(response.data.batches || []);
      } else {
        setBatches([]);
      }
    } catch (error) {
      console.error("Load Batches Error:", error.response?.data || error);

      setError(error.response?.data?.message || "Failed to load batches");

      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================
     LOAD TEACHERS
  ============================================ */

  const loadTeachers = async () => {
    try {
      let response;

      try {
        response = await api.get("/teachers");
      } catch {
        response = await api.get("/users/teachers");
      }

      const teacherList =
        response.data?.teachers || response.data?.users || [];

      const activeTeachers = teacherList.filter(
        (teacher) =>
          teacher.role === "TEACHER" &&
          teacher.isActive !== false &&
          teacher.status !== "INACTIVE"
      );

      setTeachers(activeTeachers);
    } catch (error) {
      console.error("Load Teachers Error:", error.response?.data || error);

      setTeachers([]);
    }
  };

  /* ============================================
     INITIAL LOAD
  ============================================ */

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadBatches(), loadTeachers()]);
    };

    loadData();
  }, []);

  /* ============================================
     FORM CHANGE
  ============================================ */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value,
    }));
  };

  /* ============================================
     HANDLE ATTENDANCE TEACHERS
  ============================================ */

  const handleAttendanceTeacherToggle = (teacherId) => {
    setFormData((prev) => {
      const alreadySelected = prev.attendanceTeachers.includes(teacherId);

      return {
        ...prev,
        attendanceTeachers: alreadySelected
          ? prev.attendanceTeachers.filter((id) => id !== teacherId)
          : [...prev.attendanceTeachers, teacherId],
      };
    });
  };

  /* ============================================
     HANDLE CLASS DAY TOGGLE
  ============================================ */

  const handleClassDayToggle = (day) => {
    setFormData((prev) => {
      const alreadySelected = prev.classDays.includes(day);

      return {
        ...prev,
        classDays: alreadySelected
          ? prev.classDays.filter((item) => item !== day)
          : [...prev.classDays, day],
      };
    });
  };

  /* ============================================
     OPEN CREATE MODAL
  ============================================ */

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setFormError("");
    setFormData(initialFormState);
    setShowModal(true);
  };

  /* ============================================
     OPEN EDIT MODAL
  ============================================ */

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setFormError("");

    setFormData({
      name: batch.name || "",

      code: batch.code || "",

      educator: batch.educator?._id || batch.educator || "",

      attendanceTeachers: Array.isArray(batch.attendanceTeachers)
        ? batch.attendanceTeachers.map((teacher) => teacher?._id || teacher)
        : [],

      capacity: batch.capacity || 30,

      startTime: batch.startTime || "",

      endTime: batch.endTime || "",

      classDays: normalizeClassDays(batch.classDays),

      startDate: batch.startDate
        ? new Date(batch.startDate).toISOString().split("T")[0]
        : "",

      status: batch.status || "ACTIVE",
    });

    setShowModal(true);
  };

  /* ============================================
     CLOSE MODAL
  ============================================ */

  const handleCloseModal = () => {
    if (submitting) return;

    setShowModal(false);
    setEditingBatch(null);
    setFormError("");
    setFormData(initialFormState);
  };

  /* ============================================
     VALIDATE FORM
  ============================================ */

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Batch name is required";
    }

    if (!formData.code.trim()) {
      return "Batch code is required";
    }

    if (!formData.startTime) {
      return "Start time is required";
    }

    if (!formData.endTime) {
      return "End time is required";
    }

    if (formData.startTime >= formData.endTime) {
      return "End time must be after start time";
    }

    if (!formData.capacity || Number(formData.capacity) <= 0) {
      return "Capacity must be greater than 0";
    }

    if (!formData.classDays || formData.classDays.length === 0) {
      return "Please select at least one class day";
    }

    if (!formData.startDate) {
      return "Start date is required";
    }

    return "";
  };

  /* ============================================
     CREATE / UPDATE BATCH
  ============================================ */

  const handleSubmitBatch = async () => {
    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const batchTiming = `${formatTimeToAMPM(
        formData.startTime
      )} - ${formatTimeToAMPM(formData.endTime)}`;

      const payload = {
        name: formData.name.trim(),

        code: formData.code.trim().toUpperCase(),

        educator: formData.educator || null,

        attendanceTeachers: formData.attendanceTeachers,

        capacity: Number(formData.capacity),

        startTime: formData.startTime,

        endTime: formData.endTime,

        batchTiming,

        classDays: formData.classDays,

        startDate: formData.startDate,

        status: formData.status,
      };

      if (editingBatch) {
        await api.patch(`/batches/${editingBatch._id}`, payload);
      } else {
        await api.post("/batches", payload);
      }

      await loadBatches();

      handleCloseModal();
    } catch (error) {
      console.error("Save Batch Error:", error.response?.data || error);

      setFormError(error.response?.data?.message || "Failed to save batch");
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================================
     DELETE BATCH
  ============================================ */

  const handleDeleteBatch = (id) => {
    setConfirmModal({
      isOpen: true,
      batchId: id,
    });
  };

  const confirmDeleteBatch = async () => {
    const id = confirmModal.batchId;

    if (!id) return;

    try {
      await api.delete(`/batches/${id}`);

      await loadBatches();

      setConfirmModal({
        isOpen: false,
        batchId: null,
      });
    } catch (error) {
      console.error("Delete Batch Error:", error.response?.data || error);

      setConfirmModal({
        isOpen: false,
        batchId: null,
      });

      setAlert({
        isOpen: true,
        type: "error",
        title: "Delete Failed",
        message: error.response?.data?.message || "Failed to delete batch",
      });
    }
  };

  /* ============================================
     GET STUDENT COUNT
  ============================================ */

  const getStudentCount = (batch) => {
    if (typeof batch.students === "number") {
      return batch.students;
    }

    if (Array.isArray(batch.students)) {
      return batch.students.length;
    }

    if (typeof batch.studentCount === "number") {
      return batch.studentCount;
    }

    return 0;
  };

  /* ============================================
     STATS
  ============================================ */

  const totalBatches = batches.length;

  const activeBatches = batches.filter(
    (batch) => batch.status === "ACTIVE"
  ).length;

  const totalStudents = batches.reduce(
    (total, batch) => total + getStudentCount(batch),
    0
  );

  /* ============================================
     DATE FORMAT
  ============================================ */

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* ============================================
     GET ATTENDANCE TEACHER NAMES
  ============================================ */

  const getAttendanceTeacherNames = (batch) => {
    if (
      !Array.isArray(batch.attendanceTeachers) ||
      batch.attendanceTeachers.length === 0
    ) {
      return "Not Assigned";
    }

    return batch.attendanceTeachers
      .map(
        (teacher) =>
          teacher?.name ||
          teachers.find((item) => item._id === teacher)?.name ||
          "Unknown"
      )
      .join(", ");
  };

  /* ============================================
     LOADING
  ============================================ */

  if (loading) {
    return (
      <div className="admin-batches-page">
        <p>Loading batches...</p>
      </div>
    );
  }

  return (
    <div className="admin-batches-page">
      {/* HEADER */}

      <div className="admin-batches-header">
        <div>
          <span className="admin-page-label">ADMIN PORTAL</span>

          <h1>Batch Management</h1>

          <p>Create and manage course batches and student enrollment.</p>
        </div>

        <button className="add-batch-btn" onClick={handleOpenCreate}>
          <Plus size={18} />
          Create Batch
        </button>
      </div>

      {/* STATS */}

      <div className="batch-stats-grid">
        <div className="batch-stat-card">
          <div className="batch-stat-icon navy">
            <Users size={21} />
          </div>

          <div>
            <span>Total Batches</span>

            <strong>{totalBatches}</strong>

            <small>All course batches</small>
          </div>
        </div>

        <div className="batch-stat-card">
          <div className="batch-stat-icon green">
            <UserCheck size={21} />
          </div>

          <div>
            <span>Active Batches</span>

            <strong>{activeBatches}</strong>

            <small>Currently running</small>
          </div>
        </div>

        <div className="batch-stat-card">
          <div className="batch-stat-icon yellow">
            <CalendarDays size={21} />
          </div>

          <div>
            <span>Total Students</span>

            <strong>{totalStudents}</strong>

            <small>Across all batches</small>
          </div>
        </div>
      </div>

      {/* SECTION HEADER */}

      <div className="batches-section-header">
        <div>
          <h2>All Batches</h2>

          <p>Manage your Digital Marketing course batches.</p>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            padding: "15px",
            textAlign: "center",
            color: "red",
          }}
        >
          {error}
        </div>
      )}

      {/* BATCH CARDS */}

      <div className="batches-grid">
        {batches.map((batch) => {
          const studentCount = getStudentCount(batch);

          const capacity = batch.capacity || 1;

          const progress = Math.min((studentCount / capacity) * 100, 100);

          return (
            <div className="admin-batch-card" key={batch._id}>
              <div className="batch-card-top">
                <div className="batch-title-section">
                  <div className="batch-icon">
                    <Users size={20} />
                  </div>

                  <div>
                    <h3>{batch.name}</h3>

                    <span>{batch.code}</span>
                  </div>
                </div>

                <button
                  className="batch-more-btn"
                  title="Batch Options"
                  onClick={() => handleEditBatch(batch)}
                >
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* STATUS */}

              <div className="batch-status-row">
                <span
                  className={`batch-status ${
                    batch.status === "ACTIVE" ? "active" : "upcoming"
                  }`}
                >
                  {batch.status || "ACTIVE"}
                </span>

                <span className="batch-start-date">
                  Started {formatDate(batch.startDate)}
                </span>
              </div>

              {/* EDUCATOR */}

              <div className="batch-info-row">
                <div className="batch-info-icon">
                  <UserCheck size={16} />
                </div>

                <div>
                  <span>Educator</span>

                  <strong>{batch.educator?.name || "Not Assigned"}</strong>
                </div>
              </div>

              {/* ATTENDANCE TEACHERS */}

              <div className="batch-info-row">
                <div className="batch-info-icon">
                  <ClipboardCheck size={16} />
                </div>

                <div>
                  <span>Attendance Teachers</span>

                  <strong
                    style={{
                      fontSize: "13px",
                      lineHeight: "1.4",
                    }}
                  >
                    {getAttendanceTeacherNames(batch)}
                  </strong>
                </div>
              </div>

              {/* STUDENTS */}

              <div className="batch-info-row">
                <div className="batch-info-icon">
                  <Users size={16} />
                </div>

                <div className="batch-student-info">
                  <span>Students</span>

                  <div className="batch-student-count">
                    <strong>
                      {studentCount} / {batch.capacity || 0}
                    </strong>

                    <div className="batch-progress">
                      <div
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SCHEDULE */}

              <div className="batch-info-row">
                <div className="batch-info-icon">
                  <Clock size={16} />
                </div>

                <div>
                  <span>Class Schedule</span>

                  <strong>{getBatchTiming(batch)}</strong>

                  <small>{getClassDaysDisplay(batch.classDays)}</small>
                </div>
              </div>

              {/* FOOTER */}

              <div className="batch-card-footer">
                <button
                  className="edit-batch-btn"
                  onClick={() => handleEditBatch(batch)}
                >
                  <Edit size={15} />
                  Edit Batch
                </button>

                <button
                  className="delete-batch-btn"
                  onClick={() => handleDeleteBatch(batch._id)}
                  title="Delete Batch"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}

        {batches.length === 0 && !error && <p>No batches found.</p>}
      </div>

      {/* CREATE / EDIT MODAL */}

      {showModal && (
        <div className="batch-modal-overlay">
          <div className="batch-modal">
            {/* HEADER */}

            <div className="batch-modal-header">
              <div>
                <h2>{editingBatch ? "Edit Batch" : "Create New Batch"}</h2>

                <p>
                  {editingBatch
                    ? "Update batch details and schedule."
                    : "Create a batch for the Digital Marketing course."}
                </p>
              </div>

              <button onClick={handleCloseModal} disabled={submitting}>
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <div className="batch-form">
              {formError && (
                <div
                  style={{
                    color: "red",
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  {formError}
                </div>
              )}

              {/* BATCH NAME */}

              <div className="batch-form-group">
                <label>Batch Name</label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Example: Digital Marketing Batch D"
                  disabled={submitting}
                />
              </div>

              {/* CODE + CAPACITY */}

              <div className="batch-form-row">
                <div className="batch-form-group">
                  <label>Batch Code</label>

                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="Example: DM-D-2026"
                    disabled={submitting}
                  />
                </div>

                <div className="batch-form-group">
                  <label>Maximum Capacity</label>

                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    value={formData.capacity}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* MAIN EDUCATOR */}

              <div className="batch-form-group">
                <label>Assign Main Educator</label>

                <select
                  name="educator"
                  value={formData.educator}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">Select Educator</option>

                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ATTENDANCE TEACHERS */}

              <div className="batch-form-group">
                <label>Assign Attendance Teachers</label>

                <p
                  style={{
                    fontSize: "12px",
                    color: "#777",
                    marginTop: "4px",
                    marginBottom: "10px",
                  }}
                >
                  Select teachers who can mark attendance for this batch.
                </p>

                <div className="attendance-teachers-list">
                  {teachers.length === 0 ? (
                    <div className="attendance-teachers-empty">
                      No teachers available
                    </div>
                  ) : (
                    teachers.map((teacher) => {
                      const isSelected = formData.attendanceTeachers.includes(
                        teacher._id
                      );

                      return (
                        <label
                          key={teacher._id}
                          className={`attendance-teacher-item ${
                            isSelected ? "selected" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              handleAttendanceTeacherToggle(teacher._id)
                            }
                            disabled={submitting}
                          />

                          <span className="attendance-teacher-name">
                            {teacher.name}
                          </span>

                          {isSelected && (
                            <span className="attendance-teacher-check">✓</span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="attendance-teachers-count">
                  {formData.attendanceTeachers.length} teacher
                  {formData.attendanceTeachers.length !== 1 ? "s" : ""}{" "}
                  selected
                </div>
              </div>

              {/* SCHEDULE / TIMINGS */}

              <div className="batch-form-row">
                <div className="batch-form-group">
                  <label>Start Time</label>

                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                <div className="batch-form-group">
                  <label>End Time</label>

                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* CLASS DAYS */}

              <div className="batch-form-group">
                <label>Class Days</label>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "6px",
                  }}
                >
                  {weekDays.map((day) => {
                    const isSelected = formData.classDays.includes(day.value);

                    return (
                      <button
                        type="button"
                        key={day.value}
                        onClick={() => handleClassDayToggle(day.value)}
                        disabled={submitting}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          border: isSelected
                            ? "1px solid #0f172a"
                            : "1px solid #ccc",
                          backgroundColor: isSelected ? "#0f172a" : "#fff",
                          color: isSelected ? "#fff" : "#333",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* START DATE & STATUS */}

              <div className="batch-form-row">
                <div className="batch-form-group">
                  <label>Start Date</label>

                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                <div className="batch-form-group">
                  <label>Batch Status</label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              {/* ACTIONS */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmitBatch}
                  disabled={submitting}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {submitting
                    ? "Saving..."
                    : editingBatch
                    ? "Update Batch"
                    : "Create Batch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Batch"
        message="Are you sure you want to delete this batch? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteBatch}
        onCancel={() =>
          setConfirmModal({
            isOpen: false,
            batchId: null,
          })
        }
      />

      {/* ALERT MODAL */}

      <AlertModal
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() =>
          setAlert({
            isOpen: false,
            type: "error",
            title: "",
            message: "",
          })
        }
      />
    </div>
  );
};

export default AdminBatches;