import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Users,
  Trash2,
} from "lucide-react";

import api from "../../services/api";
import AlertModal from "../../components/common/AlertModal";
import "./AdminTasks.css";

/* =====================================================
   INITIAL FORM STATE
===================================================== */

const initialFormState = {
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
};

/* =====================================================
   COMPONENT
===================================================== */

const AdminTasks = () => {
  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [tasks, setTasks] =
    useState([]);

  const [
    batchTimings,
    setBatchTimings,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [formError, setFormError] =
    useState("");
const [alert, setAlert] = useState({
  isOpen: false,
  type: "info",
  title: "",
  message: "",
});
  const [formData, setFormData] =
    useState(initialFormState);

  /* =====================================================
     FETCH ALL TASKS
  ===================================================== */

  const fetchTasks = async () => {
    try {
      setError("");

      const response =
        await api.get("/tasks");

      if (
        response.data?.success !== false
      ) {
        setTasks(
          response.data?.tasks || []
        );
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error(
        "Fetch Tasks Error:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load tasks"
      );

      setTasks([]);
    }
  };

  /* =====================================================
     FETCH BATCHES
  ===================================================== */

  const fetchBatchTimings =
    async () => {
      try {
        const response =
          await api.get("/batches/public");

        const batches =
          response.data?.batches || [];

        const activeBatches =
          batches.filter(
            (batch) =>
              batch.status !==
              "COMPLETED"
          );

        const timings =
          activeBatches
            .map(
              (batch) =>
                batch.batchTiming
            )
            .filter(Boolean);

        setBatchTimings(activeBatches);
      } catch (error) {
        console.error(
          "Fetch Batch Error:",
          error.response?.data || error
        );

        setBatchTimings([]);
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
          fetchTasks(),
          fetchBatchTimings(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =====================================================
     NORMALIZE STATUS
  ===================================================== */

  const getStatus = (task) => {
    if (
      task.displayStatus ===
      "Completed"
    ) {
      return "Completed";
    }

    if (
      task.displayStatus ===
      "Overdue"
    ) {
      return "Pending";
    }

    if (
      task.displayStatus ===
      "Draft"
    ) {
      return "Pending";
    }

    return "In Progress";
  };

  /* =====================================================
     FILTER TASKS
  ===================================================== */

  const filteredTasks =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return tasks.filter(
        (task) => {
          const matchesSearch =
            !searchValue ||
            task.title
              ?.toLowerCase()
              .includes(
                searchValue
              ) ||
            task.batch
              ?.toLowerCase()
              .includes(
                searchValue
              );

          const displayStatus =
            getStatus(task);

          const matchesStatus =
            statusFilter === "All" ||
            displayStatus ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      tasks,
      search,
      statusFilter,
    ]);

  /* =====================================================
     STATS
  ===================================================== */

  const totalTasks =
    tasks.length;

  const inProgressTasks =
    tasks.filter(
      (task) =>
        getStatus(task) ===
        "In Progress"
    ).length;

  const completedTasks =
    tasks.filter(
      (task) =>
        getStatus(task) ===
        "Completed"
    ).length;

  const pendingTasks =
    tasks.filter(
      (task) =>
        getStatus(task) ===
        "Pending"
    ).length;

  /* =====================================================
     OPEN MODAL
  ===================================================== */

  const handleOpenModal = () => {
    setFormError("");

    setFormData(
      initialFormState
    );

    setShowModal(true);
  };

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const handleCloseModal = () => {
    if (submitting) return;

    setShowModal(false);

    setFormError("");

    setFormData(
      initialFormState
    );
  };

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  /* =====================================================
     CHECKLIST TASK CHANGE
  ===================================================== */

  const handleChecklistChange = (
    index,
    field,
    value
  ) => {
    setFormData(
      (previous) => {
        const updatedTasks =
          [...previous.tasks];

        updatedTasks[index] = {
          ...updatedTasks[index],
          [field]: value,
        };

        return {
          ...previous,
          tasks:
            updatedTasks,
        };
      }
    );
  };

  /* =====================================================
     ADD CHECKLIST TASK
  ===================================================== */

  const handleAddChecklistTask = () => {
    setFormData(
      (previous) => ({
        ...previous,

        tasks: [
          ...previous.tasks,
          {
            title: "",
            description: "",
          },
        ],
      })
    );
  };

  /* =====================================================
     REMOVE CHECKLIST TASK
  ===================================================== */

  const handleRemoveChecklistTask = (
    index
  ) => {
    if (
      formData.tasks.length === 1
    ) {
      return;
    }

    setFormData(
      (previous) => ({
        ...previous,

        tasks:
          previous.tasks.filter(
            (_, taskIndex) =>
              taskIndex !== index
          ),
      })
    );
  };

  /* =====================================================
     CREATE TASK
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      setFormError("");

      if (
        !formData.title.trim()
      ) {
        setFormError(
          "Task title is required"
        );

        return;
      }

      if (!formData.batch) {
        setFormError(
          "Please select a batch"
        );

        return;
      }

      if (!formData.dueDate) {
        setFormError(
          "Please select due date"
        );

        return;
      }

      const validTasks =
        formData.tasks.filter(
          (task) =>
            task.title?.trim()
        );

      if (
        validTasks.length === 0
      ) {
        setFormError(
          "Add at least one checklist task"
        );

        return;
      }

      if (
        validTasks.length !==
        formData.tasks.length
      ) {
        setFormError(
          "Please fill all checklist task titles or remove empty tasks"
        );

        return;
      }

      const payload = {
        title:
          formData.title.trim(),

        description:
          formData.description.trim(),

       
          batchId: formData.batch,

        priority:
          formData.priority,

        dueDate:
          formData.dueDate,

        tasks:
          validTasks.map(
            (task) => ({
              title:
                task.title.trim(),

              description:
                task.description.trim(),
            })
          ),
      };

      await api.post(
        "/tasks",
        payload
      );

      await fetchTasks();

      handleCloseModal();
    } catch (error) {
      console.error(
        "Create Task Error:",
        error.response?.data || error
      );

      setFormError(
        error.response?.data?.message ||
          "Failed to create task"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     DELETE TASK
  ===================================================== */

  /* =====================================================
   DELETE TASK
===================================================== */

const handleDeleteTask = async (task) => {
  try {
   

    const response = await api.delete(
      `/tasks/${task._id}`
    );

    

    setTasks((previousTasks) =>
      previousTasks.filter(
        (item) => item._id !== task._id
      )
    );

   setAlert({
  isOpen: true,
  type: "success",
  title: "Task Deleted",
  message:
    response.data?.message ||
    "Task deleted successfully",
});
  } catch (error) {
    console.error(
      "❌ Delete Task Error:",
      error.response?.data || error
    );

   setAlert({
  isOpen: true,
  type: "error",
  title: "Delete Failed",
  message:
    error.response?.data?.message ||
    "Failed to delete task",
});
  }
};

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="admin-tasks-page">
        <p
          style={{
            padding: "40px",
          }}
        >
          Loading tasks...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-tasks-page">

      {/* HEADER */}

      <div className="admin-tasks-header">

        <div>

          <span className="admin-page-label">
            ADMIN PORTAL
          </span>

          <h1>
            Tasks Management
          </h1>

          <p>
            Create, assign and monitor student
            tasks across batches.
          </p>

        </div>

        <button
          className="create-task-btn"
          onClick={
            handleOpenModal
          }
        >

          <Plus size={18} />

          Create Task

        </button>

      </div>

      {/* STATS */}

      <div className="task-stats-grid">

        <div className="task-stat-card">

          <div className="task-stat-icon navy">
            <ClipboardList size={21} />
          </div>

          <div>

            <span>
              Total Tasks
            </span>

            <strong>
              {totalTasks}
            </strong>

            <small>
              All assignments
            </small>

          </div>

        </div>

        <div className="task-stat-card">

          <div className="task-stat-icon yellow">
            <Clock size={21} />
          </div>

          <div>

            <span>
              In Progress
            </span>

            <strong>
              {inProgressTasks}
            </strong>

            <small>
              Active assignments
            </small>

          </div>

        </div>

        <div className="task-stat-card">

          <div className="task-stat-icon green">
            <CheckCircle2 size={21} />
          </div>

          <div>

            <span>
              Completed
            </span>

            <strong>
              {completedTasks}
            </strong>

            <small>
              Successfully finished
            </small>

          </div>

        </div>

        <div className="task-stat-card">

          <div className="task-stat-icon red">
            <AlertCircle size={21} />
          </div>

          <div>

            <span>
              Pending
            </span>

            <strong>
              {pendingTasks}
            </strong>

            <small>
              Needs attention
            </small>

          </div>

        </div>

      </div>

      {/* MAIN CARD */}

      <div className="admin-tasks-card">

        <div className="admin-tasks-card-header">

          <div>

            <h2>
              All Tasks
            </h2>

            <p>
              Monitor assignments and student submissions.
            </p>

          </div>

          <div className="task-header-actions">

            <div className="task-search">

              <Search size={17} />

              <input
                type="text"
                placeholder="Search task..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >

              <option value="All">
                All Status
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="In Progress">
                In Progress
              </option>

              <option value="Completed">
                Completed
              </option>

            </select>

          </div>

        </div>

        {/* TASK LIST */}

        <div className="admin-task-list">

          {error ? (

            <div className="no-tasks-found">
              {error}
            </div>

          ) : filteredTasks.length === 0 ? (

            <div className="no-tasks-found">
              No tasks found.
            </div>

          ) : (

            filteredTasks.map(
              (task) => {

                const submitted =
                  task.submitted || 0;

                const totalStudents =
                  task.totalStudents || 0;

                const progress =
                  totalStudents > 0
                    ? (
                        submitted /
                        totalStudents
                      ) *
                      100
                    : 0;

                const displayStatus =
                  getStatus(task);

                return (

                  <div
                    className="admin-task-item"
                    key={task._id}
                  >

                    <div className="task-main-info">

                      <div className="task-item-icon">

                        <ClipboardList
                          size={20}
                        />

                      </div>

                      <div className="task-title-info">

                        <h3>
                          {task.title}
                        </h3>

                        <div className="task-meta">

                          <span>

                            <Users
                              size={13}
                            />

                            {task.batch}

                          </span>

                          <span>

                            <Calendar
                              size={13}
                            />

                            Due:{" "}

                            {formatDate(
                              task.dueDate
                            )}

                          </span>

                        </div>

                      </div>

                    </div>

                    <div className="task-assignment-info">

                      <span>
                        Assigned To
                      </span>

                      <strong>
                        All Students
                      </strong>

                    </div>

                    <div className="task-submission-info">

                      <span>
                        Submissions
                      </span>

                      <strong>

                        {submitted}/
                        {totalStudents}

                      </strong>

                      <div className="submission-progress">

                        <div
                          style={{
                            width:
                              `${Math.min(
                                progress,
                                100
                              )}%`,
                          }}
                        />

                      </div>

                    </div>

                    <div className="task-status-info">

  <div className="task-status-badges">

    <span
      className={`task-priority ${task.priority?.toLowerCase()}`}
    >
      {task.priority}
    </span>

    <span
      className={`task-status ${
        displayStatus
          .toLowerCase()
          .replace(" ", "-")
      }`}
    >
      {displayStatus}
    </span>

  </div>

  <button
    type="button"
    className="delete-task-btn"
    onClick={() =>
      handleDeleteTask(task)
    }
    title="Delete Task"
    aria-label={`Delete ${task.title}`}
  >
    <Trash2 size={17} />
  </button>

</div>

                  </div>
                );
              }
            )
          )}

        </div>

      </div>

      {/* CREATE TASK MODAL */}

      {showModal && (

        <div className="task-modal-overlay">

          <div className="task-modal">

            <div className="task-modal-header">

              <div>

                <h2>
                  Create New Task
                </h2>

                <p>
                  Create an assignment for students.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseModal
                }
                disabled={
                  submitting
                }
              >

                <X size={20} />

              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="task-form">

                {formError && (

                  <div
                    className="student-form-error"
                  >

                    {formError}

                  </div>

                )}

                <div className="task-form-group">

                  <label>
                    Task Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    placeholder="Enter task title"
                    value={
                      formData.title
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      submitting
                    }
                  />

                </div>

                <div className="task-form-group">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    placeholder="Write task instructions..."
                    rows="4"
                    value={
                      formData.description
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      submitting
                    }
                  />

                </div>

                <div className="task-form-row">

                  <div className="task-form-group">

                    <label>
                      Assign Batch
                    </label>

                    <select
                      name="batch"
                      value={
                        formData.batch
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitting
                      }
                    >

                      <option value="">
                        Select Batch
                      </option>

                    {batchTimings.map((batch) => (
  <option
    key={batch._id}
    value={batch._id}
  >
    {batch.batchTiming}
  </option>
))}

                    </select>

                  </div>

                  <div className="task-form-group">

                    <label>
                      Priority
                    </label>

                    <select
                      name="priority"
                      value={
                        formData.priority
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitting
                      }
                    >

                      <option value="Low">
                        Low
                      </option>

                      <option value="Medium">
                        Medium
                      </option>

                      <option value="High">
                        High
                      </option>

                    </select>

                  </div>

                </div>

                <div className="task-form-group">

                  <label>
                    Due Date
                  </label>

                  <input
                    type="date"
                    name="dueDate"
                    value={
                      formData.dueDate
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      submitting
                    }
                  />

                </div>

                {/* CHECKLIST */}

                <div className="task-form-group">

                  <label>
                    Task Checklist
                  </label>

                  {formData.tasks.map(
                    (
                      task,
                      index
                    ) => (

                   <div
  key={index}
  className="admin-checklist-row"
>

                        <input className="admin-checklist-input"
                          type="text"
                          placeholder={`Checklist task ${index + 1}`}
                          value={
                            task.title
                          }
                          onChange={(e) =>
                            handleChecklistChange(
                              index,
                              "title",
                              e.target.value
                            )
                          }
                          disabled={
                            submitting
                          }
                        />

                        {formData.tasks
                          .length > 1 && (

                          <button className="admin-checklist-remove-btn"
                            type="button"
                            onClick={() =>
                              handleRemoveChecklistTask(
                                index
                              )
                            }
                            disabled={
                              submitting
                            }
                          >

                            <X
                              size={16}
                            />

                          </button>

                        )}

                      </div>
                    )
                  )}

                  <button
                    type="button"
                      className="admin-add-checklist-btn"
                    onClick={
                      handleAddChecklistTask
                    }
                    disabled={
                      submitting
                    }
                  >

                    + Add Checklist Item

                  </button>

                </div>

              </div>

              <div className="task-modal-footer">

                <button
                  type="button"
                  className="cancel-task-btn"
                  onClick={
                    handleCloseModal
                  }
                  disabled={
                    submitting
                  }
                >

                  Cancel

                </button>

                <button
                  type="submit"
                  className="save-task-btn"
                  disabled={
                    submitting
                  }
                >

                  {submitting
                    ? "Creating..."
                    : "Create Task"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}
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

export default AdminTasks;