
import { useEffect, useState } from "react";
import {
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FolderOpen,
  Link as LinkIcon,
  LoaderCircle,
  BookOpen,
} from "lucide-react";

import { getPublishedResources } from "../../services/resourceApi";
import "../student/StudentResources.css";

const resourceTypes = {
  GOOGLE_SHEETS: { label: "Google Sheets", icon: FileSpreadsheet },
  GOOGLE_DOCS: { label: "Google Docs", icon: FileText },
  GOOGLE_DRIVE: { label: "Google Drive", icon: FolderOpen },
  PDF: { label: "PDF", icon: FileText },
  EXCEL: { label: "Excel", icon: FileSpreadsheet },
  OTHER: { label: "External Link", icon: LinkIcon },
};

const TeacherResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getPublishedResources();
        setResources(response?.resources || []);
      } catch (err) {
        console.error("Teacher resources error:", err);
        setError(err.message || "Unable to load resources.");
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  return (
    <div className="student-resources-page">
      <div className="student-resources-header">
        <div>
          <span className="student-resources-eyebrow">
            LEARNING MATERIALS
          </span>
          <h1>Resources</h1>
          <p>
            View published course documents, Google Sheets, Drive links
            and other learning materials.
          </p>
        </div>

        <div className="student-resources-header-icon">
          <BookOpen size={27} />
        </div>
      </div>

      {!loading && !error && (
        <div className="student-resources-count">
          {resources.length} published resource
          {resources.length !== 1 ? "s" : ""}
        </div>
      )}

      {loading ? (
        <div className="student-resources-state">
          <LoaderCircle
            size={28}
            className="student-resources-spinner"
          />
          <span>Loading resources...</span>
        </div>
      ) : error ? (
        <div className="student-resources-state student-resources-error">
          <h3>Unable to load resources</h3>
          <p>{error}</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="student-resources-state">
          <div className="student-resources-empty-icon">
            <FolderOpen size={28} />
          </div>
          <h3>No published resources</h3>
          <p>
            No resources have been published by Admin yet.
          </p>
        </div>
      ) : (
        <div className="student-resources-grid">
          {resources.map((resource) => {
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
                      {resource.courseId?.name || "Course"}
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

export default TeacherResources;
