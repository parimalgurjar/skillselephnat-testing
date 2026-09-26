import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Plus,
  ClipboardList,
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  Search,
  MoreVertical,
  X,
  Trash2,
  ListPlus,
} from "lucide-react";

import api from "../../services/api";
import AlertModal from "../../components/common/AlertModal";

import "./TeacherTasks.css";

const TeacherTasks = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  const [batchTimings, setBatchTimings] = useState([]);
  const [alert, setAlert] = useState({
    isOpen: false,
    type: "error",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    batch: "",
    priority: "Medium",
    dueDate: "",

    tasks: [
      {
        title: "",
        description: "",
      },
    ],
  });

  /* =====================================================
     GET TEACHER TASKS
  ===================================================== */

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const response = await api.get("/tasks/my-tasks");

      if (response.data.success) {
        setTasks(response.data.tasks || []);
      }
    } catch (error) {
      console.error("Fetch tasks error:", error);

      setAlert({
        isOpen: true,
        type: "error",
        title: "Fetch Failed",
        message: "Unable to fetch tasks",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     GET ACTIVE BATCH TIMINGS
  ===================================================== */

  const fetchBatchTimings = async () => {
    try {
      const response = await api.get("/batches/public");

      const batches = response.data?.batches || [];

      const activeBatches = batches.filter(
        (batch) =>
          batch.isActive !== false &&
          batch.status !== "INACTIVE" &&
          batch.status !== "COMPLETED"
      );

      setBatchTimings(activeBatches);
    } catch (error) {
      console.error("Fetch batch timings error:", error);
    }
  };

  const formatTimeTo12Hour = (time) => {
    if (!time) return "";

    const [hours, minutes] = time.trim().split(":");

    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;
    hour = hour || 12;

    return `${hour}:${minutes} ${ampm}`;
  };

  const formatBatchTiming = (timing) => {
    if (!timing) return "";

    // Example: "09:00 - 10:30"
    if (timing.includes("-")) {
      const [startTime, endTime] = timing.split("-");

      return `${formatTimeTo12Hour(startTime)} - ${formatTimeTo12Hour(
        endTime
      )}`;
    }

    return formatTimeTo12Hour(timing);
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchTasks();
    fetchBatchTimings();
  }, []);

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     CHECKLIST CHANGE
  ===================================================== */

  const handleChecklistChange = (index, field, value) => {
    
    setFormData((prev) => {
      const updatedTasks = [...prev.tasks];

      updatedTasks[index] = {
        ...updatedTasks[index],
        [field]: value,
      };

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });
  };

  /* =====================================================
     ADD CHECKLIST ITEM
  ===================================================== */

  const addChecklistTask = () => {
    setFormData((prev) => ({
      ...prev,

      tasks: [
        ...prev.tasks,

        {
          title: "",
          description: "",
        },
      ],
    }));
  };

  /* =====================================================
     REMOVE CHECKLIST ITEM
  ===================================================== */

  const removeChecklistTask = (index) => {
    if (formData.tasks.length === 1) {
      setAlert({
        isOpen: true,
        type: "warning",
        title: "Cannot Remove",
        message: "At least one checklist task is required",
      });

      return;
    }

    setFormData((prev) => ({
      ...prev,

      tasks: prev.tasks.filter((_, taskIndex) => taskIndex !== index),
    }));
  };

  /* =====================================================
     RESET FORM
  ===================================================== */

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      batch: "",
      priority: "Medium",
      dueDate: "",

      tasks: [
        {
          title: "",
          description: "",
        },
      ],
    });
  };

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const closeModal = () => {
    if (!creating) {
      setShowModal(false);
      resetForm();
    }
  };

  /* =====================================================
     CREATE TASK
  ===================================================== */

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setAlert({
        isOpen: true,
        type: "warning",
        title: "Title Required",
        message: "Please enter task title",
      });

      return;
    }

    if (!formData.batch) {
      setAlert({
        isOpen: true,
        type: "warning",
        title: "Batch Required",
        message: "Please select batch timing",
      });
      return;
    }

    if (!formData.dueDate) {
      setAlert({
        isOpen: true,
        type: "warning",
        title: "Due Date Required",
        message: "Please select due date",
      });
      return;
    }

    const cleanedTasks = formData.tasks.filter((task) => task.title.trim());

    if (cleanedTasks.length === 0) {
      setAlert({
        isOpen: true,
        type: "warning",
        title: "Checklist Required",
        message: "Please add at least one checklist task",
      });

      return;
    }

    if (cleanedTasks.length !== formData.tasks.length) {
      setAlert({
        isOpen: true,
        type: "warning",
        title: "Invalid Checklist",
        message:
          "Please fill all checklist task titles or remove empty tasks",
      });
      return;
    }

    try {
      setCreating(true);

      const payload = {
        title: formData.title.trim(),

        description: formData.description.trim(),

        batchId: formData.batch,

        priority: formData.priority,

        dueDate: formData.dueDate,

        tasks: cleanedTasks.map((task, index) => ({
          title: task.title.trim(),

          description: task.description.trim(),

          order: index + 1,
        })),
      };

      const response = await api.post("/tasks", payload);

      if (response.data.success) {
        setAlert({
          isOpen: true,
          type: "success",
          title: "Success",
          message: "Task created successfully",
        });

        resetForm();

        setShowModal(false);

        await fetchTasks();
      }
    } catch (error) {
      console.error("Create task error:", error);

      setAlert({
        isOpen: true,
        type: "error",
        title: "Creation Failed",
        message: error.response?.data?.message || "Unable to create task",
      });
    } finally {
      setCreating(false);
    }
  };

  /* =====================================================
     FILTER TASKS
  ===================================================== */

  const filteredTasks = tasks.filter((task) => {
    const searchValue = search.toLowerCase();

    return (
      task.title?.toLowerCase().includes(searchValue) ||
      task.batch?.toLowerCase().includes(searchValue)
    );
  });

  /* =====================================================
     STATS
  ===================================================== */

  const totalTasks = tasks.length;

  const activeTasks = tasks.filter(
    (task) => task.displayStatus === "Active"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.displayStatus === "Completed"
  ).length;

  const totalSubmissions = tasks.reduce(
    (total, task) => total + (task.submitted || 0),
    0
  );

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {
    if (!date) {
      return "No date";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =====================================================
     STATUS CLASS
  ===================================================== */

  const getStatusClass = (status) => {
    switch (status) {
      case "Completed":
        return "task-completed";

      case "Overdue":
        return "task-overdue";

      case "Draft":
        return "task-draft";

      default:
        return "task-active";
    }
  };

  return (
    <div className="teacher-tasks-page">
      {/* =============================================
          HEADER
      ============================================= */}

      <div className="teacher-tasks-header">
        <div>
          <span className="teacher-page-label">EDUCATOR PORTAL</span>

          <h1>Tasks & Assignments</h1>

          <p>Create, assign and track student assignments.</p>
        </div>

        <button className="create-task-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Create New Task
        </button>
      </div>

      {/* =============================================
          STATS
      ============================================= */}

      <div className="task-stats-grid">
        <div className="task-stat-card">
          <div className="task-stat-icon blue">
            <ClipboardList size={21} />
          </div>

          <div>
            <span>Total Tasks</span>

            <strong>{totalTasks}</strong>
          </div>
        </div>

        <div className="task-stat-card">
          <div className="task-stat-icon yellow">
            <Clock size={21} />
          </div>

          <div>
            <span>Active Tasks</span>

            <strong>{activeTasks}</strong>
          </div>
        </div>

        <div className="task-stat-card">
          <div className="task-stat-icon green">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Completed</span>

            <strong>{completedTasks}</strong>
          </div>
        </div>

        <div className="task-stat-card">
          <div className="task-stat-icon purple">
            <Users size={21} />
          </div>

          <div>
            <span>Total Submissions</span>

            <strong>{totalSubmissions}</strong>
          </div>
        </div>
      </div>

      {/* =============================================
          TASK LIST
      ============================================= */}

      <div className="teacher-task-list-card">
        <div className="task-list-header">
          <div>
            <h2>All Tasks</h2>

            <p>Manage your assignments and submissions.</p>
          </div>

          <div className="task-search-box">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="task-state">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="task-state">No tasks found</div>
        ) : (
          <div className="tasks-grid">
            {filteredTasks.map((task) => {
              const submitted = task.submitted || 0;

              const total = task.totalStudents || 0;

              const percentage =
                total > 0 ? Math.round((submitted / total) * 100) : 0;

              const displayStatus = task.displayStatus || "Active";

              return (
                <div className="teacher-task-card" key={task._id}>
                  <div className="task-card-top">
                    <div className="task-icon-box">
                      <ClipboardList size={20} />
                    </div>

                    <div className="task-card-menu">
                      <span
                        className={`task-status ${getStatusClass(
                          displayStatus
                        )}`}
                      >
                        {displayStatus}
                      </span>

                      <button type="button">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>

                  <h3>{task.title}</h3>

                  <p className="task-description">
                    {task.description || "No description provided"}
                  </p>

                  <div className="task-checklist-count">
                    <ClipboardList size={14} />

                    <span>
                      {task.tasks?.length || 0} Checklist Items
                    </span>
                  </div>

                  <div className="task-details">
                    <div>
                      <Users size={15} />

                      <span>{task.batch}</span>
                    </div>

                    <div>
                      <CalendarDays size={15} />

                      <span>Due: {formatDate(task.dueDate)}</span>
                    </div>
                  </div>

                  <div className="task-progress-section">
                    <div className="task-progress-header">
                      <span>Submissions</span>

                      <strong>
                        {submitted}/{total}
                      </strong>
                    </div>

                    <div className="task-progress-bar">
                      <div
                        className="task-progress-fill"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <span className="task-progress-percent">
                      {percentage}% Submitted
                    </span>
                  </div>

                  <button
                    type="button"
                    className="view-task-btn"
                    onClick={() =>
                      navigate(`/teacher/tasks/${task._id}/submissions`)
                    }
                  >
                    View Submissions
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =============================================
          CREATE TASK MODAL
      ============================================= */}

      {showModal && (
        <div className="task-modal-overlay">
          <div className="task-modal">
            {/* HEADER */}

            <div className="task-modal-header">
              <div>
                <h2>Create New Task</h2>

                <p>Create an assignment for your students.</p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={creating}
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form className="task-form" onSubmit={handleCreateTask}>
              {/* TITLE */}

              <div className="task-form-group">
                <label>Task Title</label>

                <input
                  type="text"
                  name="title"
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* DESCRIPTION */}

              <div className="task-form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  placeholder="Write task instructions..."
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* BATCH + DATE */}

              <div className="task-form-row">
                <div className="task-form-group">
                  <label>Batch Timing</label>

                  <select
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Batch Timing</option>

                    {batchTimings.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name
                          ? `${batch.name} (${formatBatchTiming(
                              batch.batchTiming
                            )})`
                          : formatBatchTiming(batch.batchTiming)}
                      </option>
                    ))}
                  </select>

                  {batchTimings.length === 0 && (
                    <p className="batch-warning">
                      No active batch timings found.
                    </p>
                  )}
                </div>

                <div className="task-form-group">
                  <label>Due Date</label>

                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* PRIORITY */}

              <div className="task-form-group">
                <label>Priority</label>

                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="Low">Low</option>

                  <option value="Medium">Medium</option>

                  <option value="High">High</option>
                </select>
              </div>

              {/* =========================================
                  CHECKLIST
              ========================================= */}

              <div className="checklist-section">
                <div className="checklist-header">
                  <div>
                    <h3>Task Checklist</h3>

                    <p>Add the steps students need to complete.</p>
                  </div>

                  <span>
                    {formData.tasks.length} Item
                    {formData.tasks.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="checklist-items">
                  {formData.tasks.map((task, index) => (
                    <div className="checklist-item" key={index}>
                      <div className="checklist-number">{index + 1}</div>

                      <div className="checklist-inputs">
                        <input
                          type="text"
                          placeholder={`Task ${index + 1} title`}
                          value={task.title}
                          onChange={(e) =>
                            handleChecklistChange(
                              index,
                              "title",
                              e.target.value
                            )
                          }
                          required
                        />

                        <input
                          type="text"
                          placeholder="Optional description"
                          value={task.description}
                          onChange={(e) =>
                            handleChecklistChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <button
                        type="button"
                        className="remove-checklist-btn"
                        onClick={() => removeChecklistTask(index)}
                        disabled={formData.tasks.length === 1}
                        title="Remove task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="add-checklist-btn"
                  onClick={addChecklistTask}
                >
                  <ListPlus size={17} />
                  Add Another Task
                </button>
              </div>

              {/* FOOTER */}

              <div className="task-modal-footer">
                <button
                  type="button"
                  className="cancel-task-btn"
                  onClick={closeModal}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-task-btn"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={() =>
          setAlert((prev) => ({
            ...prev,
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

export default TeacherTasks;