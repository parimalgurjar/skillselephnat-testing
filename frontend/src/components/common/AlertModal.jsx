
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import "./AlertModal.css";

const alertConfig = {
  success: {
    icon: CheckCircle2,
    title: "Success",
  },
  error: {
    icon: XCircle,
    title: "Error",
  },
  warning: {
    icon: AlertTriangle,
    title: "Warning",
  },
  info: {
    icon: Info,
    title: "Information",
  },
};

const AlertModal = ({
  isOpen,
  onClose,
  type = "info",
  title,
  message,
  buttonText = "OK",
  showCancel = false,
  cancelText = "Cancel",
  onConfirm,
  confirmText = "Confirm",
}) => {
  if (!isOpen) {
    return null;
  }

  const config = alertConfig[type] || alertConfig.info;
  const Icon = config.icon;

  return (
    <div className="se-alert-overlay">
      <div
        className={`se-alert-modal se-alert-${type}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="se-alert-title"
        aria-describedby="se-alert-message"
      >
        <button
          type="button"
          className="se-alert-close"
          onClick={onClose}
          aria-label="Close alert"
        >
          <X size={20} />
        </button>

        <div className="se-alert-icon">
          <Icon size={38} strokeWidth={2.2} />
        </div>

        <h2 id="se-alert-title">
          {title || config.title}
        </h2>

        <p id="se-alert-message">
          {message}
        </p>

        <div className={`se-alert-actions ${showCancel ? "has-cancel" : ""}`}>
  {showCancel && (
    <button
      type="button"
      className="se-alert-cancel-button"
      onClick={onClose}
    >
      {cancelText}
    </button>
  )}

  <button
    type="button"
    className="se-alert-button"
    onClick={showCancel ? onConfirm : onClose}
  >
    {showCancel ? confirmText : buttonText}
  </button>
</div>
      </div>
    </div>
  );
};

export default AlertModal;