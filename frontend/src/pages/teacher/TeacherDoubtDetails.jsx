import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Clock3,
  User,
  MessageSquare,
} from "lucide-react";

import {
  getDoubtById,
  getConversationMessages,
  sendDoubtMessage,
  resolveDoubt,
} from "../../services/doubtApi";
import AlertModal from "../../components/common/AlertModal";
import "./TeacherDoubtDetails.css";

const TeacherDoubtDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doubt, setDoubt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [alert, setAlert] = useState({
    isOpen: false,
    type: "error",
    title: "",
    message: "",
  });
const [resolveModalOpen, setResolveModalOpen] = useState(false);
  /* ================= FETCH DOUBT & MESSAGES ================= */

  const fetchDoubt = async () => {
    try {
      setLoading(true);

      const response = await getDoubtById(id);

      if (response?.success) {
        setDoubt(response.doubt);
      }

      const msgResponse = await getConversationMessages(id);
      if (msgResponse?.success) {
        setMessages(msgResponse.messages || []);
      }
    } catch (error) {
      console.error("Fetch doubt error:", error);

      setAlert({
        isOpen: true,
        type: "error",
        title: "Something Went Wrong",
        message: "Unable to fetch doubt details",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubt();
  }, [id]);

  /* ================= SEND REPLY ================= */

  const handleReply = async (e) => {
    e.preventDefault();

    if (!reply.trim() && !selectedFile) return;

    try {
      setSending(true);

      const response = await sendDoubtMessage(id, {
        message: reply.trim(),
        file: selectedFile,
      });

      if (response?.success) {
        setReply("");
        setSelectedFile(null);
        setFileInputKey(Date.now());
        await fetchDoubt();
      }
    } catch (error) {
      console.error("Reply error:", error);

      setAlert({
        isOpen: true,
        type: "error",
        title: "Something Went Wrong",
        message: error.message || "Unable to send reply",
      });
    } finally {
      setSending(false);
    }
  };

  /* ================= RESOLVE DOUBT ================= */

  const handleResolve = () => {
  setResolveModalOpen(true);
};

const confirmResolve = async () => {
  try {
    setResolving(true);

    const response = await resolveDoubt(id);

    if (response?.success) {
      setResolveModalOpen(false);
      await fetchDoubt();
    }
  } catch (error) {
    console.error("Resolve doubt error:", error);

    setAlert({
      isOpen: true,
      type: "error",
      title: "Something Went Wrong",
      message: "Unable to resolve doubt",
    });
  } finally {
    setResolving(false);
  }
};

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="teacher-doubt-details-loading">
        Loading doubt details...
      </div>
    );
  }

  /* ================= NOT FOUND ================= */

  if (!doubt) {
    return (
      <div className="teacher-doubt-details-loading">
        Doubt not found
      </div>
    );
  }

  const isResolved = doubt.status === "RESOLVED";
  const displayMessages = messages.length > 0 ? messages : doubt.replies || [];

  return (
    <div className="teacher-doubt-details-page">

      {/* ================= HEADER ================= */}

      <div className="teacher-doubt-details-header">

        <button
          type="button"
          className="back-doubts-button"
          onClick={() =>
            navigate("/teacher/doubts")
          }
        >
          <ArrowLeft size={18} />
          Back to Doubts
        </button>

        {!isResolved && (
          <button
            type="button"
            className="resolve-doubt-button"
            onClick={handleResolve}
            disabled={resolving}
          >
            <CheckCircle2 size={18} />

            {resolving
              ? "Resolving..."
              : "Mark as Resolved"}
          </button>
        )}

      </div>

      {/* ================= DOUBT INFO ================= */}

      <div className="teacher-doubt-main-card">

        <div className="teacher-doubt-info-top">

          <div>
            <span className="teacher-detail-topic">
              {doubt.topic || "General"}
            </span>

            <h1>{doubt.title}</h1>
          </div>

          <span
            className={`teacher-detail-status ${
              doubt.status?.toLowerCase() || "pending"
            }`}
          >
            {isResolved ? (
              <CheckCircle2 size={16} />
            ) : (
              <Clock3 size={16} />
            )}

            {doubt.status
              ?.replace("_", " ")
              .toLowerCase() || "pending"}
          </span>

        </div>

        {/* ================= ORIGINAL ATTACHMENTS ================= */}

{Array.isArray(doubt.attachments) &&
  doubt.attachments.length > 0 && (
    <div className="original-doubt-attachments">
      <h3>Student Attachments</h3>

      <div className="original-attachments-grid">
        {doubt.attachments.map((attachment, index) => (
          <a
            key={`${attachment}-${index}`}
            href={attachment}
            target="_blank"
            rel="noopener noreferrer"
            className="original-attachment-link"
          >
            <img
              src={attachment}
              alt={`Student attachment ${index + 1}`}
              className="original-attachment-image"
            />

            <span>Open Image ↗</span>
          </a>
        ))}
      </div>
    </div>
  )}

        <div className="teacher-doubt-student-info">

          <div className="teacher-detail-avatar">
            <User size={20} />
          </div>

          <div>
            <strong>
              {doubt.studentId?.name || "Student"}
            </strong>

            <span>
              {doubt.studentId?.email || "No email"}
            </span>
          </div>

        </div>

      </div>

      {/* ================= CONVERSATION ================= */}

      <div className="teacher-conversation-card">

        <div className="teacher-conversation-header">

          <MessageSquare size={20} />

          <div>
            <h2>Conversation</h2>

            <p>
              Communicate directly with the student.
            </p>
          </div>

        </div>

        <div className="teacher-conversation-messages">

          {displayMessages.length === 0 ? (

            <div className="no-replies">
              No replies yet. Start helping the student.
            </div>

          ) : (

            displayMessages.map((item) => {

              const isTeacher =
                item.senderId?.role === "TEACHER";

              return (
                <div
                  key={item._id}
                  className={`conversation-message ${
                    isTeacher
                      ? "teacher-message"
                      : "student-message"
                  }`}
                >

                  <div className="conversation-sender">
                    {item.senderId?.name || "User"}
                  </div>

                  <p>{item.message}</p>

                  {/* ================= ATTACHMENT DISPLAY ================= */}
                  {item.attachment?.url && (
                    <div className="message-attachment">
                      {item.attachment.type === "image" && (
                        <img
                          src={item.attachment.url}
                          alt={item.attachment.filename || "Attachment"}
                          className="attachment-image"
                        />
                      )}

                      {item.attachment.type === "video" && (
                        <video
                          src={item.attachment.url}
                          controls
                          className="attachment-video"
                        />
                      )}

                      {item.attachment.type === "file" && (
                        <a
                          href={item.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attachment-file"
                        >
                          📎 {item.attachment.filename || "Open file"}
                        </a>
                      )}
                    </div>
                  )}

                  <span>
                    {item.createdAt
                      ? new Date(
                          item.createdAt
                        ).toLocaleString("en-IN")
                      : ""}
                  </span>

                </div>
              );
            })

          )}

        </div>

        {/* ================= REPLY FORM ================= */}

        {!isResolved && (

          <form
            className="teacher-reply-form"
            onSubmit={handleReply}
          >

            <textarea
              placeholder="Write your reply..."
              value={reply}
              onChange={(e) =>
                setReply(e.target.value)
              }
              rows="4"
              disabled={sending}
            />

            <div className="doubt-attachment">
              <input
                key={fileInputKey}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] || null);
                }}
              />

              {selectedFile && (
                <div className="selected-file">
                  <span>{selectedFile.name}</span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileInputKey(Date.now());
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={
                sending ||
                (!reply.trim() && !selectedFile)
              }
            >
              <Send size={18} />

              {sending
                ? "Sending..."
                : "Send Reply"}
            </button>

          </form>

        )}

        {/* ================= RESOLVED MESSAGE ================= */}

        {isResolved && (

          <div className="resolved-message">
            <CheckCircle2 size={19} />

            This doubt has been resolved.
          </div>

        )}

      </div>
<ConfirmModal
  isOpen={resolveModalOpen}
  onClose={() => setResolveModalOpen(false)}
  onConfirm={confirmResolve}
  title="Resolve Doubt"
  message="Are you sure you want to mark this doubt as resolved?"
  confirmText="Resolve"
  cancelText="Cancel"
  loading={resolving}
/>
      <AlertModal
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() =>
          setAlert({
            isOpen: false,
            type: "error",
            title: "",
            message: "",
          })
        }
      />
    </div>
  );
};

export default TeacherDoubtDetails;