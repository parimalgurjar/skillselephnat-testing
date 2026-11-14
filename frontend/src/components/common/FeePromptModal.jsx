
import { IndianRupee, X, LoaderCircle } from "lucide-react";
import "./FeePromptModal.css";

const FeePromptModal = ({
  isOpen,
  title,
  description,
  value,
  onChange,
  note,
  onNoteChange,
  showNote = false,
  onClose,
  onSubmit,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fee-prompt-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="fee-prompt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fee-prompt-title"
      >
        <div className="fee-prompt-header">
          <div className="fee-prompt-icon">
            <IndianRupee size={23} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <h2 id="fee-prompt-title">{title}</h2>
        <p className="fee-prompt-description">{description}</p>

        <form onSubmit={onSubmit}>
          <label htmlFor="fee-prompt-amount">
            {showNote ? "Payment Amount (₹)" : "Total Fee (₹)"}
          </label>

          <div className="fee-prompt-input-wrap">
            <IndianRupee size={17} />
            <input
              id="fee-prompt-amount"
              type="number"
              min="1"
              step="1"
              required
              autoFocus
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          {showNote && (
            <>
              <label htmlFor="fee-prompt-note">
                Payment Note (Optional)
              </label>

              <textarea
                id="fee-prompt-note"
                rows={3}
                maxLength={300}
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Payment reference or note"
              />
            </>
          )}

          <div className="fee-prompt-actions">
            <button
              type="button"
              className="fee-prompt-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="fee-prompt-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle size={17} className="fee-prompt-spinner" />
                  Saving...
                </>
              ) : (
                "Save Details"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeePromptModal;
