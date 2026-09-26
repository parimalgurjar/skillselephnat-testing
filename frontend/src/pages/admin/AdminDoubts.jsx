import { useEffect, useState } from "react";
import {
  CircleHelp,
  Clock3,
  CheckCircle2,
  MessageSquare,
  Search,
  User,
  GraduationCap,
} from "lucide-react";

import { getDoubts } from "../../services/doubtApi";
import AlertModal from "../../components/common/AlertModal";
import "./AdminDoubts.css";

const AdminDoubts = () => {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
const [alert, setAlert] = useState({
  isOpen: false,
  type: "info",
  title: "",
  message: "",
});
  const fetchDoubts = async () => {
    try {
      setLoading(true);

      const response = await getDoubts();

      if (response.success) {
        setDoubts(response.doubts || []);
      }
    } catch (error) {
      console.error(error);

     setAlert({
  isOpen: true,
  type: "error",
  title: "Loading Failed",
  message:
    error.message ||
    "Unable to fetch student doubts",
});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "RESOLVED":
        return "resolved";

      case "IN_PROGRESS":
        return "progress";

      default:
        return "pending";
    }
  };

  const filteredDoubts = doubts.filter((doubt) => {
    const searchValue = search.toLowerCase();

    return (
      doubt.title?.toLowerCase().includes(searchValue) ||
      doubt.topic?.toLowerCase().includes(searchValue) ||
      doubt.studentId?.name
        ?.toLowerCase()
        .includes(searchValue) ||
      doubt.assignedTeacher?.name
        ?.toLowerCase()
        .includes(searchValue)
    );
  });

  const pendingCount = doubts.filter(
    (doubt) => doubt.status === "PENDING"
  ).length;

  const progressCount = doubts.filter(
    (doubt) => doubt.status === "IN_PROGRESS"
  ).length;

  const resolvedCount = doubts.filter(
    (doubt) => doubt.status === "RESOLVED"
  ).length;

  return (
    <div className="admin-doubts-page">

      {/* HEADER */}

      <div className="admin-doubts-header">
        <div>
          <span className="admin-page-label">
            DOUBT MANAGEMENT
          </span>

          <h1>Student Doubts</h1>

          <p>
            Monitor student doubts and track teacher
            responses.
          </p>
        </div>
      </div>

      {/* STATS */}

      <div className="admin-doubt-stats">

        <div className="admin-doubt-stat-card">
          <div className="admin-stat-icon total">
            <CircleHelp size={22} />
          </div>

          <div>
            <span>Total Doubts</span>
            <strong>{doubts.length}</strong>
          </div>
        </div>

        <div className="admin-doubt-stat-card">
          <div className="admin-stat-icon pending">
            <Clock3 size={22} />
          </div>

          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>

        <div className="admin-doubt-stat-card">
          <div className="admin-stat-icon progress">
            <MessageSquare size={22} />
          </div>

          <div>
            <span>In Progress</span>
            <strong>{progressCount}</strong>
          </div>
        </div>

        <div className="admin-doubt-stat-card">
          <div className="admin-stat-icon resolved">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Resolved</span>
            <strong>{resolvedCount}</strong>
          </div>
        </div>

      </div>

      {/* DOUBTS SECTION */}

      <div className="admin-doubts-container">

        <div className="admin-doubts-toolbar">
          <div>
            <h2>All Student Doubts</h2>

            <p>
              View doubts, assigned teachers and
              resolution status.
            </p>
          </div>

          <div className="admin-doubt-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search doubts..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>
        </div>

        {loading ? (
          <div className="admin-doubts-loading">
            Loading student doubts...
          </div>
        ) : filteredDoubts.length === 0 ? (
          <div className="admin-no-doubts">
            <CircleHelp size={48} />

            <h3>No doubts found</h3>

            <p>
              Student doubts will appear here.
            </p>
          </div>
        ) : (
          <div className="admin-doubts-table-wrapper">

            <table className="admin-doubts-table">

              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>DOUBT</th>
                  <th>TOPIC</th>
                  <th>ASSIGNED TEACHER</th>
                  <th>REPLIES</th>
                  <th>STATUS</th>
                  <th>DATE</th>
                </tr>
              </thead>

              <tbody>

                {filteredDoubts.map((doubt) => (

                  <tr key={doubt._id}>

                    {/* STUDENT */}

                    <td>
                      <div className="admin-person">

                        <div className="admin-avatar student-avatar">
                          {doubt.studentId?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "S"}
                        </div>

                        <div>
                          <strong>
                            {doubt.studentId?.name ||
                              "Student"}
                          </strong>

                          <span>
                            {doubt.studentId?.email ||
                              "No email"}
                          </span>
                        </div>

                      </div>
                    </td>

                    {/* DOUBT */}

                    <td>
                      <div className="admin-doubt-info">
                        <strong>{doubt.title}</strong>

                        <span>
                          {doubt.description?.length > 55
                            ? `${doubt.description.substring(
                                0,
                                55
                              )}...`
                            : doubt.description}
                        </span>
                      </div>
                    </td>

                    {/* TOPIC */}

                    <td>
                      <span className="admin-topic-badge">
                        {doubt.topic}
                      </span>
                    </td>

                    {/* TEACHER */}

                    <td>
                      {doubt.assignedTeacher ? (
                        <div className="admin-person">

                          <div className="admin-avatar teacher-avatar">
                            {doubt.assignedTeacher?.name
                              ?.charAt(0)
                              ?.toUpperCase() || "T"}
                          </div>

                          <div>
                            <strong>
                              {doubt.assignedTeacher.name}
                            </strong>

                            <span>
                              Teacher
                            </span>
                          </div>

                        </div>
                      ) : (
                        <span className="not-assigned">
                          Not Assigned
                        </span>
                      )}
                    </td>

                    {/* REPLIES */}

                    <td>
                      <div className="reply-count">
                        <MessageSquare size={16} />

                        {doubt.replies?.length || 0}
                      </div>
                    </td>

                    {/* STATUS */}

                    <td>
                      <span
                        className={`admin-doubt-status ${getStatusClass(
                          doubt.status
                        )}`}
                      >
                        {doubt.status === "RESOLVED" ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <Clock3 size={14} />
                        )}

                        {doubt.status
                          .replace("_", " ")
                          .toLowerCase()}
                      </span>
                    </td>

                    {/* DATE */}

                    <td>
                      <span className="doubt-date">
                        {doubt.createdAt
                          ? new Date(
                              doubt.createdAt
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </span>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

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

export default AdminDoubts;