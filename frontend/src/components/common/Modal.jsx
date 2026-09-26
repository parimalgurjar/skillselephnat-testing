import { X } from "lucide-react";
import "./Modal.css";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "medium",
  closeOnOverlayClick = true,
}) => {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (
      closeOnOverlayClick &&
      event.target === event.currentTarget
    ) {
      onClose();
    }
  };

  return (
    <div
      className="se-modal-overlay"
      onMouseDown={handleOverlayClick}
    >
      <div
        className={`se-modal se-modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="se-modal-title"
      >
        <div className="se-modal-header">
          <h2
            id="se-modal-title"
            className="se-modal-title"
          >
            {title}
          </h2>

          <button
            type="button"
            className="se-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={19} />
          </button>
        </div>

        <div className="se-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;