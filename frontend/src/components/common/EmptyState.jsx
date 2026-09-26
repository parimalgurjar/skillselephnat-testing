import { Inbox } from "lucide-react";
import "./EmptyState.css";

const EmptyState = ({
  title = "No data found",
  description = "There is nothing to display here yet.",
  action = null,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Inbox size={28} strokeWidth={1.8} />
      </div>

      <h3 className="empty-state-title">
        {title}
      </h3>

      <p className="empty-state-description">
        {description}
      </p>

      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;