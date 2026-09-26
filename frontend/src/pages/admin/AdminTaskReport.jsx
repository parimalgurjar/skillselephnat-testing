import { useEffect, useState } from "react";

import {
  ClipboardCheck,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  ListChecks,
  X,
  Loader2,
  AlertCircle,
  UsersRound,
UserCheck,
} from "lucide-react";

import api from "../../services/api";
import AlertModal from "../../components/common/AlertModal";
import "./AdminTaskReport.css";

const AdminTaskReport = () => {
  /* =====================================================
     STATE
  ===================================================== */

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
const [alert, setAlert] = useState({
  isOpen: false,
  type: "info",
  title: "",
  message: "",
});
  const [expandedCategories, setExpandedCategories] =
    useState({});

  /* CATEGORY MODAL */

  const [showCategoryModal, setShowCategoryModal] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [categoryName, setCategoryName] =
    useState("");

  const [categoryDescription, setCategoryDescription] =
    useState("");

  const [categoryOrder, setCategoryOrder] =
    useState("");

  /* TASK MODAL */

  const [showTaskModal, setShowTaskModal] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState(null);

  const [selectedCategoryId, setSelectedCategoryId] =
    useState("");

  const [taskTitle, setTaskTitle] =
    useState("");

  const [taskDescription, setTaskDescription] =
    useState("");

  const [taskOrder, setTaskOrder] =
    useState("");

  /* COMMON */

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

    /* =====================================================
   TASK REPORT REVIEWERS
===================================================== */

const [teachers, setTeachers] =
  useState([]);

const [assignedTeacherIds, setAssignedTeacherIds] =
  useState([]);

const [draftReviewerIds, setDraftReviewerIds] =
  useState([]);

const [showReviewerModal, setShowReviewerModal] =
  useState(false);

const [reviewersLoading, setReviewersLoading] =
  useState(false);

  /* =====================================================
     FETCH MASTER TASK REPORT
  ===================================================== */

  const fetchTaskReport = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await api.get(
        "/task-report/master"
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to load task report"
        );
      }

      const data =
        response.data.categories || [];

      setCategories(data);

      setExpandedCategories((previous) => {
        const updated = {};

        data.forEach((category) => {
          updated[category._id] =
            previous[category._id] ?? true;
        });

        return updated;
      });
    } catch (err) {
      console.error(
        "Fetch Task Report Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load task report"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  /* =====================================================
   FETCH REVIEWER SETTINGS + ACTIVE TEACHERS
===================================================== */

/* =====================================================
   FETCH REVIEWER SETTINGS + TEACHERS
===================================================== */

const fetchReviewerData = async () => {
  try {
    const [
      teachersResponse,
      settingsResponse,
    ] = await Promise.all([
      api.get("/teachers"),
      api.get("/task-report/settings"),
    ]);

    

   const allTeachers =
  teachersResponse.data?.teachers || [];

const activeTeachers = allTeachers.filter(
  (teacher) =>
    teacher.isActive === true &&
    teacher.status === "ACTIVE"
);

setTeachers(activeTeachers);

    const assignedTeachers =
      settingsResponse.data?.settings
        ?.assignedTeachers || [];

    setAssignedTeacherIds(
      assignedTeachers.map((teacher) =>
        typeof teacher === "object"
          ? teacher._id
          : teacher
      )
    );

  } catch (err) {
    console.error(
      "Fetch Task Report Reviewer Data Error:",
      err.response?.data || err
    );

    setTeachers([]);
  }
};

  useEffect(() => {
  const loadPage = async () => {
    await Promise.all([
      fetchTaskReport(true),
      fetchReviewerData(),
    ]);
  };

  loadPage();
}, []);

/* =====================================================
   REVIEWER MODAL
===================================================== */

const openReviewerModal = () => {
  setDraftReviewerIds(
    assignedTeacherIds
  );

  setFormError("");

  setShowReviewerModal(true);
};


const closeReviewerModal = () => {
  if (reviewersLoading) return;

  setShowReviewerModal(false);

  setFormError("");
};


const toggleReviewer = (teacherId) => {
  setDraftReviewerIds((previous) =>
    previous.includes(teacherId)
      ? previous.filter(
          (id) => id !== teacherId
        )
      : [
          ...previous,
          teacherId,
        ]
  );
};


const handleSaveReviewers = async () => {
  try {
    setReviewersLoading(true);

    setFormError("");

    const response = await api.put(
      "/task-report/settings",
      {
        assignedTeachers:
          draftReviewerIds,
      }
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          "Unable to update reviewers"
      );
    }

    setAssignedTeacherIds(
      draftReviewerIds
    );

    await fetchReviewerData();

    setShowReviewerModal(false);

  } catch (err) {
    console.error(
      "Save Task Report Reviewers Error:",
      err
    );

    setFormError(
      err.response?.data?.message ||
        err.message ||
        "Unable to update reviewers"
    );

  } finally {
    setReviewersLoading(false);
  }
};

  /* =====================================================
     TOGGLE CATEGORY
  ===================================================== */

  const toggleCategory = (categoryId) => {
    setExpandedCategories((previous) => ({
      ...previous,
      [categoryId]:
        !previous[categoryId],
    }));
  };

  /* =====================================================
     CATEGORY MODAL HELPERS
  ===================================================== */

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryOrder("");
    setFormError("");
  };

  const openAddCategoryModal = () => {
    resetCategoryForm();
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (category) => {
    setEditingCategory(category);

    setCategoryName(
      category.name || ""
    );

    setCategoryDescription(
      category.description || ""
    );

    setCategoryOrder(
      category.order ?? ""
    );

    setFormError("");
    setShowCategoryModal(true);
  };

  const closeCategoryModal = (force = false) => {
    if (saving && !force) return;

    setShowCategoryModal(false);
    resetCategoryForm();
  };

  /* =====================================================
     SAVE CATEGORY
  ===================================================== */

  const handleSaveCategory = async (event) => {
    event.preventDefault();

    if (!categoryName.trim()) {
      setFormError(
        "Category name is required"
      );
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const parsedOrder =
        categoryOrder === ""
          ? 0
          : Number(categoryOrder);

      const payload = {
        name: categoryName.trim(),
        description:
          categoryDescription.trim(),
        order: Number.isNaN(parsedOrder)
          ? 0
          : parsedOrder,
      };

      if (editingCategory?._id) {
        await api.put(
          `/task-report/categories/${editingCategory._id}`,
          payload
        );
      } else {
        await api.post(
          "/task-report/categories",
          payload
        );
      }

      await fetchTaskReport(false);

      closeCategoryModal(true);
    } catch (err) {
      console.error(
        "Save Category Error:",
        err
      );

      setFormError(
        err.response?.data?.message ||
          "Unable to save category"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE CATEGORY
  ===================================================== */
const handleDeleteCategory = async (category) => {
  

  try {
    const response = await api.delete(
      `/task-report/categories/${category._id}`
    );

 

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          "Unable to delete category"
      );
    }

    // Immediately remove category from UI
    setCategories((previousCategories) =>
      previousCategories.filter(
        (currentCategory) =>
          currentCategory._id !== category._id
      )
    );

    // Remove category expand state
    setExpandedCategories((previous) => {
      const updated = { ...previous };

      delete updated[category._id];

      return updated;
    });



  } catch (err) {
    console.error(
      "❌ Delete Category Error:",
      err.response?.data || err
    );

  setAlert({
  isOpen: true,
  type: "error",
  title: "Delete Category Failed",
  message:
    err.response?.data?.message ||
    err.message ||
    "Unable to delete category",
});
  }
};

  /* =====================================================
     TASK MODAL HELPERS
  ===================================================== */

  const resetTaskForm = () => {
    setEditingTask(null);
    setSelectedCategoryId("");
    setTaskTitle("");
    setTaskDescription("");
    setTaskOrder("");
    setFormError("");
  };

  const openAddTaskModal = (categoryId) => {
    resetTaskForm();

    setSelectedCategoryId(categoryId);

    setShowTaskModal(true);
  };

  const openEditTaskModal = (
    task,
    categoryId
  ) => {
    setEditingTask(task);

    setSelectedCategoryId(
      task.categoryId || categoryId
    );

    setTaskTitle(
      task.title || ""
    );

    setTaskDescription(
      task.description || ""
    );

    setTaskOrder(
      task.order ?? ""
    );

    setFormError("");
    setShowTaskModal(true);
  };

  const closeTaskModal = (force = false) => {
    if (saving && !force) return;

    setShowTaskModal(false);
    resetTaskForm();
  };

  /* =====================================================
     SAVE TASK
  ===================================================== */

  const handleSaveTask = async (event) => {
    event.preventDefault();

    if (!selectedCategoryId) {
      setFormError(
        "Please select a category"
      );
      return;
    }

    if (!taskTitle.trim()) {
      setFormError(
        "Task title is required"
      );
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const parsedOrder =
        taskOrder === ""
          ? 0
          : Number(taskOrder);

      const payload = {
        categoryId: selectedCategoryId,
        title: taskTitle.trim(),
        description:
          taskDescription.trim(),
        order: Number.isNaN(parsedOrder)
          ? 0
          : parsedOrder,
      };

      if (editingTask?._id) {
        await api.put(
          `/task-report/master/tasks/${editingTask._id}`,
          payload
        );
      } else {
        await api.post(
          "/task-report/master/tasks",
          payload
        );
      }

      await fetchTaskReport(false);

      closeTaskModal(true);
    } catch (err) {
      console.error(
        "Save Task Error:",
        err
      );

      setFormError(
        err.response?.data?.message ||
          "Unable to save task"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE TASK
  ===================================================== */
const handleDeleteTask = async (task) => {
  try {
    const response = await api.delete(
      `/task-report/master/tasks/${task._id}`
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
        "Unable to delete task"
      );
    }

    setCategories((previousCategories) =>
      previousCategories.map((category) => ({
        ...category,
        tasks: (category.tasks || []).filter(
          (currentTask) =>
            currentTask._id !== task._id
        ),
      }))
    );

  } catch (err) {
    console.error(
      "Delete Task Error:",
      err.response?.data || err
    );

    setAlert({
  isOpen: true,
  type: "error",
  title: "Delete Task Failed",
  message:
    err.response?.data?.message ||
    err.message ||
    "Unable to delete task",
});
  }
};


  /* =====================================================
     CALCULATIONS
  ===================================================== */

  const totalCategories =
    categories.length;

  const totalTasks =
    categories.reduce(
      (total, category) =>
        total +
        (category.tasks?.length || 0),
      0
    );

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="admin-task-report-page">
        <div className="task-report-loading">
          <Loader2
            size={32}
            className="task-report-spinner"
          />

          <p>
            Loading task report...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="admin-task-report-page">

      {/* HEADER */}

      <div className="admin-task-report-header">
        <div>
          <span className="task-report-label">
            ADMIN PANEL
          </span>

          <h1>
            Task Report Management
          </h1>

          <p>
            Create and manage the master task
            report for all students.
          </p>
        </div>

        <button
    type="button"
    className="manage-reviewers-btn"
    onClick={openReviewerModal}
  >
    <UsersRound size={18} />

    Manage Reviewers

    {assignedTeacherIds.length > 0 && (
      <span>
        {assignedTeacherIds.length}
      </span>
    )}
  </button>


  <button
    type="button"
    className="add-category-btn"
    onClick={openAddCategoryModal}
  >
    <FolderPlus size={18} />

    Add Category
  </button>
      </div>

      {/* SUMMARY */}

      <div className="task-report-summary">

        <div className="task-report-summary-card">
          <div className="summary-card-icon blue">
            <ClipboardCheck size={22} />
          </div>

          <div>
            <span>Total Categories</span>
            <h2>{totalCategories}</h2>
          </div>
        </div>

        <div className="task-report-summary-card">
          <div className="summary-card-icon yellow">
            <ListChecks size={22} />
          </div>

          <div>
            <span>Total Tasks</span>
            <h2>{totalTasks}</h2>
          </div>
        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="task-report-error">
          <AlertCircle size={19} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              fetchTaskReport(false)
            }
            disabled={refreshing}
          >
            {refreshing
              ? "Loading..."
              : "Try Again"}
          </button>
        </div>
      )}

      {/* EMPTY STATE */}

      {!error &&
        categories.length === 0 && (
          <div className="task-report-empty">

            <div className="empty-icon">
              <ClipboardCheck size={42} />
            </div>

            <h3>
              No Task Categories Yet
            </h3>

            <p>
              Start by creating a category
              for your student task report.
            </p>

            <button
              type="button"
              onClick={openAddCategoryModal}
            >
              <Plus size={18} />
              Create First Category
            </button>

          </div>
        )}

      {/* CATEGORY LIST */}

      {!error && (
        <div className="task-report-categories">

          {categories.map(
            (category, categoryIndex) => {
              const isExpanded =
                expandedCategories[
                  category._id
                ];

              const categoryTasks =
                category.tasks || [];

              return (
                <div
                  className="task-report-category"
                  key={category._id}
                >

                  {/* CATEGORY HEADER */}

                  <div className="category-header">

                    <button
                      type="button"
                      className="category-expand-btn"
                      onClick={() =>
                        toggleCategory(
                          category._id
                        )
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>

                    <div className="category-number">
                      {String(
                        categoryIndex + 1
                      ).padStart(2, "0")}
                    </div>

                    <div className="category-info">
                      <h2>
                        {category.name}
                      </h2>

                      {category.description && (
                        <p>
                          {category.description}
                        </p>
                      )}
                    </div>

                    <div className="category-task-count">
                      {categoryTasks.length}{" "}
                      Task
                      {categoryTasks.length !== 1
                        ? "s"
                        : ""}
                    </div>

                    <div className="category-actions">

                      <button
                        type="button"
                        className="category-action-btn edit"
                        title="Edit Category"
                        onClick={() =>
                          openEditCategoryModal(
                            category
                          )
                        }
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="category-action-btn delete"
                        title="Delete Category"
                        onClick={() =>
                          handleDeleteCategory(
                            category
                          )
                        }
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>
                  </div>

                  {/* CATEGORY CONTENT */}

                  {isExpanded && (
                    <div className="category-content">

                      {categoryTasks.length === 0 ? (
                        <div className="no-category-tasks">
                          No tasks in this category.
                        </div>
                      ) : (
                        <div className="category-task-list">

                          {categoryTasks.map(
                            (task, taskIndex) => (
                              <div
                                className="admin-report-task"
                                key={task._id}
                              >

                                <div className="admin-report-task-number">
                                  {taskIndex + 1}
                                </div>

                                <div className="admin-report-task-info">
                                  <h3>
                                    {task.title}
                                  </h3>

                                  {task.description && (
                                    <p>
                                      {
                                        task.description
                                      }
                                    </p>
                                  )}
                                </div>

                                <div className="admin-report-task-actions">

                                  <button
                                    type="button"
                                    className="task-edit-btn"
                                    onClick={() =>
                                      openEditTaskModal(
                                        task,
                                        category._id
                                      )
                                    }
                                  >
                                    <Pencil size={16} />
                                    Edit
                                  </button>

                                <button
  type="button"
  className="task-delete-btn"
  onClick={() =>
    handleDeleteTask(task)
  }
  title="Delete Task"
  aria-label="Delete Task"
>
  <Trash2 size={16} />
</button>

                                </div>

                              </div>
                            )
                          )}

                        </div>
                      )}

                      <button
                        type="button"
                        className="add-task-btn"
                        onClick={() =>
                          openAddTaskModal(
                            category._id
                          )
                        }
                      >
                        <Plus size={17} />
                        Add Task
                      </button>

                    </div>
                  )}

                </div>
              );
            }
          )}

        </div>
      )}

      {/* =====================================================
   REVIEWER ASSIGNMENT MODAL
===================================================== */}

{showReviewerModal && (

  <div className="task-report-modal-overlay">

    <div className="task-report-modal reviewer-modal">

      <button
        type="button"
        className="task-report-modal-close"
        onClick={closeReviewerModal}
        disabled={reviewersLoading}
      >
        <X size={20} />
      </button>


      <div className="task-report-modal-header">

        <div className="modal-header-icon">
          <UsersRound size={23} />
        </div>


        <div>

          <h2>
            Assign Task Report Reviewers
          </h2>

          <p>
            Only selected teachers can approve
            or reject student Task Report
            submissions.
          </p>

        </div>

      </div>


      <div className="reviewer-list">

        {teachers.length === 0 ? (

          <div className="reviewer-empty">
            No teachers available.
          </div>

        ) : (

          teachers.map((teacher) => {

            const isAssigned =
              draftReviewerIds.includes(
                teacher._id
              );

            return (

              <label
                className={`reviewer-item ${
                  isAssigned
                    ? "assigned"
                    : ""
                }`}
                key={teacher._id}
              >

                <input
                  type="checkbox"
                  checked={isAssigned}
                  onChange={() =>
                    toggleReviewer(
                      teacher._id
                    )
                  }
                  disabled={
                    reviewersLoading
                  }
                />


                <div className="reviewer-avatar">

                  {teacher.name
                    ?.charAt(0)
                    ?.toUpperCase() || "T"}

                </div>


                <div className="reviewer-info">

                  <strong>
                    {teacher.name}
                  </strong>

                  <span>
                    {teacher.email}
                  </span>

                </div>


                {isAssigned && (

                  <UserCheck
                    className="reviewer-check"
                    size={20}
                  />

                )}

              </label>

            );

          })

        )}

      </div>


      {formError && (

        <div className="task-report-form-error">
          {formError}
        </div>

      )}


      <div className="task-report-modal-actions">

        <button
          type="button"
          className="modal-cancel-btn"
          onClick={closeReviewerModal}
          disabled={reviewersLoading}
        >
          Cancel
        </button>


        <button
          type="button"
          className="modal-save-btn"
          onClick={handleSaveReviewers}
          disabled={reviewersLoading}
        >

          {reviewersLoading ? (

            <>
              <Loader2
                size={17}
                className="task-report-spinner"
              />

              Saving...
            </>

          ) : (

            <>
              <UserCheck size={17} />

              Save Reviewers
            </>

          )}

        </button>

      </div>

    </div>

  </div>

)}

      {/* CATEGORY MODAL */}

      {showCategoryModal && (
        <div className="task-report-modal-overlay">

          <div className="task-report-modal">

            <button
              type="button"
              className="task-report-modal-close"
              onClick={() =>
                closeCategoryModal()
              }
              disabled={saving}
            >
              <X size={20} />
            </button>

            <div className="task-report-modal-header">

              <div className="modal-header-icon">
                <FolderPlus size={23} />
              </div>

              <div>
                <h2>
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p>
                  Organize tasks into categories.
                </p>
              </div>

            </div>

            <form onSubmit={handleSaveCategory}>

              <div className="task-report-form-group">
                <label>
                  Category Name
                </label>

                <input
                  type="text"
                  placeholder="Example: Website Development"
                  value={categoryName}
                  onChange={(event) =>
                    setCategoryName(
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>

              <div className="task-report-form-group">
                <label>
                  Description
                  <span>Optional</span>
                </label>

                <textarea
                  rows="3"
                  placeholder="Brief category description..."
                  value={categoryDescription}
                  onChange={(event) =>
                    setCategoryDescription(
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>

              <div className="task-report-form-group">
                <label>
                  Display Order
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={categoryOrder}
                  onChange={(event) =>
                    setCategoryOrder(
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>

              {formError && (
                <div className="task-report-form-error">
                  {formError}
                </div>
              )}

              <div className="task-report-modal-actions">

                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() =>
                    closeCategoryModal()
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="task-report-spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />

                      {editingCategory
                        ? "Update Category"
                        : "Add Category"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* TASK MODAL */}

      {showTaskModal && (
        <div className="task-report-modal-overlay">

          <div className="task-report-modal">

            <button
              type="button"
              className="task-report-modal-close"
              onClick={() =>
                closeTaskModal()
              }
              disabled={saving}
            >
              <X size={20} />
            </button>

            <div className="task-report-modal-header">

              <div className="modal-header-icon">
                <ListChecks size={23} />
              </div>

              <div>
                <h2>
                  {editingTask
                    ? "Edit Task"
                    : "Add Task"}
                </h2>

                <p>
                  Add a task to the student task
                  report.
                </p>
              </div>

            </div>

            <form onSubmit={handleSaveTask}>

              <div className="task-report-form-group">

                <label>
                  Category
                </label>

                <select
                  value={selectedCategoryId}
                  onChange={(event) =>
                    setSelectedCategoryId(
                      event.target.value
                    )
                  }
                  disabled={saving}
                >
                  <option value="">
                    Select Category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category._id}
                      value={category._id}
                    >
                      {category.name}
                    </option>
                  ))}

                </select>

              </div>

              <div className="task-report-form-group">

                <label>
                  Task Title
                </label>

                <input
                  type="text"
                  placeholder="Example: Create Homepage"
                  value={taskTitle}
                  onChange={(event) =>
                    setTaskTitle(
                      event.target.value
                    )
                  }
                  disabled={saving}
                />

              </div>

              <div className="task-report-form-group">

                <label>
                  Description
                  <span>Optional</span>
                </label>

                <textarea
                  rows="4"
                  placeholder="Describe what the student needs to complete..."
                  value={taskDescription}
                  onChange={(event) =>
                    setTaskDescription(
                      event.target.value
                    )
                  }
                  disabled={saving}
                />

              </div>

              <div className="task-report-form-group">

                <label>
                  Display Order
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={taskOrder}
                  onChange={(event) =>
                    setTaskOrder(
                      event.target.value
                    )
                  }
                  disabled={saving}
                />

              </div>

              {formError && (
                <div className="task-report-form-error">
                  {formError}
                </div>
              )}

              <div className="task-report-modal-actions">

                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() =>
                    closeTaskModal()
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="task-report-spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />

                      {editingTask
                        ? "Update Task"
                        : "Add Task"}
                    </>
                  )}
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

export default AdminTaskReport;