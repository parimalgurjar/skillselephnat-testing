import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  User,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getDoubtById,
  getConversationMessages,
  sendDoubtMessage,
} from "../../services/doubtApi";

import { useAuth } from "../../context/AuthContext";
import AlertModal from "../../components/common/AlertModal";
import "./DoubtConversation.css";

const DoubtConversation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "error",
    title: "Error",
    message: "",
  });

  const [doubt, setDoubt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const fetchDoubt = async () => {
    try {
      setLoading(true);

      const response = await getDoubtById(id);

      if (response.success) {
        setDoubt(response.doubt);
      }

      const msgResponse = await getConversationMessages(id);
      if (msgResponse.success) {
        setMessages(msgResponse.messages || []);
      }
    } catch (error) {
      console.error(error);

      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Unable to Load Doubt",
        message: error.message || "Unable to fetch doubt details",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubt();
  }, [id]);

  const handleSendReply = async (e) => {
    e.preventDefault();

    if (!reply.trim() && !selectedFile) {
      return;
    }

    try {
      setSending(true);

      const response = await sendDoubtMessage(id, {
        message: reply,
        file: selectedFile,
      });

      if (response.success) {
        setReply("");
        setSelectedFile(null);
        setFileInputKey(Date.now());

        await fetchDoubt();
      }
    } catch (error) {
      console.error(error);

      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Reply Failed",
        message: error.message || "Unable to send reply",
      });
    } finally {
      setSending(false);
    }
  };

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

  if (loading) {
    return (
      <div className="conversation-loading">
        Loading conversation...
      </div>
    );
  }

  if (!doubt) {
    return (
      <div className="conversation-loading">
        Doubt not found
      </div>
    );
  }

  return (
    <div className="doubt-conversation-page">

      {/* ================= BACK BUTTON ================= */}

      <button
        type="button"
        className="conversation-back-button"
        onClick={() =>
          navigate("/student/doubts")
        }
      >
        <ArrowLeft size={18} />
        Back to My Doubts
      </button>

      {/* ================= DOUBT HEADER ================= */}

      <div className="conversation-header-card">
        <div className="conversation-header-top">

          <div>
            <div className="conversation-topic">
              {doubt.topic}
            </div>

            <h1>{doubt.title}</h1>
          </div>

          <div
            className={`conversation-status ${getStatusClass(
              doubt.status
            )}`}
          >
            {doubt.status === "RESOLVED" ? (
              <CheckCircle2 size={16} />
            ) : (
              <Clock3 size={16} />
            )}

            {doubt.status.replace("_", " ")}
          </div>
        </div>

        <p className="conversation-description">
          {doubt.description}
        </p>

        <div className="conversation-meta">

          <div className="conversation-teacher">
            <User size={16} />

            <span>
              Assigned Teacher:
              <strong>
                {" "}
                {doubt.assignedTeacher?.name ||
                  "Not assigned"}
              </strong>
            </span>
          </div>

          <span>
            {new Date(
              doubt.createdAt
            ).toLocaleString()}
          </span>
        </div>
      </div>

      {/* ================= CHAT ================= */}

      <div className="conversation-chat">

        <div className="conversation-chat-header">
          <MessageSquare size={19} />

          <div>
            <h3>Discussion</h3>

            <span>
              Communicate with your assigned teacher
            </span>
          </div>
        </div>

        <div className="conversation-messages">

          {/* ORIGINAL DOUBT MESSAGE */}

          <div className="conversation-message student-message">
            <div className="message-avatar">
              {doubt.studentId?.name
                ?.charAt(0)
                ?.toUpperCase() || "S"}
            </div>

            <div className="message-content">
              <div className="message-user">
                {doubt.studentId?.name || "Student"}

                <span>Student</span>
              </div>

              <div className="message-bubble">
                {doubt.description}
              </div>

              <small>
                {new Date(
                  doubt.createdAt
                ).toLocaleString()}
              </small>
            </div>
          </div>

          {/* REPLIES / MESSAGES */}

          {(messages.length > 0 ? messages : doubt.replies || [])?.map((item) => {
            const currentUserId =
              user?._id || user?.id;

            const senderId =
              item.senderId?._id || item.senderId;

            const isCurrentUser =
              String(senderId) === String(currentUserId);

            const senderName =
              item.senderId?.name ||
              (isCurrentUser
                ? user?.name || "You"
                : "User");

            const senderRole =
              item.senderId?.role ||
              "";

            return (
              <div
                key={item._id}
                className={`conversation-message ${
                  isCurrentUser
                    ? "student-message"
                    : "teacher-message"
                }`}
              >
                <div className="message-avatar">
                  {senderName
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="message-content">
                  <div className="message-user">
                    {isCurrentUser
                      ? "You"
                      : senderName}

                    <span>
                      {senderRole === "STUDENT"
                        ? "Student"
                        : senderRole === "TEACHER"
                        ? "Teacher"
                        : senderRole}
                    </span>
                  </div>

                  <div className="message-bubble">
                    {item.message}

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
                  </div>

                  <small>
                    {item.createdAt
                      ? new Date(
                          item.createdAt
                        ).toLocaleString("en-IN")
                      : ""}
                  </small>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= REPLY BOX ================= */}

        {doubt.status !== "RESOLVED" && (
          <form
            className="conversation-reply-box"
            onSubmit={handleSendReply}
          >
            <textarea
              value={reply}
              onChange={(e) =>
                setReply(e.target.value)
              }
              placeholder="Write your reply..."
              rows="3"
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
                sending || (!reply.trim() && !selectedFile)
              }
            >
              <Send size={18} />

              {sending
                ? "Sending..."
                : "Send Reply"}
            </button>
          </form>
        )}

        {doubt.status === "RESOLVED" && (
          <div className="conversation-resolved-message">
            <CheckCircle2 size={20} />

            This doubt has been marked as resolved.
          </div>
        )}
      </div>

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

export default DoubtConversation;