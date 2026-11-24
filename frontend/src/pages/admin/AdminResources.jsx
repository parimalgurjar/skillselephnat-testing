
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FolderOpen,
  Link as LinkIcon,
  X,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { getCourses } from "../../services/courseApi";
import { getModulesByCourse } from "../../services/moduleApi";

import {
  getAdminResources,
  createResource,
  updateResource,
  updateResourceStatus,
  deleteResource,
} from "../../services/resourceApi";

import CustomDropdown from "../../components/common/CustomDropdown";
import "./AdminResources.css";

const initialForm = {
  title: "",
  description: "",
  resourceType: "GOOGLE_DOCS",
  resourceUrl: "",
};

const resourceTypes = [
  { value: "GOOGLE_SHEETS", label: "Google Sheets" },
  { value: "GOOGLE_DOCS", label: "Google Docs" },
  { value: "GOOGLE_DRIVE", label: "Google Drive" },
  { value: "PDF", label: "PDF Document" },
  { value: "EXCEL", label: "Excel Spreadsheet" },
  { value: "OTHER", label: "Other Link" },
];

const statusOptions = [
  { value: "ALL", label: "All Resources" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
];



const getCourseId = (resource) =>
  resource?.courseId?._id || resource?.courseId || "";

const getModuleIds = (resource) =>
  (resource?.modules || []).map((module) =>
    typeof module === "string" ? module : module._id
  );

const getTypeLabel = (type) =>
  resourceTypes.find((item) => item.value === type)?.label || "Other";

const getResourceIcon = (type) => {
  if (type === "GOOGLE_SHEETS" || type === "EXCEL") {
    return FileSpreadsheet;
  }

  if (type === "GOOGLE_DRIVE") {
    return FolderOpen;
  }

  if (type === "PDF" || type === "GOOGLE_DOCS") {
    return FileText;
  }

  return LinkIcon;
};

const AdminResources = () => {
  const [resources, setResources] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);

  const [formData, setFormData] = useState(initialForm);
  const [editingResource, setEditingResource] = useState(null);

  const [loading, setLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch all resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminResources();
      setResources(response?.resources || []);
    } catch (err) {
      console.error("Fetch resources error:", err);
      setError(err.message || "Unable to load resources.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await getCourses();

      const courseList = Array.isArray(response)
        ? response
        : response?.courses || response?.data || [];

      setCourses(
        courseList.filter((course) => course.isActive !== false)
      );
    } catch (err) {
      console.error("Fetch courses error:", err);
      setError(err.message || "Unable to load courses.");
    }
  };

  // Fetch modules according to selected course
  const fetchModules = async (courseId) => {
    if (!courseId) {
      setModules([]);
      return;
    }

    try {
      setModulesLoading(true);

      const response = await getModulesByCourse(courseId);

      const moduleList = Array.isArray(response)
        ? response
        : response?.modules || response?.data || [];

      setModules(
        moduleList
          .filter((module) => module.isActive !== false)
          .sort(
            (a, b) =>
              Number(a.moduleNumber || 0) -
              Number(b.moduleNumber || 0)
          )
      );
    } catch (err) {
      console.error("Fetch modules error:", err);
      setModules([]);
      setFormError("Unable to load modules for this course.");
    } finally {
      setModulesLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchModules(selectedCourseId);
    } else {
      setModules([]);
    }
  }, [selectedCourseId]);

  const selectedModules = modules.filter((module) =>
    selectedModuleIds.includes(module._id)
  );

  // Module selection
  const handleModuleToggle = (moduleId) => {
    setSelectedModuleIds((previous) =>
      previous.includes(moduleId)
        ? previous.filter((id) => id !== moduleId)
        : [...previous, moduleId]
    );
  };

  // Open Add Resource modal
  const openAddModal = () => {
    setEditingResource(null);
    setFormData(initialForm);
    setSelectedModuleIds([]);
    setSelectedCourseId(courses[0]?._id || "");
    setFormError("");
    setShowModal(true);
  };

  // Open Edit Resource modal
  const openEditModal = (resource) => {
    setEditingResource(resource);

    setFormData({
      title: resource.title || "",
      description: resource.description || "",
      resourceType: resource.resourceType || "OTHER",
      resourceUrl: resource.resourceUrl || "",
      
    });

    setSelectedCourseId(getCourseId(resource));
    setSelectedModuleIds(getModuleIds(resource));

    setFormError("");
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingResource(null);
    setFormData(initialForm);
    setSelectedModuleIds([]);
    setFormError("");
  };

  // Input change
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Custom dropdown handlers
  const handleResourceTypeChange = (value) => {
    setFormData((previous) => ({
      ...previous,
      resourceType: value,
    }));
  };

  const handleCourseChange = (value) => {
    setSelectedCourseId(value);
    setSelectedModuleIds([]);
    setModules([]);
    setFormError("");
  };

  

  // Save resource
  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (!formData.title.trim()) {
      setFormError("Please enter resource title.");
      return;
    }

    if (!formData.resourceUrl.trim()) {
      setFormError("Please enter resource URL.");
      return;
    }

    try {
      const parsedUrl = new URL(formData.resourceUrl.trim());

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        setFormError("Please enter a valid HTTP or HTTPS URL.");
        return;
      }
    } catch {
      setFormError("Please enter a valid resource URL.");
      return;
    }

    if (!selectedCourseId) {
      setFormError("Please select a course.");
      return;
    }

    if (modulesLoading) {
      setFormError("Please wait while modules are loading.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        resourceUrl: formData.resourceUrl.trim(),
        courseId: selectedCourseId,
        modules: selectedModuleIds,
      };

      if (editingResource) {
        await updateResource(editingResource._id, payload);
        setSuccessMessage("Resource updated successfully.");
      } else {
        await createResource(payload);
        setSuccessMessage("Resource created successfully.");
      }

      setShowModal(false);
      setEditingResource(null);
      setFormData(initialForm);
      setSelectedModuleIds([]);

      await fetchResources();
    } catch (err) {
      setFormError(err.message || "Unable to save resource.");
    } finally {
      setSaving(false);
    }
  };

  // Publish / Draft toggle
  const handleStatusChange = async (resource) => {
    const newStatus =
      resource.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    try {
      setActionId(resource._id);
      setError("");

      await updateResourceStatus(resource._id, newStatus);
      await fetchResources();

      setSuccessMessage(
        newStatus === "PUBLISHED"
          ? "Resource published successfully."
          : "Resource moved to draft."
      );
    } catch (err) {
      setError(err.message || "Unable to update resource status.");
    } finally {
      setActionId(null);
    }
  };

  // Delete resource
  const handleDelete = async (resource) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${resource.title}"?`
    );

    if (!confirmed) return;

    try {
      setActionId(resource._id);
      setError("");

      await deleteResource(resource._id);
      await fetchResources();

      setSuccessMessage("Resource deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete resource.");
    } finally {
      setActionId(null);
    }
  };

  // Search and status filtering
  const filteredResources = resources.filter((resource) => {
    const matchesSearch = [
      resource.title,
      resource.description,
      resource.courseId?.name,
      getTypeLabel(resource.resourceType),
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || resource.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-resources-page">

      {/* Header */}
      <div className="admin-resources-header">
        <div>
          <span className="admin-resources-eyebrow">
            LEARNING MATERIALS
          </span>

          <h1>Resources</h1>

          <p>
            Manage Digital Marketing study materials, Google Docs,
            Sheets, Drive links and other learning resources.
          </p>
        </div>

        <button
          type="button"
          className="admin-resources-add-btn"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Resource
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="admin-resources-success">
          {successMessage}

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Close message"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="admin-resources-error">
          {error}

          <button type="button" onClick={() => setError("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-resources-toolbar">
        <div className="admin-resources-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <CustomDropdown
          className="admin-resources-filter-dropdown"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="All Resources"
        />

        <button
          type="button"
          className="admin-resources-refresh-btn"
          onClick={fetchResources}
          disabled={loading}
          title="Refresh resources"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="admin-resources-count">
        {filteredResources.length} resource
        {filteredResources.length !== 1 ? "s" : ""}
      </div>

      {/* Resources List */}
      {loading ? (
        <div className="admin-resources-loading">
          <LoaderCircle
            size={28}
            className="admin-resources-spinner"
          />
          <span>Loading resources...</span>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="admin-resources-empty">
          <div className="admin-resources-empty-icon">
            <FolderOpen size={28} />
          </div>

          <h3>No resources found</h3>

          <p>
            {searchTerm || statusFilter !== "ALL"
              ? "Try changing your search or filter."
              : "Add your first Digital Marketing learning resource to get started."}
          </p>

          {!searchTerm && statusFilter === "ALL" && (
            <button type="button" onClick={openAddModal}>
              <Plus size={16} />
              Add Resource
            </button>
          )}
        </div>
      ) : (
        <div className="admin-resources-grid">
          {filteredResources.map((resource) => {
            const ResourceIcon = getResourceIcon(resource.resourceType);
            const resourceModules = resource.modules || [];

            return (
              <article
                className="admin-resource-card"
                key={resource._id}
              >
                <div className="admin-resource-card-top">
                  <div className="admin-resource-icon">
                    <ResourceIcon size={21} />
                  </div>

                  <span
                    className={`admin-resource-status ${
                      resource.status === "PUBLISHED"
                        ? "published"
                        : "draft"
                    }`}
                  >
                    {resource.status === "PUBLISHED"
                      ? "Published"
                      : "Draft"}
                  </span>
                </div>

                <div className="admin-resource-card-content">
                  <span className="admin-resource-type">
                    {getTypeLabel(resource.resourceType)}
                  </span>

                  <h3>{resource.title}</h3>

                  <p className="admin-resource-description">
                    {resource.description || "No description provided."}
                  </p>

                  <div className="admin-resource-course">
                    <span>Course</span>

                    <strong>
                      {resource.courseId?.name || "Course unavailable"}
                    </strong>
                  </div>

                  <div className="admin-resource-modules">
                    <span>Modules</span>

                    <div>
                      {resourceModules.length === 0 ? (
                        <small>All modules</small>
                      ) : (
                        resourceModules.map((module) => (
                          <small key={module._id || module}>
                            {typeof module === "string"
                              ? "Module"
                              : `Module ${module.moduleNumber || ""}: ${module.name}`}
                          </small>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-resource-card-actions">
                  <a
                    href={resource.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-resource-open-btn"
                  >
                    Open Link
                    <ExternalLink size={14} />
                  </a>

                  <button
                    type="button"
                    onClick={() => openEditModal(resource)}
                    title="Edit resource"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(resource)}
                    disabled={actionId === resource._id}
                    title={
                      resource.status === "PUBLISHED"
                        ? "Move to draft"
                        : "Publish resource"
                    }
                  >
                    {actionId === resource._id ? (
                      <LoaderCircle size={16} />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                  </button>

                  <button
                    type="button"
                    className="delete"
                    onClick={() => handleDelete(resource)}
                    disabled={actionId === resource._id}
                    title="Delete resource"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="admin-resources-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="admin-resources-modal">

            <div className="admin-resources-modal-header">
              <div>
                <span>RESOURCE MANAGEMENT</span>

                <h2>
                  {editingResource
                    ? "Edit Resource"
                    : "Add New Resource"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {formError && (
                <div className="admin-resources-form-error">
                  {formError}
                </div>
              )}

              {/* Resource Title */}
              <div className="admin-resources-form-group">
                <label htmlFor="resource-title">
                  Resource Title *
                </label>

                <input
                  id="resource-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Digital Marketing Study Material"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength={150}
                  required
                />
              </div>

              {/* Description */}
              <div className="admin-resources-form-group">
                <label htmlFor="resource-description">
                  Description
                </label>

                <textarea
                  id="resource-description"
                  name="description"
                  placeholder="e.g. SEO, Social Media Marketing, Google Ads study notes"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={500}
                  rows={3}
                />
              </div>

              {/* Resource Type */}
              <div className="admin-resources-form-group">
                <label>Resource Type *</label>

                <CustomDropdown
                  value={formData.resourceType}
                  onChange={handleResourceTypeChange}
                  options={resourceTypes}
                  placeholder="Select resource type"
                />
              </div>

              {/* Resource URL */}
              <div className="admin-resources-form-group">
                <label htmlFor="resource-url">
                  Resource URL *
                </label>

                <input
                  id="resource-url"
                  name="resourceUrl"
                  type="url"
                  placeholder="https://docs.google.com/..."
                  value={formData.resourceUrl}
                  onChange={handleChange}
                  required
                />

                <small>
                  Paste the shareable Google Docs, Sheets, Drive,
                  PDF or other learning resource link.
                </small>
              </div>

              {/* Assign Course */}
              <div className="admin-resources-form-group">
                <label>Assign Course *</label>

                <CustomDropdown
                  value={selectedCourseId}
                  onChange={handleCourseChange}
                  options={courses.map((course) => ({
                    value: course._id,
                    label: course.name,
                  }))}
                  placeholder="Select course"
                  disabled={courses.length === 0}
                />
              </div>

              {/* Assign Modules */}
              <div className="admin-resources-form-group">
                <label>Assign Modules</label>

                <p className="admin-resources-help">
                  Leave all modules unchecked to make this resource
                  available across the entire course.
                </p>

                {!selectedCourseId ? (
                  <div className="admin-resources-module-empty">
                    Select a course first.
                  </div>
                ) : modulesLoading ? (
                  <div className="admin-resources-module-empty">
                    <LoaderCircle size={16} />
                    Loading modules...
                  </div>
                ) : modules.length === 0 ? (
                  <div className="admin-resources-module-empty">
                    No active modules found for this course.
                  </div>
                ) : (
                  <div className="admin-resources-module-list">
                    {modules.map((module) => (
                      <label
                        className="admin-resources-module-option"
                        key={module._id}
                      >
                        <input
                          type="checkbox"
                          checked={selectedModuleIds.includes(module._id)}
                          onChange={() =>
                            handleModuleToggle(module._id)
                          }
                        />

                        <span>
                          Module {module.moduleNumber}: {module.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {selectedModules.length > 0 && (
                  <small className="admin-resources-selected-count">
                    {selectedModules.length} module(s) selected
                  </small>
                )}
              </div>

             

              {/* Actions */}
              <div className="admin-resources-modal-actions">
                <button
                  type="button"
                  className="admin-resources-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-resources-save-btn"
                  disabled={saving || modulesLoading}
                >
                  {saving && <LoaderCircle size={16} />}

                  {saving
                    ? "Saving..."
                    : editingResource
                      ? "Update Resource"
                      : "Save Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResources;
