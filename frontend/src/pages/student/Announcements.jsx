import { useEffect, useState } from "react";

import {
  Bell,
  Megaphone,
  CalendarDays,
  Clock,
  Pin,
  ArrowRight,
} from "lucide-react";

import api from "../../services/api";

import "./Announcements.css";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ANNOUNCEMENTS ================= */

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);

      const response = await api.get("/announcements/student");

      if (response.data?.success) {
        setAnnouncements(
          response.data.announcements || []
        );
      }
    } catch (error) {
      console.error(
        "Fetch announcements error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  /* ================= FORMAT DATE ================= */

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* ================= FORMAT TIME ================= */

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  /* ================= PINNED COUNT ================= */

  const pinnedCount = announcements.filter(
    (announcement) => announcement.pinned === true
  ).length;

  if (loading) {
    return (
      <div className="announcements-page">
        <div className="announcements-loading">
          Loading announcements...
        </div>
      </div>
    );
  }

  return (
    <div className="announcements-page">

      {/* Header */}

      <div className="announcements-page-header">

        <div>
          <span className="announcements-page-label">
            STUDENT PORTAL
          </span>

          <h1>Announcements</h1>

          <p>
            Stay updated with the latest news, classes,
            workshops and important course updates.
          </p>
        </div>

        <div className="announcements-header-icon">
          <Bell size={28} />
        </div>

      </div>

      {/* Important Notice */}

      <div className="important-announcement">

        <div className="important-icon">
          <Megaphone size={24} />
        </div>

        <div className="important-content">

          <div className="important-title-row">

            <h3>Important Updates</h3>

            <span>
              {pinnedCount} Pinned
            </span>

          </div>

          <p>
            Please check your latest announcements regularly
            to stay updated with classes and assignments.
          </p>

        </div>

      </div>

      {/* Announcement List */}

      <div className="announcements-container">

        <div className="announcements-container-header">

          <div>
            <h2>Latest Announcements</h2>

            <p>
              Important updates from Skillselephant
            </p>
          </div>

        </div>

        <div className="announcement-list">

          {announcements.length === 0 ? (

            <div className="no-announcements">

              <Megaphone size={35} />

              <h3>No Announcements Yet</h3>

              <p>
                There are currently no announcements
                available.
              </p>

            </div>

          ) : (

            announcements.map((announcement) => (

              <div
                className={`announcement-card ${
                  announcement.pinned
                    ? "important-card"
                    : ""
                }`}
                key={announcement._id}
              >

                {/* Icon */}

                <div className="announcement-icon">

                  {announcement.pinned ? (
                    <Pin size={19} />
                  ) : (
                    <Megaphone size={19} />
                  )}

                </div>

                {/* Content */}

                <div className="announcement-content">

                  <div className="announcement-title-row">

                    <div>

                      <span className="announcement-category">
                        {announcement.priority || "General"}
                      </span>

                      <h3>
                        {announcement.title}
                      </h3>

                    </div>

                    {announcement.pinned && (
                      <span className="new-badge">
                        PINNED
                      </span>
                    )}

                  </div>

                  <p>
                    {announcement.description}
                  </p>

                  {/* Meta */}

                  <div className="announcement-meta">

                    <span>
                      <CalendarDays size={14} />

                      {formatDate(
                        announcement.createdAt
                      )}
                    </span>

                    <span>
                      <Clock size={14} />

                      {formatTime(
                        announcement.createdAt
                      )}
                    </span>

                  </div>

                </div>

               

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
};

export default Announcements;