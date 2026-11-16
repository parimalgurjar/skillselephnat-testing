
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CircleHelp,
  Clock3,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

import AlertModal from "../../components/common/AlertModal";
import { getDoubts } from "../../services/doubtApi";
import { formatBatchTimingString } from "../../utils/batchUtils";
import "./TeacherDoubts.css";

const TeacherDoubts = () => {
  const navigate = useNavigate();

  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "error",
    title: "Error",
    message: "",
  });

  /* FETCH DOUBTS */

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
          error.message || "Unable to fetch student doubts",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, []);

  /* STATUS HELPERS */

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

  /* SUMMARY COUNTS */

  const totalDoubts = doubts.length;

  const pendingDoubts = doubts.filter(
    (doubt) => doubt.status === "PENDING"
  ).length;

  const inProgressDoubts = doubts.filter(
    (doubt) => doubt.status === "IN_PROGRESS"
  ).length;

  const resolvedDoubts = doubts.filter(
    (doubt) => doubt.status === "RESOLVED"
  ).length;

  /* CARD FILTER */

  const filteredDoubts = useMemo(() => {
    if (activeFilter === "PENDING") {
      return doubts.filter(
        (doubt) => doubt.status === "PENDING"
      );
    }

    if (activeFilter === "IN_PROGRESS") {
      return doubts.filter(
        (doubt) => doubt.status === "IN_PROGRESS"
      );
    }

    if (activeFilter === "RESOLVED") {
      return doubts.filter(
        (doubt) => doubt.status === "RESOLVED"
      );
    }

    return doubts;
  }, [doubts, activeFilter]);

  /* CARD CLICK */

  const handleFilterClick = (filter) => {
    setActiveFilter((current) =>
      current === filter && filter !== "ALL"
        ? "ALL"
        : filter
    );
  };

  return (
    <div className="teacher-doubts-page">
      {/* HEADER */}

      <div className="teacher-doubts-header">
        <div>
          <h1>Student Doubts</h1>

          <p>
            View and resolve doubts assigned to you.
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}

      <div className="teacher-doubt-stats">
        <button
          type="button"
          className={`teacher-doubt-stat-card ${
            activeFilter === "ALL" ? "selected" : ""
          }`}
          onClick={() => handleFilterClick("ALL")}
          aria-pressed={activeFilter === "ALL"}
        >
          <span>Total Doubts</span>
          <strong>{totalDoubts}</strong>
        </button>

        <button
          type="button"
          className={`teacher-doubt-stat-card pending ${
            activeFilter === "PENDING" ? "selected" : ""
          }`}
          onClick={() => handleFilterClick("PENDING")}
          aria-pressed={activeFilter === "PENDING"}
        >
          <span>Pending</span>
          <strong>{pendingDoubts}</strong>
        </button>

        <button
          type="button"
          className={`teacher-doubt-stat-card progress ${
            activeFilter === "IN_PROGRESS" ? "selected" : ""
          }`}
          onClick={() => handleFilterClick("IN_PROGRESS")}
          aria-pressed={activeFilter === "IN_PROGRESS"}
        >
          <span>In Progress</span>
          <strong>{inProgressDoubts}</strong>
        </button>

        <button
          type="button"
          className={`teacher-doubt-stat-card resolved ${
            activeFilter === "RESOLVED" ? "selected" : ""
          }`}
          onClick={() => handleFilterClick("RESOLVED")}
          aria-pressed={activeFilter === "RESOLVED"}
        >
          <span>Resolved</span>
          <strong>{resolvedDoubts}</strong>
        </button>
      </div>

      {/* DOUBTS LIST */}

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
      ) : filteredDoubts.length === 0 ? (
        <div className="teacher-no-doubts">
          <CircleHelp size={45} />

          <h3>
            {activeFilter === "PENDING"
              ? "No pending doubts"
              : activeFilter === "IN_PROGRESS"
              ? "No doubts in progress"
              : "No resolved doubts"}
          </h3>

          <p>
            There are no doubts in this status currently.
          </p>
        </div>
      ) : (
        <div className="teacher-doubts-list">
          {filteredDoubts.map((doubt) => (
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
                    {doubt.studentId?.name || "Student"}
                  </strong>

                  <span>
                    {doubt.studentId?.batchTiming
                      ? formatBatchTimingString(
                          doubt.studentId.batchTiming
                        )
                      : "Student"}
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
                  type="button"
                  className="open-doubt-btn"
                  onClick={() =>
                    navigate(`/teacher/doubts/${doubt._id}`)
                  }
                >
                  Open Doubt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALERT MODAL */}

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
