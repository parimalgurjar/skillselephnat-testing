import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";

import {
  NOTIFICATION_COUNTS,
} from "../../services/notificationEvents";

import "./NotificationBell.css";

const NotificationBadge = ({ path }) => {
  const { user } = useAuth();

  const userId = String(
    user?._id || user?.id || ""
  );

  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    const handleCountsUpdate = (event) => {
      if (event.detail?.userId !== userId) {
        return;
      }

      setSnapshot(event.detail);
    };

    window.addEventListener(
      NOTIFICATION_COUNTS,
      handleCountsUpdate
    );

    return () => {
      window.removeEventListener(
        NOTIFICATION_COUNTS,
        handleCountsUpdate
      );
    };
  }, [userId]);

  const count =
    snapshot?.userId === userId
      ? Number(snapshot.counts?.[path] || 0)
      : 0;

  if (!Number.isFinite(count) || count <= 0) {
    return null;
  }

  return (
    <span
      className="se-sidebar-unread"
      aria-label={`${count} unread notifications`}
      title={`${count} unread notifications`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default NotificationBadge;