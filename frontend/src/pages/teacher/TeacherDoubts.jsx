import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CircleHelp,
  Clock3,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import AlertModal from "../../components/common/AlertModal";
import { getDoubts } from "../../services/doubtApi";

import "./TeacherDoubts.css";

const TeacherDoubts = () => {
  const navigate = useNavigate();

  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
const [alertModal, setAlertModal] = useState({
  isOpen: false,
  type: "error",
  title: "Error",
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

      setAlertModal({
  isOpen: true,
  type: "error",
  title: "Unable to Load Doubts",
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

  const getStatusIcon = (status) => {
    if (status === "RESOLVED") {
      return <CheckCircle2 size={15} />;
    }

    return <Clock3 size={15} />;
  };

  return (
    <div className="teacher-doubts-page">
      <div className="teacher-doubts-header">
        <div>
          <h1>Student Doubts</h1>

          <p>
            View and resolve doubts assigned to you.
          </p>
        </div>
      </div>

      {/* ================= STATS ================= */}

      <div className="teacher-doubt-stats">
        <div className="teacher-doubt-stat-card">
          <span>Total Doubts</span>
          <strong>{doubts.length}</strong>
        </div>

        <div className="teacher-doubt-stat-card pending">
          <span>Pending</span>
          <strong>
            {
              doubts.filter(
                (doubt) =>
                  doubt.status === "PENDING"
              ).length
            }
          </strong>
        </div>

        <div className="teacher-doubt-stat-card progress">
          <span>In Progress</span>
          <strong>
            {
              doubts.filter(
                (doubt) =>
                  doubt.status === "IN_PROGRESS"
              ).length
            }
          </strong>
        </div>

        <div className="teacher-doubt-stat-card resolved">
          <span>Resolved</span>
          <strong>
            {
              doubts.filter(
                (doubt) =>
                  doubt.status === "RESOLVED"
              ).length
            }
          </strong>
        </div>
      </div>

      {/* ================= DOUBTS ================= */}

      {loading ? (
        <div className="teacher-doubts-loading">
          Loading student doubts...
        </div>
      ) : doubts.length === 0 ? (
        <div className="teacher-no-doubts">
          <CircleHelp size={45} />

          <h3>No doubts assigned yet</h3>

          <p>
            Student doubts related to your specializations
            will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="teacher-doubts-list">
          {doubts.map((doubt) => (
            <div
              className="teacher-doubt-card"
              key={doubt._id}
            >
              <div className="teacher-doubt-card-top">
                <span className="teacher-doubt-topic">
                  {doubt.topic}
                </span>

                <span
                  className={`teacher-doubt-status ${getStatusClass(
                    doubt.status
                  )}`}
                >
                  {getStatusIcon(doubt.status)}

                  {doubt.status
                    .replace("_", " ")
                    .toLowerCase()}
                </span>
              </div>

              <h3>{doubt.title}</h3>

              <p>{doubt.description}</p>

              <div className="teacher-doubt-student">
                <div className="teacher-student-avatar">
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
                    {doubt.studentId?.batchTiming ||
                      "Student"}
                  </span>
                </div>
              </div>

              <div className="teacher-doubt-footer">
                <div>
                  <MessageSquare size={16} />

                  <span>
                    {doubt.replies?.length || 0} Replies
                  </span>
                </div>

                <button
                  className="open-doubt-btn"
                  onClick={() =>
                    navigate(
                      `/teacher/doubts/${doubt._id}`
                    )
                  }
                >
                  Open Doubt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AlertModal
  isOpen={alertModal.isOpen}
  type={alertModal.type}
  title={alertModal.title}
  message={alertModal.message}
  onClose={() =>
    setAlertModal((prev) => ({
      ...prev,
      isOpen: false,
    }))
  }
/>
    </div>
  );
};

export default TeacherDoubts;