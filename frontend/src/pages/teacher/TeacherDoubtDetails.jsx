import { useEffect, useState,useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useAuth } from "../../context/AuthContext";
import DoubtChatComposer from "../../components/doubts/DoubtChatComposer";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { markConversationNotificationsRead } from "../../services/notificationEvents";
import {
  getDoubtById,
  getConversationMessages,
  sendDoubtMessage,
  resolveDoubt,
  deleteDoubtMessage,
} from "../../services/doubtApi";
import AlertModal from "../../components/common/AlertModal";
import "./TeacherDoubtDetails.css";
import ProfileAvatar from "../../components/common/ProfileAvatar";

const TeacherDoubtDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [audioBusy, setAudioBusy] = useState(false);
  const [doubt, setDoubt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  // ================= AUTO SCROLL TO LATEST MESSAGE =================

useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  if (isAtBottomRef.current) {
    container.scrollTop = container.scrollHeight;
  }
}, [messages]);
  const [sending, setSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [alert, setAlert] = useState({
    isOpen: false,
    type: "error",
    title: "",
    message: "",
  });

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
const messagesContainerRef = useRef(null);
const isAtBottomRef = useRef(true);
  // ================= FETCH DOUBT & MESSAGES =================

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

        void markConversationNotificationsRead(
          `/teacher/doubts/${id}`,
          msgResponse.notificationReadThrough
        );
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

  // ================= BACKGROUND CHAT REFRESH =================

  useEffect(() => {
    if (!id || loading) return;

    let active = true;
    let refreshing = false;
    const conversationLink = window.location.pathname;

    const refreshConversation = async () => {
      if (
        !active ||
        refreshing ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      refreshing = true;

      try {
        const [doubtResponse, messageResponse] = await Promise.all([
          getDoubtById(id),
          getConversationMessages(id),
        ]);

        if (!active) return;

        if (doubtResponse?.success) {
          setDoubt((prev) => {
            const next = doubtResponse.doubt;

            if (JSON.stringify(prev) === JSON.stringify(next)) {
              return prev;
            }

            return next;
          });
        }

        if (messageResponse?.success) {
          const serverMessages = messageResponse.messages || [];

          setMessages((prev) => {
            const pendingOptimistic = prev.filter((msg) => {
              if (!msg.optimistic) return false;

              const matchedOnServer = serverMessages.some(
                (serverMsg) =>
                  serverMsg.message === msg.message &&
                  String(
                    serverMsg.senderId?._id || serverMsg.senderId
                  ) ===
                    String(msg.senderId?._id || msg.senderId)
              );

              return !matchedOnServer;
            });

            const mergedMessages = [
              ...serverMessages,
              ...pendingOptimistic,
            ];

            if (
              JSON.stringify(prev) ===
              JSON.stringify(mergedMessages)
            ) {
              return prev;
            }

            return mergedMessages;
          });

          void markConversationNotificationsRead(
            conversationLink,
            messageResponse.notificationReadThrough
          );
        }
      } catch (error) {
        if (active) {
          console.error(
            "Chat background refresh failed:",
            error.message
          );
        }
      } finally {
        refreshing = false;
      }
    };

    const timer = window.setInterval(
      refreshConversation,
      5000
    );

    window.addEventListener("focus", refreshConversation);
    window.addEventListener("online", refreshConversation);

    document.addEventListener(
      "visibilitychange",
      refreshConversation
    );

    return () => {
      active = false;
      window.clearInterval(timer);

      window.removeEventListener(
        "focus",
        refreshConversation
      );

      window.removeEventListener(
        "online",
        refreshConversation
      );

      document.removeEventListener(
        "visibilitychange",
        refreshConversation
      );
    };
  }, [id, loading]);

  // ================= SEND REPLY =================

  const handleReply = async (e) => {
    e.preventDefault();

    if (sending || resolving || audioBusy) return;

    const messageText = reply.trim();

    if (!messageText && !selectedFile) return;

    const tempId = `optimistic:${Date.now()}`;

    let previewUrl = null;
    let optimisticAttachment = null;

    if (selectedFile) {
      previewUrl = URL.createObjectURL(selectedFile);

      let attachmentType = "file";

      if (selectedFile.type.startsWith("image/")) {
        attachmentType = "image";
      } else if (selectedFile.type.startsWith("video/")) {
        attachmentType = "video";
      } else if (selectedFile.type.startsWith("audio/")) {
        attachmentType = "audio";
      }

      optimisticAttachment = {
        type: attachmentType,
        url: previewUrl,
        filename: selectedFile.name,
        mimeType: selectedFile.type,
        size: selectedFile.size,
      };
    }

    const optimisticMessage = {
      _id: tempId,
      doubtId: id,
      senderId: user,
      senderRole: user?.role || "TEACHER",
      message: messageText,
      attachment: optimisticAttachment,
      legacyAttachments: [],
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    // Message instantly display
    setMessages((prev) => [...prev, optimisticMessage]);

    // Clear composer instantly
    setReply("");
    setSelectedFile(null);

    try {
      setSending(true);

      const response = await sendDoubtMessage(id, {
        message: messageText,
        file: selectedFile,
      });

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to send reply"
        );
      }

      const savedMessage = response.data;

      if (savedMessage) {
        setMessages((prev) =>
          prev.map((item) =>
            item._id === tempId ? savedMessage : item
          )
        );
      }
    } catch (error) {
      console.error("Reply error:", error);

      // Remove failed optimistic message
      setMessages((prev) =>
        prev.filter((item) => item._id !== tempId)
      );

      // Restore message and attachment in composer
      setReply(messageText);
      setSelectedFile(selectedFile);

      setAlert({
        isOpen: true,
        type: "error",
        title: "Reply Failed",
        message: error.message || "Unable to send reply",
      });
    } finally {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setSending(false);
    }
  };

  // ================= DELETE MESSAGE =================

  const handleDeleteMessage = (messageId) => {
    if (String(messageId).startsWith("legacy:")) return;

    setMessageToDelete(messageId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      setDeletingMessageId(messageToDelete);

      const response = await deleteDoubtMessage(
        id,
        messageToDelete
      );

      if (response?.success) {
        setMessages((prev) =>
          prev.filter(
            (message) =>
              String(message._id) !==
              String(messageToDelete)
          )
        );

        setDeleteModalOpen(false);
        setMessageToDelete(null);
      } else {
        throw new Error(
          response?.message || "Unable to delete message"
        );
      }
    } catch (error) {
      setAlert({
        isOpen: true,
        type: "error",
        title: "Delete Failed",
        message: error.message || "Unable to delete message",
      });
    } finally {
      setDeletingMessageId(null);
    }
  };

  const cancelDeleteMessage = () => {
    if (deletingMessageId !== null) return;

    setDeleteModalOpen(false);
    setMessageToDelete(null);
  };

  // ================= RESOLVE DOUBT =================

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

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="teacher-doubt-details-loading">
        Loading doubt details...
      </div>
    );
  }

  // ================= NOT FOUND =================

  if (!doubt) {
    return (
      <div className="teacher-doubt-details-loading">
        Doubt not found
      </div>
    );
  }

  const isResolved = doubt.status === "RESOLVED";

  const displayMessages =
    messages.length > 0
      ? messages
      : doubt.replies || [];

  // ================= UI =================

  return (
    <div className="teacher-doubt-details-page">
      {/* HEADER */}

      <div className="teacher-doubt-details-header">
        <button
          type="button"
          className="back-doubts-button"
          onClick={() => navigate("/teacher/doubts")}
        >
          <ArrowLeft size={18} />
          Back to Doubts
        </button>

        {!isResolved && (
          <button
            type="button"
            className="resolve-doubt-button"
            onClick={handleResolve}
            disabled={resolving || sending || audioBusy}
          >
            <CheckCircle2 size={18} />

            {resolving
              ? "Resolving..."
              : "Mark as Resolved"}
          </button>
        )}
      </div>

      {/* DOUBT INFO */}

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

        {/* ORIGINAL ATTACHMENTS */}

        {Array.isArray(doubt.attachments) &&
          doubt.attachments.length > 0 && (
            <div className="original-doubt-attachments">
              <h3>Student Attachments</h3>

              <div className="original-attachments-grid">
                {doubt.attachments.map(
                  (attachment, index) => (
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
                  )
                )}
              </div>
            </div>
          )}

        {/* STUDENT INFO */}

        <div className="teacher-doubt-student-info">
          <ProfileAvatar
            user={doubt.studentId}
            size={44}
            className="teacher-detail-avatar"
          />

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

      {/* CONVERSATION */}

      <div className="teacher-conversation-card">
        <div className="teacher-conversation-header">
          <MessageSquare size={20} />

          <div>
            <h2>Conversation</h2>
            <p>Communicate directly with the student.</p>
          </div>
        </div>

    <div
  className="teacher-conversation-messages"
  ref={messagesContainerRef}
  onScroll={() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;

    isAtBottomRef.current = distanceFromBottom < 120;
  }}
>
  {displayMessages.length === 0 ? (
    <div className="no-replies">
      No replies yet. Start helping the student.
    </div>
  ) : (
    displayMessages.map((item) => {
      const currentUserId = user?._id || user?.id;

      const senderId =
        typeof item.senderId === "object"
          ? item.senderId?._id || item.senderId?.id
          : item.senderId;

      const senderRole = item.senderRole || item.senderId?.role;

      const isCurrentUser = currentUserId && senderId
        ? String(currentUserId) === String(senderId)
        : senderRole === "TEACHER";

      const senderName = item.senderId?.name || "User";

      return (
        <div
          key={item._id}
          className={`conversation-message ${
            isCurrentUser
              ? "se-chat-outgoing"
              : "se-chat-incoming"
          }`}
        >
          <div className="conversation-message-content">
            <div className="conversation-sender">
              {isCurrentUser ? "You" : senderName}
            </div>

            <div className="teacher-message-bubble-wrap">
              {isCurrentUser &&
                !String(item._id).startsWith("legacy:") && (
                  <button
                    type="button"
                    className="doubt-message-delete-btn"
                    onClick={() => handleDeleteMessage(item._id)}
                    disabled={deletingMessageId === item._id}
                    title="Delete message"
                    aria-label="Delete message"
                  >
                    <Trash2 size={15} />
                  </button>
                )}

              <div className="teacher-message-bubble">
                {item.message && <p>{item.message}</p>}

                {item.legacyAttachments?.length > 0 && (
                  <div className="message-attachment">
                    {item.legacyAttachments.map((url, index) => (
                      <a
                        key={`${item._id}-attachment-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment-file"
                      >
                        📎 Open attachment {index + 1}
                      </a>
                    ))}
                  </div>
                )}

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

                    {item.attachment.type === "audio" && (
                      <div className="attachment-audio">
                        <audio
                          src={item.attachment.url}
                          controls
                          preload="metadata"
                        />
                        <small>
                          {item.attachment.filename || "Voice message"}
                        </small>
                      </div>
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
            </div>

            <span className="teacher-message-time">
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString("en-IN")
                : ""}
            </span>
          </div>
        </div>
      );
    })
  )}
</div>

        {/* REPLY FORM */}

        {!isResolved && (
          <DoubtChatComposer
            key={id}
            value={reply}
            onChange={setReply}
            file={selectedFile}
            onFileChange={setSelectedFile}
            sending={sending}
            disabled={resolving}
            onBusyChange={setAudioBusy}
            onSubmit={handleReply}
          />
        )}

        {/* RESOLVED MESSAGE */}

        {isResolved && (
          <div className="resolved-message">
            <CheckCircle2 size={19} />
            This doubt has been resolved.
          </div>
        )}
      </div>

      {/* DELETE MESSAGE CONFIRM MODAL */}

      {deleteModalOpen && (
        <div className="teacher-delete-modal-overlay">
          <div
            className="teacher-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-delete-modal-title"
          >
            <div className="teacher-delete-modal-icon">
              <Trash2 size={22} />
            </div>

            <h3 id="teacher-delete-modal-title">
              Delete this message?
            </h3>

            <p>This action cannot be undone.</p>

            <div className="teacher-delete-modal-actions">
              <button
                type="button"
                className="teacher-delete-cancel-btn"
                onClick={cancelDeleteMessage}
                disabled={deletingMessageId !== null}
              >
                Cancel
              </button>

              <button
                type="button"
                className="teacher-delete-confirm-btn"
                onClick={confirmDeleteMessage}
                disabled={deletingMessageId !== null}
              >
                <Trash2 size={16} />

                {deletingMessageId !== null
                  ? "Deleting..."
                  : "Delete Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESOLVE CONFIRM MODAL */}

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

      {/* ALERT MODAL */}

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