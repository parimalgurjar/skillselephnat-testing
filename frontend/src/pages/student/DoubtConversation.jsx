import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Clock3,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import DoubtChatComposer from "../../components/doubts/DoubtChatComposer";
import { markConversationNotificationsRead } from "../../services/notificationEvents";
import {
  getDoubtById,
  getConversationMessages,
  sendDoubtMessage,
  deleteDoubtMessage,
} from "../../services/doubtApi";

import ProfileAvatar from "../../components/common/ProfileAvatar";
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
  const messagesContainerRef = useRef(null);
  const isAtBottomRef = useRef(true);

  // ================= AUTO SCROLL TO LATEST MESSAGE =================

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (isAtBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
const [messageToDelete, setMessageToDelete] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioBusy, setAudioBusy] = useState(false);

  // ================= FETCH DOUBT =================

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

        void markConversationNotificationsRead(
          `/student/doubts/${id}`,
          msgResponse.notificationReadThrough
        );
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

  // ================= BACKGROUND CHAT REFRESH =================

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
          // Keep optimistic messages until their server version arrives
          const pendingOptimistic = prev.filter((msg) => {
            if (!msg.optimistic) return false;

            const matchedOnServer = serverMessages.some(
              (serverMsg) =>
                serverMsg.message === msg.message &&
                String(
                  serverMsg.senderId?._id ||
                  serverMsg.senderId
                ) === String(
                  msg.senderId?._id ||
                  msg.senderId
                )
            );

            return !matchedOnServer;
          });

          const mergedMessages = [
            ...serverMessages,
            ...pendingOptimistic,
          ];

          // Avoid unnecessary state updates/flicker
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

  const timer = window.setInterval(refreshConversation, 5000);

  window.addEventListener("focus", refreshConversation);
  window.addEventListener("online", refreshConversation);

  document.addEventListener(
    "visibilitychange",
    refreshConversation
  );

  return () => {
    active = false;
    window.clearInterval(timer);

    window.removeEventListener("focus", refreshConversation);
    window.removeEventListener("online", refreshConversation);

    document.removeEventListener(
      "visibilitychange",
      refreshConversation
    );
  };
}, [id, loading]);

  // ================= SEND REPLY =================

 // ================= SEND REPLY =================

