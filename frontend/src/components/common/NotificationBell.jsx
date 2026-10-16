import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Bell, X, CheckCheck } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import {
  NOTIFICATION_COUNTS,
  NOTIFICATION_REFRESH,
} from "../../services/notificationEvents";

import "./NotificationBell.css";

function NotificationInbox({ role, userId }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [cursor, setCursor] = useState(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const rootRef = useRef(null);
  const bellRef = useRef(null);

  const baselineRef = useRef(null);
  const historyLoadedRef = useRef(false);

  const requestRef = useRef(null);
  const sequenceRef = useRef(0);
  const lockedRef = useRef(false);
  const mountedRef = useRef(false);

  /* ================= FETCH NOTIFICATIONS ================= */

  const refresh = useCallback(async () => {
    if (
      !mountedRef.current ||
      lockedRef.current ||
      requestRef.current
    ) {
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;

    const version = ++sequenceRef.current;

    try {
      const { data } = await api.get("/notifications", {
        signal: controller.signal,
      });

      if (
        controller.signal.aborted ||
        !mountedRef.current ||
        version !== sequenceRef.current
      ) {
        return;
      }

      if (
        !data.success ||
        !Array.isArray(data.notifications)
      ) {
        throw new Error("Invalid notification response");
      }

      const fresh = data.notifications;
      const newestId = fresh[0]?._id || "";

      const historyGap =
        Boolean(baselineRef.current) &&
        fresh.length === 30 &&
        fresh[29]._id > baselineRef.current;

      if (historyGap) {
        historyLoadedRef.current = false;
      }

      if (baselineRef.current === null) {
        if (data.unreadCount > 0) {
          setToast({
            title: `${data.unreadCount} unread notifications`,
            message:
              "Open your notification inbox to view updates.",
          });
        }
      } else {
        const newUnread = fresh.filter(
          (item) =>
            item._id > baselineRef.current &&
            !item.readAt
        );

        if (newUnread.length === 1) {
          setToast(newUnread[0]);
        } else if (newUnread.length > 1) {
          setToast({
            title: historyGap
              ? "New notifications"
              : `${newUnread.length} new notifications`,
            message:
              "Open your notification inbox to view updates.",
          });
        }
      }

      if (newestId > (baselineRef.current || "")) {
        baselineRef.current = newestId;
      } else if (baselineRef.current === null) {
        baselineRef.current = "";
      }

      setItems((previous) => {
        const existing = historyGap ? [] : previous;

        const map = new Map(
          existing.map((item) => [item._id, item])
        );

        fresh.forEach((item) => {
          map.set(item._id, item);
        });

        return [...map.values()].sort((a, b) =>
          b._id.localeCompare(a._id)
        );
      });

      if (!historyLoadedRef.current) {
        setCursor(data.nextCursor);
      }

      setUnread(data.unreadCount);
      setError("");

      window.dispatchEvent(
        new CustomEvent(NOTIFICATION_COUNTS, {
          detail: {
            userId,
            counts: data.unreadBySection || {},
          },
        })
      );
    } catch (err) {
      if (
        !controller.signal.aborted &&
        mountedRef.current &&
        version === sequenceRef.current
      ) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load notifications."
        );
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
      }

      if (
        !controller.signal.aborted &&
        mountedRef.current &&
        version === sequenceRef.current
      ) {
        setLoading(false);
      }
    }
  }, [userId]);

  /* ================= POLLING / CLEANUP ================= */

  useEffect(() => {
    mountedRef.current = true;

    const resume = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    void refresh();

    const timer = window.setInterval(resume, 10000);

    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    window.addEventListener(NOTIFICATION_REFRESH, resume);
    document.addEventListener("visibilitychange", resume);

    return () => {
      mountedRef.current = false;

      window.clearInterval(timer);

      requestRef.current?.abort();
      requestRef.current = null;
      sequenceRef.current += 1;

      window.removeEventListener("focus", resume);
      window.removeEventListener("online", resume);
      window.removeEventListener(
        NOTIFICATION_REFRESH,
        resume
      );

      document.removeEventListener(
        "visibilitychange",
        resume
      );
    };
  }, [refresh]);

  /* ================= AUTO-DISMISS POPUP ================= */

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  /* ================= CLOSE DROPDOWN ================= */

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        bellRef.current?.focus();
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutside
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutside
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open]);

  /* ================= SERIALIZE USER ACTIONS ================= */

  const runAction = async (operation) => {
    if (lockedRef.current || !mountedRef.current) {
      return;
    }

    lockedRef.current = true;
    setBusy(true);

    requestRef.current?.abort();
    requestRef.current = null;
    sequenceRef.current += 1;

    let failure = "";

    try {
      await operation();
    } catch (err) {
      failure =
        err.response?.data?.message ||
        err.message ||
        "Action failed. Please retry.";
    } finally {
      lockedRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
        await refresh();

        if (failure && mountedRef.current) {
          setError(failure);
        }
      }
    }
  };

  /* ================= OPEN NOTIFICATION ================= */

  const visitNotification = (item) =>
    runAction(async () => {
      const prefix = `/${role.toLowerCase()}`;

      if (
        typeof item.link !== "string" ||
        !(
          item.link === prefix ||
          item.link.startsWith(`${prefix}/`)
        )
      ) {
        throw new Error("Invalid notification link");
      }

      await api.patch(
        `/notifications/${item._id}/read`
      );

      /*
        Same page par bhi click ho toh fresh data load hoga.
      */
      window.location.assign(item.link);
    });

  /* ================= MARK ALL READ ================= */

  const markAllRead = () =>
    runAction(async () => {
      if (!items[0]) return;

      const throughId = items[0]._id;

      await api.patch("/notifications/read-all", {
        throughId,
      });

      if (!mountedRef.current) return;

      setItems((previous) =>
        previous.map((item) =>
          item._id <= throughId
            ? {
                ...item,
                readAt: new Date().toISOString(),
              }
            : item
        )
      );
    });

  /* ================= LOAD OLDER ================= */

  const loadOlder = () =>
    runAction(async () => {
      if (!cursor) return;

      const { data } = await api.get("/notifications", {
        params: {
          before: cursor,
        },
      });

      if (
        !data.success ||
        !Array.isArray(data.notifications)
      ) {
        throw new Error("Unable to load older notifications");
      }

      if (!mountedRef.current) return;

      setItems((previous) => {
        const map = new Map(
          [...previous, ...data.notifications].map(
            (item) => [item._id, item]
          )
        );

        return [...map.values()].sort((a, b) =>
          b._id.localeCompare(a._id)
        );
      });

      historyLoadedRef.current = true;
      setCursor(data.nextCursor);
    });

  /* ================= UI ================= */

  return (
    <div className="se-notifications" ref={rootRef}>
      <button
        ref={bellRef}
        type="button"
        className="se-notification-bell"
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        onClick={() => {
          setOpen((previous) => !previous);

          if (!open) {
            void refresh();
          }
        }}
      >
        <Bell size={21} />

        {unread > 0 && (
          <span className="se-notification-count">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <section
          className="se-notification-panel"
          aria-label="Notification inbox"
        >
          <div className="se-notification-heading">
            <strong>
              Notifications
              {unread > 0 ? ` (${unread})` : ""}
            </strong>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>

          <div className="se-notification-actions">
            <button
              type="button"
              disabled={busy || !unread || !items.length}
              onClick={markAllRead}
            >
              <CheckCheck size={16} />
              Mark all read
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void refresh()}
            >
              Refresh
            </button>
          </div>

          {error && (
            <p
              className="se-notification-error"
              role="status"
            >
              {error}
            </p>
          )}

          <div className="se-notification-list">
            {loading && (
              <p className="se-notification-empty">
                Loading…
              </p>
            )}

            {!loading && !items.length && !error && (
              <p className="se-notification-empty">
                You're all caught up.
              </p>
            )}

            {items.map((item) => (
              <button
                type="button"
                key={item._id}
                disabled={busy}
                className={`se-notification-item ${
                  item.readAt ? "" : "is-unread"
                }`}
                onClick={() => visitNotification(item)}
              >
                <strong>
                  {!item.readAt && (
                    <span className="se-notification-dot" />
                  )}

                  {item.title}
                </strong>

                <span>{item.message}</span>

                <time dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString(
                    "en-IN",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )}
                </time>
              </button>
            ))}

            {cursor && (
              <button
                type="button"
                className="se-notification-more"
                disabled={busy}
                onClick={loadOlder}
              >
                Load older notifications
              </button>
            )}
          </div>
        </section>
      )}

      {toast && (
        <div
          className="se-notification-toast"
          role="status"
          aria-live="polite"
        >
          <Bell size={22} />

          <button
            type="button"
            className="se-toast-content"
            disabled={busy}
            onClick={() => {
              if (toast._id) {
                void visitNotification(toast);
              } else {
                setOpen(true);
                void refresh();
              }

              setToast(null);
            }}
          >
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </button>

          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function NotificationBell() {
  const { user } = useAuth();

  const userId = user?._id || user?.id;

  if (!userId) {
    return null;
  }

  return (
    <NotificationInbox
      key={String(userId)}
      userId={String(userId)}
      role={user.role}
    />
  );
}