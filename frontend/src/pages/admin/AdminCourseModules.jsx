import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Power,
  PowerOff,
  RefreshCw,
  Layers,
  Clock3,
  CalendarDays,
  X,
  Save,
} from "lucide-react";

import {
  getModulesByCourse,
  createModule,
  updateModule,
  deactivateModule,
  activateModule,
} from "../../services/moduleApi";

import { getCourses } from "../../services/courseApi";
import "./AdminCourseModules.css";

const AdminCourseModules = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [modules, setModules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    moduleNumber: "",
    durationDays: "",
  });

  // =========================
  // LOAD COURSES
  // =========================

  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      setError("");

      const response = await getCourses();

      const courseList =
        Array.isArray(response)
          ? response
          : response?.courses || response?.data || [];

      setCourses(courseList);

      if (courseList.length > 0 && !selectedCourseId) {
        setSelectedCourseId(
          courseList[0]._id || courseList[0].id
        );
      }
    } catch (err) {
      console.error("Load courses error:", err);

      setError(
        err?.message ||
          "Unable to load courses"
      );
    } finally {
      setCoursesLoading(false);
    }
  };

  // =========================
  // LOAD MODULES
  // =========================

  const loadModules = async () => {
    if (!selectedCourseId) {
      setModules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await getModulesByCourse(
          selectedCourseId
        );

      const moduleList =
        Array.isArray(response)
          ? response
          : response?.modules || response?.data || [];

      const sortedModules = [...moduleList].sort(
        (a, b) =>
          Number(a.moduleNumber || 0) -
          Number(b.moduleNumber || 0)
      );

      setModules(sortedModules);
    } catch (err) {
      console.error("Load modules error:", err);

      setError(
        err?.message ||
          "Unable to load course modules"
      );

      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadModules();
  }, [selectedCourseId]);

  // =========================
  // STATS
  // =========================

  const activeModules = useMemo(
    () =>
      modules.filter(
        (module) => module.isActive !== false
      ),
    [modules]
  );

  const inactiveModules = useMemo(
    () =>
      modules.filter(
        (module) => module.isActive === false
      ),
    [modules]
  );

  const totalDurationDays = useMemo(
    () =>
      activeModules.reduce(
        (total, module) =>
          total +
          Number(module.durationDays || 0),
        0
      ),
    [activeModules]
  );

  const approximateWeeks = Math.ceil(
    totalDurationDays / 7
  );

  const approximateMonths = (
    totalDurationDays / 30
  ).toFixed(1);

  // =========================
  // FORM
  // =========================

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      moduleNumber:
        modules.length + 1,
      durationDays: "",
    });

    setEditingModule(null);
  };

  const openAddModal = () => {
    setSuccess("");
    setError("");

    resetForm();
    setShowModal(true);
  };

  const openEditModal = (module) => {
    setSuccess("");
    setError("");

    setEditingModule(module);

    setFormData({
      name: module.name || "",
      description:
        module.description || "",
      moduleNumber:
        module.moduleNumber || "",
      durationDays:
        module.durationDays || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // SAVE MODULE
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCourseId) {
      setError("Please select a course.");
      return;
    }

    if (!formData.name.trim()) {
      setError("Module name is required.");
      return;
    }

    if (
      !formData.durationDays ||
      Number(formData.durationDays) < 1
    ) {
      setError(
        "Duration must be at least 1 day."
      );
      return;
    }

    if (
      !formData.moduleNumber ||
      Number(formData.moduleNumber) < 1
    ) {
      setError(
        "Module number must be at least 1."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        courseId: selectedCourseId,
        name: formData.name.trim(),
        description:
          formData.description.trim(),
        moduleNumber:
          Number(formData.moduleNumber),
        durationDays:
          Number(formData.durationDays),
      };

      if (editingModule) {
        await updateModule(
          editingModule._id,
          payload
        );

        setSuccess(
          "Module updated successfully."
        );
      } else {
        await createModule(payload);

        setSuccess(
          "Module created successfully."
        );
      }

      setShowModal(false);
      resetForm();

      await loadModules();
    } catch (err) {
      console.error(
        "Save module error:",
        err
      );

      setError(
        err?.message ||
          "Unable to save module."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // TOGGLE STATUS
  // =========================

  const handleToggleStatus = async (
    module
  ) => {
    const isActive =
      module.isActive !== false;

    const action =
      isActive
        ? deactivateModule
        : activateModule;

    try {
      setError("");
      setSuccess("");

      await action(module._id);

      setSuccess(
        isActive
          ? "Module deactivated successfully."
          : "Module activated successfully."
      );

      await loadModules();
    } catch (err) {
      console.error(
        "Toggle module status error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update module status."
      );
    }
  };

  // =========================
  // SELECTED COURSE
  // =========================

  const selectedCourse = courses.find(
    (course) =>
      (course._id || course.id) ===
      selectedCourseId
  );

  // =========================
  // RENDER
  // =========================

  return (
    <div className="admin-course-modules">
      {/* HEADER */}

      <div className="admin-course-modules-header">
        <div>
          <div className="admin-course-modules-title-row">
            <div className="admin-course-modules-icon">
              <Layers size={24} />
            </div>

            <div>
              <h1>Course Modules</h1>

              <p>
                Manage your course curriculum,
                module duration and learning order.
              </p>
            </div>
          </div>
        </div>

        <div className="admin-course-modules-actions">
          <button
            type="button"
            className="admin-course-modules-refresh"
            onClick={loadModules}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "admin-course-modules-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            className="admin-course-modules-add"
            onClick={openAddModal}
            disabled={!selectedCourseId}
          >
            <Plus size={18} />

            Add Module
          </button>
        </div>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="admin-course-modules-alert admin-course-modules-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-course-modules-alert admin-course-modules-alert-success">
          {success}
        </div>
      )}

      {/* COURSE SELECTOR */}

      <div className="admin-course-modules-course-selector">
        <div>
          <label>
            Select Course
          </label>

          <select
            value={selectedCourseId}
            onChange={(event) =>
              setSelectedCourseId(
                event.target.value
              )
            }
            disabled={coursesLoading}
          >
            {coursesLoading ? (
              <option value="">
                Loading courses...
              </option>
            ) : courses.length === 0 ? (
              <option value="">
                No courses available
              </option>
            ) : (
              <>
                <option value="">
                  Select a course
                </option>

                {courses.map((course) => (
                  <option
                    key={
                      course._id ||
                      course.id
                    }
                    value={
                      course._id ||
                      course.id
                    }
                  >
                    {course.name ||
                      course.title ||
                      "Untitled Course"}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {selectedCourse && (
          <div className="admin-course-modules-selected-course">
            <span>
              Current Course
            </span>

            <strong>
              {selectedCourse.name ||
                selectedCourse.title}
            </strong>
          </div>
        )}
      </div>

      {/* STATS */}

      <div className="admin-course-modules-stats">
        <div className="admin-course-module-stat-card">
          <div className="admin-course-module-stat-icon">
            <Layers size={20} />
          </div>

          <div>
            <span>
              Total Modules
            </span>

            <strong>
              {modules.length}
            </strong>
          </div>
        </div>

        <div className="admin-course-module-stat-card">
          <div className="admin-course-module-stat-icon">
            <Power size={20} />
          </div>

          <div>
            <span>
              Active Modules
            </span>

            <strong>
              {activeModules.length}
            </strong>
          </div>
        </div>

        <div className="admin-course-module-stat-card">
          <div className="admin-course-module-stat-icon">
            <Clock3 size={20} />
          </div>

          <div>
            <span>
              Planned Days
            </span>

            <strong>
              {totalDurationDays}
            </strong>
          </div>
        </div>

        <div className="admin-course-module-stat-card">
          <div className="admin-course-module-stat-icon">
            <CalendarDays size={20} />
          </div>

          <div>
            <span>
              Approx. Duration
            </span>

            <strong>
              {approximateMonths} months
            </strong>

            <small>
              ~{approximateWeeks} weeks
            </small>
          </div>
        </div>
      </div>

      {/* MODULE LIST */}

      <div className="admin-course-modules-content">
        <div className="admin-course-modules-content-header">
          <div>
            <h2>
              Curriculum Modules
            </h2>

            <p>
              {activeModules.length} active
              module
              {activeModules.length !== 1
                ? "s"
                : ""}{" "}
              · {totalDurationDays} planned
              days
            </p>
          </div>
        </div>

        {loading ? (
          <div className="admin-course-modules-empty">
            <RefreshCw
              size={28}
              className="admin-course-modules-spin"
            />

            <p>
              Loading modules...
            </p>
          </div>
        ) : modules.length === 0 ? (
          <div className="admin-course-modules-empty">
            <Layers size={42} />

            <h3>
              No modules yet
            </h3>

            <p>
              Start building your course
              curriculum by adding the first
              module.
            </p>

            <button
              type="button"
              onClick={openAddModal}
            >
              <Plus size={17} />
              Add First Module
            </button>
          </div>
        ) : (
          <div className="admin-course-modules-list">
            {modules.map(
              (module, index) => {
                const isActive =
                  module.isActive !== false;

                return (
                  <div
                    key={module._id}
                    className={`admin-course-module-card ${
                      !isActive
                        ? "is-inactive"
                        : ""
                    }`}
                  >
                    <div className="admin-course-module-number">
                      {module.moduleNumber ||
                        index + 1}
                    </div>

                    <div className="admin-course-module-main">
                      <div className="admin-course-module-top">
                        <div>
                          <h3>
                            {module.name}
                          </h3>

                          <div className="admin-course-module-meta">
                            <span>
                              <Clock3
                                size={14}
                              />

                              {
                                module.durationDays
                              }{" "}
                              days
                            </span>

                            <span
                              className={
                                isActive
                                  ? "status-active"
                                  : "status-inactive"
                              }
                            >
                              {isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>
                        </div>

                        <div className="admin-course-module-actions">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                module
                              )
                            }
                            title="Edit module"
                          >
                            <Pencil
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            className={
                              isActive
                                ? "danger"
                                : "success"
                            }
                            onClick={() =>
                              handleToggleStatus(
                                module
                              )
                            }
                            title={
                              isActive
                                ? "Deactivate module"
                                : "Activate module"
                            }
                          >
                            {isActive ? (
                              <PowerOff
                                size={17}
                              />
                            ) : (
                              <Power
                                size={17}
                              />
                            )}
                          </button>
                        </div>
                      </div>

                      {module.description && (
                        <p className="admin-course-module-description">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* MODAL */}

      {showModal && (
        <div
          className="admin-course-module-modal-overlay"
          onMouseDown={closeModal}
        >
          <div
            className="admin-course-module-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-course-module-modal-header">
              <div>
                <h2>
                  {editingModule
                    ? "Edit Module"
                    : "Add New Module"}
                </h2>

                <p>
                  Define the curriculum
                  structure and planned duration.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="admin-course-module-form"
            >
              <div className="admin-course-module-form-grid">
                <div className="admin-course-module-field admin-course-module-field-full">
                  <label>
                    Module Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. WordPress"
                    required
                  />
                </div>

                <div className="admin-course-module-field">
                  <label>
                    Module Number
                  </label>

                  <input
                    type="number"
                    name="moduleNumber"
                    min="1"
                    value={
                      formData.moduleNumber
                    }
                    onChange={handleChange}
                    placeholder="1"
                    required
                  />
                </div>

                <div className="admin-course-module-field">
                  <label>
                    Duration (Days)
                  </label>

                  <input
                    type="number"
                    name="durationDays"
                    min="1"
                    value={
                      formData.durationDays
                    }
                    onChange={handleChange}
                    placeholder="8"
                    required
                  />

                  <small>
                    Used for course progress
                    calculation.
                  </small>
                </div>

                <div className="admin-course-module-field admin-course-module-field-full">
                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={handleChange}
                    placeholder="What will students learn in this module?"
                    rows="4"
                  />
                </div>
              </div>

              <div className="admin-course-module-form-footer">
                <button
                  type="button"
                  className="admin-course-module-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-course-module-save"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="admin-course-modules-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />

                      {editingModule
                        ? "Update Module"
                        : "Create Module"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourseModules;