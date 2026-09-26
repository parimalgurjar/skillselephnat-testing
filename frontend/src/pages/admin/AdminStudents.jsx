import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  X,
  UserCog,
} from "lucide-react";

import api from "../../services/api";
import AlertModal from "../../components/common/AlertModal";

import "./AdminStudents.css";

const initialFormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  batchId: "",
  batchTiming: "",
  teacherId: "",
  joiningDate: "",
  status: "ACTIVE",
};

/* =====================================================
   FORMAT TIME TO AM/PM
===================================================== */
const formatTimeToAMPM = (time) => {
  if (!time) return "";

  // Already formatted
  if (/am|pm/i.test(time)) {
    return time;
  }

  const parts = time.split(":");

  if (!parts.length) {
    return time;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/* =====================================================
   GET DISPLAY BATCH TIMING
===================================================== */

const getBatchTimingDisplay = (batch) => {
  if (!batch) return "";

  if (batch.startTime && batch.endTime) {
    return `${formatTimeToAMPM(
      batch.startTime
    )} - ${formatTimeToAMPM(batch.endTime)}`;
  }

  if (batch.batchTiming) {
    const times = batch.batchTiming.split("-");

    if (times.length === 2) {
      return `${formatTimeToAMPM(
        times[0].trim()
      )} - ${formatTimeToAMPM(times[1].trim())}`;
    }

    return batch.batchTiming;
  }

  return "";
};

/* =====================================================
   GET BATCH ID SAFELY
===================================================== */

const getBatchId = (student) => {
  if (!student?.batchId) {
    return "";
  }

  if (typeof student.batchId === "object") {
    return student.batchId._id || student.batchId.id || "";
  }

  return student.batchId;
};

/* =====================================================
   GET TEACHER ID SAFELY
===================================================== */

const getTeacherId = (student) => {
  if (!student?.teacherId) {
    return "";
  }

  if (typeof student.teacherId === "object") {
    return student.teacherId._id || student.teacherId.id || "";
  }

  return student.teacherId;
};

/* =====================================================
   COMPONENT
===================================================== */

const AdminStudents = () => {
  const [alert, setAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const [search, setSearch] = useState("");

  const [batchFilter, setBatchFilter] = useState("All Batches");

  const [showModal, setShowModal] = useState(false);

  const [editingStudent, setEditingStudent] = useState(null);

  const [students, setStudents] = useState([]);

  const [teachers, setTeachers] = useState([]);

  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState(initialFormState);

  /* =====================================================
     FETCH STUDENTS
  ===================================================== */

  const fetchStudents = async () => {
    try {
      setError("");

      const response = await api.get("/students");

      if (response.data?.success !== false) {
        setStudents(response.data?.students || []);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error(
        "Fetch Students Error:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.message || "Failed to load students"
      );

      setStudents([]);
    }
  };

  /* =====================================================
     FETCH TEACHERS
  ===================================================== */

  const fetchTeachers = async () => {
    try {
      const response = await api.get("/teachers");

      const allTeachers = response.data?.teachers || [];

      const activeTeachers = allTeachers.filter((teacher) => {
        const isTeacher = teacher.role === "TEACHER";

        const isActive =
          teacher.isActive !== false && teacher.status !== "INACTIVE";

        return isTeacher && isActive;
      });

      setTeachers(activeTeachers);
    } catch (error) {
      console.error(
        "Fetch Teachers Error:",
        error.response?.data || error
      );

      setTeachers([]);
    }
  };

  /* =====================================================
     FETCH BATCHES
  ===================================================== */
const fetchBatches = async () => {
  try {
    const response = await api.get("/batches");

    const batchList = response.data?.batches || [];

    const activeBatches = batchList.filter(
      (batch) => batch.status !== "INACTIVE"
    );

    setBatches(activeBatches);
  } catch (error) {
    console.error(
      "Fetch Batches Error:",
      error.response?.data || error
    );

    setBatches([]);
  }
};

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        await Promise.all([
          fetchStudents(),
          fetchTeachers(),
          fetchBatches(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /* =====================================================
     BATCH MAP
  ===================================================== */

  const batchMap = useMemo(() => {
    const map = {};

    batches.forEach((batch) => {
      if (batch._id) {
        map[batch._id] = batch;
      }
    });

    return map;
  }, [batches]);

  /* =====================================================
     GET BATCH DETAILS
  ===================================================== */

  const getStudentBatchDetails = (student) => {
    const studentBatchId = getBatchId(student);

    let batch = batchMap[studentBatchId];

    // If batchId is populated object
    if (!batch && typeof student.batchId === "object") {
      batch = student.batchId;
    }

    const batchName =
      batch?.name ||
      batch?.code ||
      student.batchName ||
      "Not Assigned";

    const batchTiming =
      getBatchTimingDisplay(batch) || student.batchTiming || "";

    return {
      batch,
      batchName,
      batchTiming,
    };
  };

  /* =====================================================
     OPEN ADD MODAL
  ===================================================== */

  const handleAddStudent = () => {
    setEditingStudent(null);

    setFormError("");

    setFormData(initialFormState);

    setShowModal(true);
  };

  /* =====================================================
     OPEN EDIT MODAL
  ===================================================== */

  const handleEditStudent = (student) => {
    const { batchTiming } = getStudentBatchDetails(student);

    setEditingStudent(student);

    setFormError("");

    setFormData({
      name: student.name || "",

      email: student.email || "",

      password: "",

      phone: student.phone || "",

      batchId: getBatchId(student),

      batchTiming: batchTiming || "",

      teacherId: getTeacherId(student),

      joiningDate: student.joiningDate
        ? new Date(student.joiningDate).toISOString().split("T")[0]
        : "",

      status:
        student.status ||
        (student.isActive === false ? "INACTIVE" : "ACTIVE"),
    });

    setShowModal(true);
  };

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const handleCloseModal = () => {
    if (submitting) return;

    setShowModal(false);

    setEditingStudent(null);

    setFormError("");

    setFormData(initialFormState);
  };

  /* =====================================================
     NORMAL FORM CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
     BATCH CHANGE

     Auto:
     - Batch ID
     - Batch Timing
     - Assigned Teacher
  ===================================================== */

  const handleBatchChange = (e) => {
    const selectedBatchId = e.target.value;

    if (!selectedBatchId) {
      setFormData((previous) => ({
        ...previous,
        batchId: "",
        batchTiming: "",
        teacherId: "",
      }));

      return;
    }

    const selectedBatch = batches.find(
      (batch) => batch._id === selectedBatchId
    );

    if (!selectedBatch) {
      return;
    }

    const timing = getBatchTimingDisplay(selectedBatch);

    const batchTeacherId =
      selectedBatch.educator?._id ||
      selectedBatch.teacherId?._id ||
      selectedBatch.educator ||
      selectedBatch.teacherId ||
      "";

    setFormData((previous) => ({
      ...previous,

      batchId: selectedBatchId,

      batchTiming: timing,

      teacherId: batchTeacherId || previous.teacherId,
    }));
  };

  /* =====================================================
     CREATE / UPDATE STUDENT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      setFormError("");

      if (
        !formData.name.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim()
      ) {
        setFormError("Name, email and phone are required");

        return;
      }

      if (!formData.batchId) {
        setFormError("Please select a batch");

        return;
      }

      if (!editingStudent && !formData.password.trim()) {
        setFormError("Temporary password is required");

        return;
      }

      const payload = {
        name: formData.name.trim(),

        email: formData.email.trim().toLowerCase(),

        phone: formData.phone.trim(),

        batchId: formData.batchId,

        batchTiming: formData.batchTiming,

        teacherId: formData.teacherId || null,

        joiningDate: formData.joiningDate || null,

        status: formData.status,
      };

      if (!editingStudent) {
        payload.password = formData.password;
      }

      if (editingStudent) {
        await api.put(`/students/${editingStudent._id}`, payload);
      } else {
        await api.post("/students", payload);
      }

      await fetchStudents();

      handleCloseModal();
    } catch (error) {
      console.error(
        "Save Student Error:",
        error.response?.data || error
      );

      setFormError(
        error.response?.data?.message || "Failed to save student"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     DEACTIVATE STUDENT
  ===================================================== */

  const handleDeactivate = async (student) => {
    setAlert({
      isOpen: true,
      type: "warning",
      title: "Deactivate Student",
      message: `Are you sure you want to deactivate ${student.name}?`,
      confirmAction: async () => {
        try {
          await api.patch(`/students/${student._id}/deactivate`);

          setAlert({
            isOpen: true,
            type: "success",
            title: "Student Deactivated",
            message: `${student.name} has been deactivated successfully.`,
          });

          await fetchStudents();
        } catch (error) {
          console.error(
            "Deactivate Student Error:",
            error.response?.data || error
          );

          setAlert({
            isOpen: true,
            type: "error",
            title: "Deactivation Failed",
            message:
              error.response?.data?.message ||
              "Unable to deactivate the student.",
          });
        }
      },
    });

    return;
  };

  /* =====================================================
     FILTER STUDENTS
  ===================================================== */

  const filteredStudents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return students.filter((student) => {
      const { batchName, batchTiming } = getStudentBatchDetails(student);

      const teacherName =
        typeof student.teacherId === "object"
          ? student.teacherId?.name || ""
          : "";

      const matchesSearch =
        !searchValue ||
        student.name?.toLowerCase().includes(searchValue) ||
        student.email?.toLowerCase().includes(searchValue) ||
        student.phone?.toLowerCase().includes(searchValue) ||
        teacherName.toLowerCase().includes(searchValue) ||
        batchName.toLowerCase().includes(searchValue) ||
        batchTiming.toLowerCase().includes(searchValue);

      const studentBatchId = getBatchId(student);

      const matchesBatch =
        batchFilter === "All Batches" || studentBatchId === batchFilter;

      return matchesSearch && matchesBatch;
    });
  }, [students, search, batchFilter, batchMap]);

  /* =====================================================
     STATS
  ===================================================== */

  const totalStudents = students.length;

  const activeStudents = students.filter(
    (student) =>
      student.status === "ACTIVE" ||
      (!student.status && student.isActive !== false)
  ).length;

  const inactiveStudents = totalStudents - activeStudents;

  /* =====================================================
     DATE FORMAT
  ===================================================== */

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="admin-students-page">
        <p style={{ padding: "40px" }}>Loading students...</p>
      </div>
    );
  }

  return (
    <div className="admin-students-page">
      {/* ================= HEADER ================= */}

      <div className="admin-students-header">
        <div>
          <span className="admin-page-label">ADMIN PORTAL</span>

          <h1>Students Management</h1>

          <p>
            Manage students, batches, assigned teachers and account status.
          </p>
        </div>

        <button className="add-student-btn" onClick={handleAddStudent}>
          <Plus size={18} />
          Add Student
        </button>
      </div>

      {/* ================= STATS ================= */}

      <div className="admin-student-stats">
        <div className="admin-student-stat-card">
          <div className="admin-student-icon navy">
            <Users size={21} />
          </div>

          <div>
            <span>Total Students</span>

            <strong>{totalStudents}</strong>

            <small>Across all batches</small>
          </div>
        </div>

        <div className="admin-student-stat-card">
          <div className="admin-student-icon green">
            <UserCheck size={21} />
          </div>

          <div>
            <span>Active Students</span>

            <strong>{activeStudents}</strong>

            <small>Currently enrolled</small>
          </div>
        </div>

        <div className="admin-student-stat-card">
          <div className="admin-student-icon red">
            <UserX size={21} />
          </div>

          <div>
            <span>Inactive Students</span>

            <strong>{inactiveStudents}</strong>

            <small>Account inactive</small>
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="admin-students-table-card">
        <div className="admin-students-table-header">
          <div>
            <h2>All Students</h2>

            <p>
              View and manage registered students and teacher assignments.
            </p>
          </div>

          <div className="admin-students-actions">
            {/* SEARCH */}

            <div className="admin-student-search">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search student, teacher or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* BATCH FILTER */}

            <select
              className="batch-filter"
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
            >
              <option value="All Batches">All Batches</option>

              {batches.map((batch) => {
                const timing = getBatchTimingDisplay(batch);

                return (
                  <option key={batch._id} value={batch._id}>
                    {batch.name || batch.code || "Unnamed Batch"}
                    {timing ? ` (${timing})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="admin-students-table-wrapper">
          <table className="admin-students-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Contact</th>
                <th>Batch</th>
                <th>Assigned Teacher</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {error ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{ textAlign: "center", padding: "30px" }}
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{ textAlign: "center", padding: "30px" }}
                  >
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const { batchName, batchTiming } =
                    getStudentBatchDetails(student);

                  const teacher =
                    typeof student.teacherId === "object"
                      ? student.teacherId
                      : null;

                  const studentStatus =
                    student.status ||
                    (student.isActive === false ? "INACTIVE" : "ACTIVE");

                  return (
                    <tr key={student._id}>
                      {/* STUDENT */}

                      <td>
                        <div className="admin-student-profile">
                          <div className="admin-student-avatar">
                            {student.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>

                          <div>
                            <strong>{student.name}</strong>

                            <span>
                              {student._id?.slice(-8)?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CONTACT */}

                      <td>
                        <div className="student-contact">
                          <span>{student.email || "—"}</span>

                          <small>{student.phone || "—"}</small>
                        </div>
                      </td>

                      {/* BATCH */}

                      <td>
                        <div className="batch-details">
                          <span className="batch-badge">{batchName}</span>

                          {batchTiming && <small>{batchTiming}</small>}
                        </div>
                      </td>

                      {/* TEACHER */}

                      <td>
                        {teacher ? (
                          <div className="assigned-teacher">
                            <UserCog size={14} />

                            <div>
                              <strong>{teacher.name}</strong>

                              <small>Assigned</small>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="assign-teacher-btn"
                            onClick={() => handleEditStudent(student)}
                          >
                            Assign Teacher
                          </button>
                        )}
                      </td>

                      {/* JOINING DATE */}

                      <td>
                        {formatDate(
                          student.joiningDate || student.createdAt
                        )}
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`student-status ${
                            studentStatus === "ACTIVE"
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {studentStatus}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="student-table-actions">
                          <button
                            title="Edit Student"
                            onClick={() => handleEditStudent(student)}
                          >
                            <Edit size={15} />
                          </button>

                          {studentStatus === "ACTIVE" && (
                            <button
                              className="delete-student-btn"
                              title="Deactivate Student"
                              onClick={() => handleDeactivate(student)}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL ================= */}

      {showModal && (
        <div className="student-modal-overlay">
          <div className="student-modal">
            {/* HEADER */}

            <div className="student-modal-header">
              <div>
                <h2>
                  {editingStudent ? "Edit Student" : "Add New Student"}
                </h2>

                <p>
                  {editingStudent
                    ? "Update student details, batch or assigned teacher."
                    : "Create a student account and assign a batch."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit}>
              <div className="student-form">
                {formError && (
                  <div className="student-form-error">{formError}</div>
                )}

                {/* NAME + EMAIL */}

                <div className="student-form-row">
                  <div className="student-form-group">
                    <label>Full Name</label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      disabled={submitting}
                    />
                  </div>

                  <div className="student-form-group">
                    <label>Email Address</label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* PHONE + PASSWORD */}

                <div className="student-form-row">
                  <div className="student-form-group">
                    <label>Phone Number</label>

                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 XXXXX XXXXX"
                      disabled={submitting}
                    />
                  </div>

                  {!editingStudent && (
                    <div className="student-form-group">
                      <label>Temporary Password</label>

                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        disabled={submitting}
                      />
                    </div>
                  )}
                </div>

                {/* BATCH + TEACHER */}

                <div className="student-form-row">
                  <div className="student-form-group">
                    <label>Batch</label>

                    <select
                      name="batchId"
                      value={formData.batchId}
                      onChange={handleBatchChange}
                      disabled={submitting}
                    >
                      <option value="">Select Batch</option>

                      {batches.map((batch) => {
                        const timing = getBatchTimingDisplay(batch);

                        return (
                          <option key={batch._id} value={batch._id}>
                            {batch.name || batch.code || "Unnamed Batch"}
                            {timing ? ` (${timing})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="student-form-group">
                    <label>Assigned Teacher</label>

                    <select
                      name="teacherId"
                      value={formData.teacherId}
                      onChange={handleChange}
                      disabled={submitting}
                    >
                      <option value="">Select Teacher (Optional)</option>

                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* JOINING DATE + STATUS */}

                <div className="student-form-row">
                  <div className="student-form-group">
                    <label>Joining Date</label>

                    <input
                      type="date"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>

                  <div className="student-form-group">
                    <label>Status</label>

                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={submitting}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}

              <div className="student-modal-footer">
                <button
                  type="button"
                  className="cancel-student-btn"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
  type="submit"
  className="create-student-btn"
  disabled={submitting}
>
                  {submitting
                    ? "Saving..."
                    : editingStudent
                    ? "Update Student"
                    : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal */}
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

export default AdminStudents;