const handleSendReply = async (e) => {
  e.preventDefault();

  if (sending || audioBusy) return;

  const trimmedMessage = reply.trim();

  if (!trimmedMessage && !selectedFile) return;

  const tempId = `optimistic:${Date.now()}`;

  let previewUrl = null;

  // Attachment preview data for immediate display
  let attachment = null;

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

    attachment = {
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
    senderRole: user?.role || "STUDENT",
    message: trimmedMessage,
    attachment,
    legacyAttachments: [],
    createdAt: new Date().toISOString(),
    optimistic: true,
  };

  // Show message immediately
  setMessages((prev) => [...prev, optimisticMessage]);

  // Clear composer immediately
  setReply("");
  setSelectedFile(null);

  try {
    setSending(true);

    const response = await sendDoubtMessage(id, {
      message: trimmedMessage,
      file: selectedFile,
    });

    if (!response?.success) {
      throw new Error(response?.message || "Unable to send message");
    }

    const savedMessage = response.data;

    // Replace temporary message with API saved message
    setMessages((prev) =>
      prev.map((item) =>
        item._id === tempId ? savedMessage : item
      )
    );
  } catch (error) {
    console.error("Send message error:", error);

    // Remove failed optimistic message
    setMessages((prev) =>
      prev.filter((item) => item._id !== tempId)
    );

    // Restore message text/file
    setReply(trimmedMessage);
    setSelectedFile(selectedFile);

    setAlertModal({
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

  // ================= DELETE MESSAGE =================

const handleDeleteMessage = (messageId) => {
  if (String(messageId).startsWith("legacy:")) {
    return;
  }

  setMessageToDelete(messageId);
  setDeleteModalOpen(true);
};

const confirmDeleteMessage = async () => {
  if (!messageToDelete) return;

  try {
    setDeletingMessageId(messageToDelete);

    const response = await deleteDoubtMessage(id, messageToDelete);

    if (response?.success) {
      setMessages((prev) =>
        prev.filter(
          (message) =>
            String(message._id) !== String(messageToDelete)
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
    setAlertModal({
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
  setDeleteModalOpen(false);
  setMessageToDelete(null);
};

  // ================= STATUS CLASS =================

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

  // ================= LOADING =================

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

  // ================= UI =================

  return (
    <div className="doubt-conversation-page">
      {/* BACK BUTTON */}

      <button
        type="button"
        className="conversation-back-button"
        onClick={() => navigate("/student/doubts")}
      >
        <ArrowLeft size={18} />
        Back to My Doubts
      </button>

      {/* DOUBT HEADER */}

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
            {doubt.assignedTeacher && (
              <ProfileAvatar
                user={doubt.assignedTeacher}
                size={32}
              />
            )}

            <span>
              Assigned Teacher:
              <strong>
                {" "}
                {doubt.assignedTeacher?.name || "Not assigned"}
              </strong>
            </span>
          </div>

          <span>
            {new Date(doubt.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* CHAT */}

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

        <div
          className="conversation-messages"
          ref={messagesContainerRef}
          onScroll={() => {
            const el = messagesContainerRef.current;
            if (!el) return;

            const distanceFromBottom =
              el.scrollHeight - el.scrollTop - el.clientHeight;

            isAtBottomRef.current = distanceFromBottom < 120;
          }}
        >
          {/* ORIGINAL DOUBT */}

          <div className="conversation-message se-chat-outgoing">
            <ProfileAvatar
              user={doubt.studentId}
              size={36}
              className="message-avatar"
            />

            <div className="message-content">
              <div className="message-user">
                {doubt.studentId?.name || "Student"}
                <span>Student</span>
              </div>

              <div className="message-bubble">
                {doubt.description}
              </div>

              <small>
                {new Date(doubt.createdAt).toLocaleString()}
              </small>
            </div>
          </div>

          {/* REPLIES / MESSAGES */}

          {(messages.length > 0
            ? messages
            : doubt.replies || []
          ).map((item) => {
            const currentUserId = user?._id || user?.id;

            const senderId =
              typeof item.senderId === "object"
                ? item.senderId?._id || item.senderId?.id
                : item.senderId;

            const messageRole =
              item.senderRole || item.senderId?.role || "";

            const isCurrentUser =
              senderId && currentUserId
                ? String(senderId) === String(currentUserId)
                : messageRole === "STUDENT";

            const senderName =
              item.senderId?.name ||
              (isCurrentUser ? user?.name || "You" : "User");

            const senderRole =
              item.senderRole ||
              item.senderId?.role ||
              "";

            return (
              <div
                key={item._id}
                className={`conversation-message ${
                  isCurrentUser
                    ? "se-chat-outgoing"
                    : "se-chat-incoming"
                }`}
              >
                <ProfileAvatar
                  user={
                    item.senderId &&
                    typeof item.senderId === "object"
                      ? item.senderId
                      : isCurrentUser
                      ? user
                      : { name: senderName }
                  }
                  size={36}
                  className="message-avatar"
                />

                <div className="message-content">
                  {/* SENDER INFO */}

                  <div className="message-user">
                    {isCurrentUser ? "You" : senderName}

                    <span>
                      {senderRole === "STUDENT"
                        ? "Student"
                        : senderRole === "TEACHER"
                        ? "Teacher"
                        : senderRole}
                    </span>
                  </div>

                  {/* MESSAGE BUBBLE WITH DELETE ACTION */}

                  <div className="message-bubble-wrap">
                    {isCurrentUser &&
                      !String(item._id).startsWith("legacy:") && (
                        <button
                          type="button"
                          className="doubt-message-delete-btn"
                          onClick={() =>
                            handleDeleteMessage(item._id)
                          }
                          disabled={
                            deletingMessageId === item._id
                          }
                          title="Delete message"
                          aria-label="Delete message"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}

                    <div className="message-bubble">
                      {item.message}

                      {/* LEGACY ATTACHMENTS */}

                      {item.legacyAttachments?.length > 0 && (
                        <div className="message-attachment">
                          {item.legacyAttachments.map(
                            (url, index) => (
                              <a
                                key={`${item._id}-attachment-${index}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="attachment-file"
                              >
                                📎 Open attachment {index + 1}
                              </a>
                            )
                          )}
                        </div>
                      )}

                      {/* MODERN ATTACHMENT */}

                      {item.attachment?.url && (
                        <div className="message-attachment">
                          {/* IMAGE */}

                          {item.attachment.type === "image" && (
                            <img
                              src={item.attachment.url}
                              alt={
                                item.attachment.filename ||
                                "Attachment"
                              }
                              className="attachment-image"
                            />
                          )}

                          {/* VIDEO */}

                          {item.attachment.type === "video" && (
                            <video
                              src={item.attachment.url}
                              controls
                              className="attachment-video"
                            />
                          )}

                          {/* AUDIO / VOICE */}

                          {item.attachment.type === "audio" && (
                            <div className="attachment-audio">
                              <audio
                                src={item.attachment.url}
                                controls
                                preload="metadata"
                              >
                                Your browser does not support audio playback.
                              </audio>

                              <small>
                                {item.attachment.filename ||
                                  "Voice message"}
                              </small>
                            </div>
                          )}

                          {/* FILE */}

                          {item.attachment.type === "file" && (
                            <a
                              href={item.attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="attachment-file"
                            >
                              📎{" "}
                              {item.attachment.filename ||
                                "Open file"}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MESSAGE TIME */}

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

        {/* REPLY BOX */}

        {doubt.status !== "RESOLVED" && (
          <DoubtChatComposer
            key={id}
            value={reply}
            onChange={setReply}
            file={selectedFile}
            onFileChange={setSelectedFile}
            sending={sending}
            onBusyChange={setAudioBusy}
            onSubmit={handleSendReply}
          />
        )}

        {/* RESOLVED MESSAGE */}

        {doubt.status === "RESOLVED" && (
          <div className="conversation-resolved-message">
            <CheckCircle2 size={20} />
            This doubt has been marked as resolved.
          </div>
        )}
      </div>
{/* DELETE CONFIRMATION MODAL */}

{deleteModalOpen && (
  <div className="doubt-delete-modal-overlay">
    <div
      className="doubt-delete-modal"
      role="dialog"
      aria-modal="true"
    >
      <div className="doubt-delete-modal-icon">
        <Trash2 size={22} />
      </div>

      <h3>Delete this message?</h3>

      <p>This action cannot be undone.</p>

      <div className="doubt-delete-modal-actions">
        <button
          type="button"
          className="doubt-delete-cancel-btn"
          onClick={cancelDeleteMessage}
          disabled={deletingMessageId !== null}
        >
          Cancel
        </button>

        <button
          type="button"
          className="doubt-delete-confirm-btn"
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

export default DoubtConversation;