import { AlertCircle, RefreshCw } from "lucide-react";
import "./ErrorState.css";

const ErrorState = ({
  title = "Something went wrong",
  message = "We couldn't load this information. Please try again.",
  onRetry,
}) => {
  return (
    <div
      className="error-state"
      role="alert"
    >
      <div className="error-state-icon">
        <AlertCircle
          size={28}
          strokeWidth={1.8}
        />
      </div>

      <h3 className="error-state-title">
        {title}
      </h3>

      <p className="error-state-message">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          className="error-state-button"
          onClick={onRetry}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;