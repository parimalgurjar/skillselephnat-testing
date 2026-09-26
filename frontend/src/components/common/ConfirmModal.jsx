import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  variant = "danger",
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={title}
      size="small"
      closeOnOverlayClick={!loading}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "#fef2f2",
            color: "#dc2626",
          }}
        >
          <AlertTriangle size={26} />
        </div>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>

        <div
          style={{
            width: "100%",
            marginTop: "24px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;