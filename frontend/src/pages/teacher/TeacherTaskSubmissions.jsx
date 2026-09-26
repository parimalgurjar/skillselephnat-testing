import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  CalendarDays,
  ClipboardList,
  Loader2,
} from "lucide-react";
import api from "../../services/api";
import "./TeacherTaskSubmissions.css";
import AlertModal from "../../components/common/AlertModal";
const TeacherTaskSubmissions = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [remarks, setRemarks] = useState({});
const [alert, setAlert] = useState({
  isOpen: false,
  type: "info",
  title: "",
  message: "",
});
  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${taskId}`);

      if (response.data?.success) {
        setTask(response.data.task);
      }
    } catch (error) {
      console.error("Fetch Task Error:", error);
      setAlert({
  isOpen: true,
  type: "error",
  title: "Loading Failed",
  message:
    error.response?.data?.message ||
    "Unable to load task submissions",
});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const handleReview = async (submissionId, status) => {
    try {
      setReviewingId(submissionId);

      await api.put(`/tasks/${taskId}/submissions/${submissionId}/review`, {
        status,
        teacherRemarks: remarks[submissionId] || "",
      });

      await fetchTask();
    } catch (error) {
      console.error("Review Error:", error);
     setAlert({
  isOpen: true,
  type: "error",
  title: "Review Failed",
  message:
    error.response?.data?.message ||
    "Unable to review submission",
});
    } finally {
      setReviewingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="teacher-task-submissions-page">
        <div className="task-submissions-loading">
          <Loader2 className="spinner" size={32} />
          <p>Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="teacher-task-submissions-page">
        <p>Task not found.</p>
      </div>
    );
  }

  const submissions = task.submissions || [];

  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === "PENDING"
  );

  const reviewedSubmissions = submissions.filter(
    (submission) =>
      submission.status === "APPROVED" || submission.status === "REJECTED"
  );

  return (
    <div className="teacher-task-submissions-page">
      <button className="back-btn" onClick={() => navigate("/teacher/tasks")}>
        <ArrowLeft size={18} />
        Back to Tasks
      </button>

      <div className="task-submissions-header">
        <div>
          <span>TASK SUBMISSIONS</span>
          <h1>{task.title}</h1>
          <p>Review student submissions and provide feedback.</p>
        </div>
      </div>

      <div className="submission-stats">
        <div className="submission-stat-card">
          <Clock size={20} />
          <div>
            <span>Pending Review</span>
            <strong>{pendingSubmissions.length}</strong>
          </div>
        </div>

        <div className="submission-stat-card">
          <CheckCircle2 size={20} />
          <div>
            <span>Approved</span>
            <strong>
              {submissions.filter((s) => s.status === "APPROVED").length}
            </strong>
          </div>
        </div>

        <div className="submission-stat-card">
          <XCircle size={20} />
          <div>
            <span>Rejected</span>
            <strong>
              {submissions.filter((s) => s.status === "REJECTED").length}
            </strong>
          </div>
        </div>
      </div>

      <div className="submissions-container">
        <h2>Student Submissions</h2>

        {submissions.length === 0 ? (
          <div className="no-submissions">
            <ClipboardList size={36} />
            <h3>No submissions yet</h3>
            <p>Students have not submitted this task yet.</p>
          </div>
        ) : (
          submissions.map((submission) => {
            const student = submission.studentId;
            const isReviewing = reviewingId === submission._id;

            return (
              <div className="submission-card" key={submission._id}>
                <div className="submission-student">
                  <div className="student-avatar">
                    {student?.name?.charAt(0)?.toUpperCase() || "S"}
                  </div>

                  <div>
                    <h3>{student?.name || "Student"}</h3>
                    <p>{student?.email}</p>
                  </div>
                </div>

                <div
                  className={`submission-status ${submission.status?.toLowerCase()}`}
                >
                  {submission.status}
                </div>

                <div className="submission-details">
                  <div>
                    <ClipboardList size={16} />
                    <span>
                      Completed: {submission.completedCount || 0}/
                      {submission.totalTasks || 0}
                    </span>
                  </div>

                  <div>
                    <CalendarDays size={16} />
                    <span>Submitted: {formatDate(submission.submittedAt)}</span>
                  </div>
                </div>

                {submission.remarks && (
                  <div className="student-remarks">
                    <strong>Student Remarks:</strong>
                    <p>{submission.remarks}</p>
                  </div>
                )}

                {submission.status === "PENDING" ? (
                  <div className="review-section">
                    <textarea
                      placeholder="Add feedback for student..."
                      value={remarks[submission._id] || ""}
                      onChange={(e) =>
                        setRemarks((prev) => ({
                          ...prev,
                          [submission._id]: e.target.value,
                        }))
                      }
                    />

                    <div className="review-actions">
                      <button
                        className="reject-btn"
                        disabled={isReviewing}
                        onClick={() =>
                          handleReview(submission._id, "REJECTED")
                        }
                      >
                        Reject
                      </button>

                      <button
                        className="approve-btn"
                        disabled={isReviewing}
                        onClick={() =>
                          handleReview(submission._id, "APPROVED")
                        }
                      >
                        {isReviewing ? "Saving..." : "Approve"}
                      </button>
                    </div>
                  </div>
                ) : (
                  submission.teacherRemarks && (
                    <div className="teacher-feedback">
                      <strong>Teacher Feedback:</strong>
                      <p>{submission.teacherRemarks}</p>
                    </div>
                  )
                )}
              </div>
            );
          })
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

export default TeacherTaskSubmissions;