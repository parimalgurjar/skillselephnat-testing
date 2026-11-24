
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FolderOpen,
  Link as LinkIcon,
  LoaderCircle,
  BookOpen,
} from "lucide-react";

import { getPublishedResources } from "../../services/resourceApi";
import "./StudentResources.css";
import { useAuth } from "../../context/AuthContext";
import { getModulesByCourse } from "../../services/moduleApi";
const resourceTypes = {
  GOOGLE_SHEETS: {
    label: "Google Sheets",
    icon: FileSpreadsheet,
  },
  GOOGLE_DOCS: {
    label: "Google Docs",
    icon: FileText,
  },
  GOOGLE_DRIVE: {
    label: "Google Drive",
    icon: FolderOpen,
  },
  PDF: {
    label: "PDF",
    icon: FileText,
  },
  EXCEL: {
    label: "Excel",
    icon: FileSpreadsheet,
  },
  OTHER: {
    label: "External Link",
    icon: LinkIcon,
  },
};

const StudentResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const { user } = useAuth();
const [courseModules, setCourseModules] = useState([]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getPublishedResources();
        setResources(response?.resources || []);
      } catch (err) {
        console.error("Student resources error:", err);
        setError(err.message || "Unable to load resources.");
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);
useEffect(() => {
  const fetchCourseModules = async () => {
    const courseId = user?.courseId?._id || user?.courseId;

    if (!courseId) {
      setCourseModules([]);
      return;
    }

    try {
      const response = await getModulesByCourse(courseId);

      setCourseModules(
        (response?.modules || [])
          .filter((module) => module.isActive !== false)
          .sort(
            (a, b) =>
              Number(a.moduleNumber || 0) -
              Number(b.moduleNumber || 0)
          )
      );
    } catch (err) {
      console.error("Student course modules error:", err);
      setCourseModules([]);
    }
  };

  fetchCourseModules();
}, [user?.courseId]);
 // Show all active modules from the student's assigned course.
const availableModules = courseModules;

  const filteredResources = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesSearch = [
        resource.title,
        resource.description,
        resource.courseId?.name,
        resourceTypes[resource.resourceType]?.label,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);

      const resourceModules = resource.modules || [];

      // Resources with no selected modules are course-wide resources.
      const matchesModule =
        selectedModule === "ALL" ||
        resourceModules.length === 0 ||
        resourceModules.some(
          (module) =>
            (typeof module === "string" ? module : module?._id) ===
            selectedModule
        );

      return matchesSearch && matchesModule;
    });
  }, [resources, searchTerm, selectedModule]);

  return (
    <div className="student-resources-page">
      <div className="student-resources-header">
        <div>
          <span className="student-resources-eyebrow">
            YOUR LEARNING MATERIALS
          </span>
          <h1>Resources</h1>
          <p>
            Access your course documents, Google Sheets, notes and other
            learning materials in one place.
          </p>
        </div>

        <div className="student-resources-header-icon">
          <BookOpen size={27} />
        </div>
      </div>

      <div className="student-resources-toolbar">
        <div className="student-resources-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <select
          value={selectedModule}
          onChange={(event) => setSelectedModule(event.target.value)}
          aria-label="Filter resources by module"
        >
          <option value="ALL">All Modules</option>
          {availableModules.map((module) => (
            <option key={module._id} value={module._id}>
              Module {module.moduleNumber}: {module.name}
            </option>
          ))}
        </select>
      </div>

      {!loading && !error && (
        <div className="student-resources-count">
          Showing {filteredResources.length} of {resources.length} resources
        </div>
      )}

      {loading ? (
        <div className="student-resources-state">
          <LoaderCircle
            size={28}
            className="student-resources-spinner"
          />
          <span>Loading your resources...</span>
        </div>
      ) : error ? (
        <div className="student-resources-state student-resources-error">
          <h3>Unable to load resources</h3>
          <p>{error}</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="student-resources-state">
          <div className="student-resources-empty-icon">
            <FolderOpen size={28} />
          </div>
          <h3>No resources found</h3>
          <p>
            {searchTerm || selectedModule !== "ALL"
              ? "Try another search or select a different module."
              : "Your instructor has not published any resources yet."}
          </p>
        </div>
      ) : (
        <div className="student-resources-grid">
          {filteredResources.map((resource) => {
            const typeInfo =
              resourceTypes[resource.resourceType] || resourceTypes.OTHER;

            const ResourceIcon = typeInfo.icon;
            const modules = resource.modules || [];

            return (
              <article
                className="student-resource-card"
                key={resource._id}
              >
                <div className="student-resource-card-top">
                  <div className="student-resource-icon">
                    <ResourceIcon size={22} />
                  </div>

                  <span className="student-resource-type">
                    {typeInfo.label}
                  </span>
                </div>

                <div className="student-resource-content">
                  <h3>{resource.title}</h3>

                  <p className="student-resource-description">
                    {resource.description ||
                      "Open this resource to access the learning material."}
                  </p>

                  <div className="student-resource-course">
                    <BookOpen size={14} />
                    <span>
                      {resource.courseId?.name || "Your Course"}
                    </span>
                  </div>

                  <div className="student-resource-modules">
                    {modules.length === 0 ? (
                      <span className="student-resource-module-tag">
                        All Modules
                      </span>
                    ) : (
                      modules.map((module) => (
                        <span
                          className="student-resource-module-tag"
                          key={module._id || module}
                        >
                          {typeof module === "string"
                            ? "Module"
                            : `Module ${module.moduleNumber || ""}`}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <a
                  className="student-resource-open-btn"
                  href={resource.resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Resource
                  <ExternalLink size={15} />
                </a>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentResources;
