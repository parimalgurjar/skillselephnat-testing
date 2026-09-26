import {
  useEffect,
  useState,
} from "react";

import {
  Plus,
  Megaphone,
  CalendarDays,
  Users,
  Pin,
  MoreVertical,
  X,
  Send,
} from "lucide-react";

import api from "../../services/api";
import AlertModal from "../../components/common/AlertModal";
import "./TeacherAnnouncements.css";

const TeacherAnnouncements = () => {
  const [showModal, setShowModal] =
    useState(false);

  const [
    announcements,
    setAnnouncements,
  ] = useState([]);

  const [
    students,
    setStudents,
  ] = useState([]);
const [alert, setAlert] = useState({
  isOpen: false,
  type: "error",
  title: "",
  message: "",
});
  /*
    CANONICAL BATCH LIST

    Always comes directly
    from backend.
  */

  const [
    batches,
    setBatches,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    publishing,
    setPublishing,
  ] = useState(false);

  const [
    filter,
    setFilter,
  ] = useState("ALL");

  const [
    formData,
    setFormData,
  ] = useState({
    title: "",
    message: "",
    audience: "ALL",
    batchId: "",
    pinned: false,
  });

  /* =====================================================
     FORMAT SINGLE TIME
  ===================================================== */

  const formatSingleTime = (
    time
  ) => {
    if (!time) return "";

    const cleanedTime =
      time
        .toString()
        .trim()
        .replace(".", ":");

    const parts =
      cleanedTime.split(":");

    let hours =
      parseInt(parts[0], 10);

    const minutes =
      parseInt(
        parts[1] || "0",
        10
      );

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return time;
    }

    const period =
      hours >= 12
        ? "PM"
        : "AM";

    hours =
      hours % 12 || 12;

    return `${hours}:${minutes
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  /* =====================================================
     FORMAT BATCH TIMING

     SINGLE SOURCE OF DISPLAY:
     Batch.startTime + Batch.endTime

     batchTiming only fallback.
  ===================================================== */

  const formatBatchTiming = (
    batch
  ) => {
    if (!batch) return "";

    if (
      batch.startTime &&
      batch.endTime
    ) {
      return `${formatSingleTime(
        batch.startTime
      )} - ${formatSingleTime(
        batch.endTime
      )}`;
    }

    if (batch.batchTiming) {
      const value =
        batch.batchTiming
          .toString()
          .trim();

      if (value.includes("-")) {
        const parts =
          value.split("-");

        if (parts.length === 2) {
          return `${formatSingleTime(
            parts[0]
          )} - ${formatSingleTime(
            parts[1]
          )}`;
        }
      }

      return value;
    }

    return "";
  };

  /* =====================================================
     BATCH LABEL
  ===================================================== */

  const getBatchLabel = (
    batch
  ) => {
    if (!batch) {
      return "Unnamed Batch";
    }

    const timing =
      formatBatchTiming(batch);

    if (
      batch.name &&
      timing
    ) {
      return `${batch.name} (${timing})`;
    }

    if (
      batch.code &&
      timing
    ) {
      return `${batch.code} (${timing})`;
    }

    return (
      batch.name ||
      batch.code ||
      timing ||
      "Unnamed Batch"
    );
  };

  /* =====================================================
     FETCH ANNOUNCEMENTS
  ===================================================== */

  const fetchAnnouncements =
    async () => {
      try {
        setLoading(true);

        const response =
          await api.get(
            "/announcements/my-announcements"
          );

        if (
          response.data?.success
        ) {
          setAnnouncements(
            Array.isArray(
              response.data.announcements
            )
              ? response.data.announcements
              : []
          );
        } else {
          setAnnouncements([]);
        }
      } catch (error) {
        console.error(
          "Fetch Announcements Error:",
          error.response?.data ||
            error
        );

        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

  /* =====================================================
     FETCH STUDENTS + BATCHES
  ===================================================== */

  const fetchStudentsAndBatches = async () => {
  try {
    const [studentsResponse, batchesResponse] =
      await Promise.all([
        api.get("/teachers/my-students"),
        api.get("/batches/public"),
      ]);

    if (studentsResponse.data?.success) {
      setStudents(
        Array.isArray(studentsResponse.data.students)
          ? studentsResponse.data.students
          : []
      );
    } else {
      setStudents([]);
    }

    setBatches(
      Array.isArray(batchesResponse.data?.batches)
        ? batchesResponse.data.batches
        : []
    );
  } catch (error) {
    console.error(
      "Fetch Students/Batches Error:",
      error.response?.data || error
    );

    setStudents([]);
    setBatches([]);
  }
};

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchAnnouncements();

    fetchStudentsAndBatches();
  }, []);

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData(
      (prev) => ({
        ...prev,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  };

  /* =====================================================
     CREATE ANNOUNCEMENT
  ===================================================== */

  const handleSubmit =
    async () => {
      if (
        !formData.title.trim()
      ) {
        setAlert({
  isOpen: true,
  type: "warning",
  title: "Title Required",
  message: "Please enter announcement title",
});
return;

        return;
      }

      if (
        !formData.message.trim()
      ) {
        setAlert({
  isOpen: true,
  type: "warning",
  title: "Message Required",
  message: "Please enter announcement message",
});
return;

        return;
      }

      if (
        formData.audience === "BATCH" &&
        !formData.batchId
      ) {
        setAlert({
  isOpen: true,
  type: "warning",
  title: "Batch Required",
  message: "Please select a batch",
});
return;

        return;
      }

      try {
        setPublishing(true);

        /*
          IMPORTANT:

          ALL = batchId null
          BATCH = actual ObjectId
        */

        const payload = {
          title:
            formData.title.trim(),

          description:
            formData.message.trim(),

          batchId:
            formData.audience ===
            "BATCH"
              ? formData.batchId
              : null,

          pinned:
            formData.pinned,
        };

        const response =
          await api.post(
            "/announcements/teacher",
            payload
          );

        if (
          response.data?.success
        ) {
          /*
            Reload announcements
          */

          await fetchAnnouncements();

          /*
            Reset form
          */

          setFormData({
            title: "",
            message: "",
            audience: "ALL",
            batchId: "",
            pinned: false,
          });

          setShowModal(false);
        }
      } catch (error) {
        console.error(
          "Create Announcement Error:",
          error.response?.data ||
            error
        );

       setAlert({
  isOpen: true,
  type: "error",
  title: "Publishing Failed",
  message:
    error.response?.data?.message ||
    "Unable to create announcement",
});
      } finally {
        setPublishing(false);
      }
    };

  /* =====================================================
     GET ANNOUNCEMENT BATCH ID
  ===================================================== */

  const getAnnouncementBatchId = (
    announcement
  ) => {
    if (!announcement?.batchId) {
      return "";
    }

    if (
      typeof announcement.batchId ===
      "object"
    ) {
      return (
        announcement.batchId._id
          ?.toString() || ""
      );
    }

    return announcement.batchId.toString();
  };

  /* =====================================================
     FILTER ANNOUNCEMENTS
  ===================================================== */

  const filteredAnnouncements =
    announcements.filter(
      (announcement) => {
        if (
          filter === "ALL"
        ) {
          return true;
        }

        if (
          filter === "PINNED"
        ) {
          return announcement.pinned ===
            true;
        }

        return (
          getAnnouncementBatchId(
            announcement
          ) === filter
        );
      }
    );

  /* =====================================================
     STATS
  ===================================================== */

  const totalAnnouncements =
    announcements.length;

  const pinnedAnnouncements =
    announcements.filter(
      (announcement) =>
        announcement.pinned === true
    ).length;

  /*
    Currently total assigned students.
  */

  const totalStudents =
    students.length;

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "—";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="teacher-announcements-page">

      {/* ================= HEADER ================= */}

      <div className="teacher-announcements-header">

        <div>

          <span className="teacher-page-label">
            EDUCATOR PORTAL
          </span>

          <h1>
            Announcements
          </h1>

          <p>
            Keep your students informed
            about important updates.
          </p>

        </div>

        <button
          className="create-announcement-btn"
          onClick={() =>
            setShowModal(true)
          }
        >
          <Plus size={18} />

          Create Announcement
        </button>

      </div>


      {/* ================= STATS ================= */}

      <div className="announcement-stats-grid">

        <div className="announcement-stat-card">

          <div className="announcement-stat-icon navy">
            <Megaphone size={21} />
          </div>

          <div>
            <span>
              Total Announcements
            </span>

            <strong>
              {totalAnnouncements}
            </strong>
          </div>

        </div>


        <div className="announcement-stat-card">

          <div className="announcement-stat-icon yellow">
            <Pin size={21} />
          </div>

          <div>
            <span>
              Pinned Announcements
            </span>

            <strong>
              {pinnedAnnouncements}
            </strong>
          </div>

        </div>


        <div className="announcement-stat-card">

          <div className="announcement-stat-icon green">
            <Users size={21} />
          </div>

          <div>
            <span>
              Students Reached
            </span>

            <strong>
              {totalStudents}
            </strong>
          </div>

        </div>

      </div>


      {/* ================= ANNOUNCEMENTS ================= */}

      <div className="announcements-container">

        <div className="announcements-list-header">

          <div>

            <h2>
              Recent Announcements
            </h2>

            <p>
              Latest updates shared
              with students.
            </p>

          </div>


          <select
            className="announcement-filter"
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value
              )
            }
          >

            <option value="ALL">
              All Announcements
            </option>

            <option value="PINNED">
              Pinned
            </option>

            {batches.map(
              (batch) => (
                <option
                  key={batch._id}
                  value={batch._id}
                >
                  {getBatchLabel(batch)}
                </option>
              )
            )}

          </select>

        </div>


        {/* ================= LOADING ================= */}

        {loading ? (

          <div className="no-announcements">
            Loading announcements...
          </div>

        ) : filteredAnnouncements.length ===
          0 ? (

          <div className="no-announcements">

            <Megaphone size={45} />

            <h3>
              No announcements found
            </h3>

            <p>
              Create your first announcement
              for your students.
            </p>

          </div>

        ) : (

          <div className="announcement-list">

            {filteredAnnouncements.map(
              (announcement) => (

                <div
                  className={`announcement-card ${
                    announcement.pinned
                      ? "pinned-card"
                      : ""
                  }`}
                  key={announcement._id}
                >

                  <div className="announcement-icon">
                    <Megaphone size={20} />
                  </div>


                  <div className="announcement-content">

                    <div className="announcement-top">

                      <div className="announcement-title-area">

                        <h3>
                          {announcement.title}
                        </h3>

                        {announcement.pinned && (

                          <span className="pinned-badge">

                            <Pin size={11} />

                            Pinned

                          </span>

                        )}

                      </div>


                      <button
                        className="announcement-menu"
                        type="button"
                      >
                        <MoreVertical size={18} />
                      </button>

                    </div>


                    <p className="announcement-message">
                      {announcement.description}
                    </p>


                    <div className="announcement-meta">

                      <span>

                        <Users size={14} />

                        {/* FIX:
                            Check batchId directly.
                            DO NOT check audience === BATCH.
                        */}

                        {announcement.batchId
                          ? getBatchLabel(
                              announcement.batchId
                            )
                          : "All Students"}

                      </span>


                      <span>

                        <CalendarDays size={14} />

                        {formatDate(
                          announcement.createdAt
                        )}

                      </span>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>


      {/* ================= MODAL ================= */}

      {showModal && (

        <div className="announcement-modal-overlay">

          <div className="announcement-modal">

            <div className="announcement-modal-header">

              <div>

                <h2>
                  Create Announcement
                </h2>

                <p>
                  Share an important update
                  with your students.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
              >
                <X size={20} />
              </button>

            </div>


            <div className="announcement-form">

              {/* TITLE */}

              <div className="announcement-form-group">

                <label>
                  Announcement Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter announcement title"
                />

              </div>


              {/* MESSAGE */}

              <div className="announcement-form-group">

                <label>
                  Message
                </label>

                <textarea
                  rows="5"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your announcement..."
                />

              </div>


              <div className="announcement-form-row">

                {/* AUDIENCE */}

                <div className="announcement-form-group">

                  <label>
                    Send To
                  </label>

                  <select
                    name="audience"
                    value={formData.audience}
                    onChange={handleChange}
                  >

                    <option value="ALL">
                      All Students
                    </option>

                    <option value="BATCH">
                      Specific Batch
                    </option>

                  </select>

                </div>


                {/* PIN */}

                <div className="announcement-checkbox-group">

                  <label className="pin-checkbox">

                    <input
                      type="checkbox"
                      name="pinned"
                      checked={formData.pinned}
                      onChange={handleChange}
                    />

                    <span>

                      <Pin size={14} />

                      Pin this announcement

                    </span>

                  </label>

                </div>

              </div>


              {/* BATCH SELECT */}

              {formData.audience ===
                "BATCH" && (

                <div className="announcement-form-group">

                  <label>
                    Select Batch
                  </label>

                  <select
                    name="batchId"
                    value={formData.batchId}
                    onChange={handleChange}
                  >

                    <option value="">
                      Select Batch
                    </option>

                    {batches.map(
                      (batch) => (

                        <option
                          key={batch._id}
                          value={batch._id}
                        >
                          {getBatchLabel(batch)}
                        </option>

                      )
                    )}

                  </select>

                </div>

              )}

            </div>


            {/* FOOTER */}

            <div className="announcement-modal-footer">

              <button
                className="cancel-announcement-btn"
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                disabled={publishing}
              >
                Cancel
              </button>


              <button
                className="publish-announcement-btn"
                type="button"
                onClick={handleSubmit}
                disabled={publishing}
              >

                <Send size={15} />

                {publishing
                  ? "Publishing..."
                  : "Publish Announcement"}

              </button>

            </div>

          </div>

        </div>

      )}
<AlertModal
  isOpen={alert.isOpen}
  type={alert.type}
  title={alert.title}
  message={alert.message}
  onClose={() =>
    setAlert({
      isOpen: false,
      type: "error",
      title: "",
      message: "",
    })
  }
/>
    </div>
  );
};

export default TeacherAnnouncements;