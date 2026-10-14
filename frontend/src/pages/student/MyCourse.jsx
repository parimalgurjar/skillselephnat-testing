import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  Layers,
  AlertCircle,
  RefreshCw,
  Clock,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";

import api from "../../services/api";

import "./MyCourse.css";

const MyCourse = () => {
  const { user, loading: authLoading } = useAuth();

  const userId = user?.id || user?._id || null;

  const courseId =
    typeof user?.courseId === "string"
      ? user.courseId
      : user?.courseId?._id || null;

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const requestRef = useRef(null);

  /* =====================================================
     LOAD ASSIGNED COURSE, MODULES AND STUDENT TASKS
  ===================================================== */

  const loadCourseData = useCallback(async () => {
    if (authLoading) return;

    requestRef.current?.abort();

    if (!userId) {
      setCourse(null);
      setModules([]);
      setTasks([]);
      setError("Please sign in again to load your course.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;

    const config = {
      signal: controller.signal,
    };

    setLoading(true);
    setError("");

    const fetchCourse = async () => {
      if (!courseId) return null;

      const response = await api.get(
        `/courses/${courseId}`,
        config
      );

      if (
        !response.data?.success ||
        !response.data.course
      ) {
        throw new Error(
          "Invalid course response from server."
        );
      }

      return response.data.course;
    };

    const fetchModules = async () => {
      if (!courseId) return [];

      const response = await api.get(
        `/modules/course/${courseId}/active`,
        config
      );

      if (
        !response.data?.success ||
        !Array.isArray(response.data.modules)
      ) {
        throw new Error(
          "Invalid modules response from server."
        );
      }

      return response.data.modules;
    };

    const fetchTasks = async () => {
      const response = await api.get(
        "/tasks/my-work",
        config
      );

      if (
        !response.data?.success ||
        !Array.isArray(response.data.tasks)
      ) {
        throw new Error(
          "Invalid tasks response from server."
        );
      }

      return response.data.tasks;
    };

    const getErrorMessage = (reason, fallback) =>
      reason?.response?.data?.message ||
      reason?.userMessage ||
      reason?.message ||
      fallback;

    try {
      const [
        courseResult,
        modulesResult,
        tasksResult,
      ] = await Promise.allSettled([
        fetchCourse(),
        fetchModules(),
        fetchTasks(),
      ]);

      if (controller.signal.aborted) return;

      const failures = [];

      /* ================= COURSE ================= */

      if (courseResult.status === "fulfilled") {
        setCourse(courseResult.value);
      } else {
        setCourse(null);

        failures.push(
          `Course: ${getErrorMessage(
            courseResult.reason,
            "Unable to load assigned course."
          )}`
        );
      }

      /* ================= MODULES ================= */

      if (modulesResult.status === "fulfilled") {
        setModules(modulesResult.value);
      } else {
        setModules([]);

        failures.push(
          `Modules: ${getErrorMessage(
            modulesResult.reason,
            "Unable to load course modules."
          )}`
        );
      }

      /* ================= STUDENT TASKS ================= */

      if (tasksResult.status === "fulfilled") {
        setTasks(tasksResult.value);
      } else {
        setTasks([]);

        failures.push(
          `Tasks: ${getErrorMessage(
            tasksResult.reason,
            "Unable to load assigned tasks."
          )}`
        );
      }

      // Show failures instead of misleading empty counts.
      setError(failures.join(" "));
    } catch (err) {
      if (controller.signal.aborted) return;

      setError(
        getErrorMessage(
          err,
          "Unable to load course information."
        )
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);

        if (requestRef.current === controller) {
          requestRef.current = null;
        }
      }
    }
  }, [authLoading, userId, courseId]);

  useEffect(() => {
    loadCourseData();

    return () => {
      requestRef.current?.abort();
    };
  }, [loadCourseData]);

  /* =====================================================
     TASK STATUS
  ===================================================== */

  const getTaskStatus = (task) => {
    const submissionStatus =
      task?.submission?.status;

    if (submissionStatus === "APPROVED") {
      return {
        label: "Completed",
        variant: "success",
      };
    }

    if (submissionStatus === "PENDING") {
      return {
        label: "Submitted",
        variant: "warning",
      };
    }

    if (submissionStatus === "REJECTED") {
      return {
        label: "Rejected",
        variant: "danger",
      };
    }

    if (
      (task?.submission?.completedCount || 0) > 0
    ) {
      return {
        label: "In Progress",
        variant: "warning",
      };
    }

    return {
      label: "Pending",
      variant: "warning",
    };
  };

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {
    if (!date) {
      return "No due date";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "No due date";
    }

    return `Due: ${parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )}`;
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="my-course-page">
        <div className="my-course-loading">
          <RefreshCw
            size={28}
            className="my-course-spinner"
          />

          <p>Loading your course...</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <div className="my-course-page">
        <div className="my-course-error">
          <AlertCircle size={28} />

          <div>
            <h3>Unable to load course information</h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={loadCourseData}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const notesUrl =
    course?.notesUrl ||
    course?.notesLink ||
    "https://skillselephant.com/legendary-notes/";

  return (
    <div className="my-course-page">
      {/* PAGE HEADING */}

      <div className="my-course-heading">
        <div>
          <h1>My Course</h1>

          <p>
            Access your course modules,
            learning notes and assigned work.
          </p>
        </div>

        <button
          type="button"
          className="my-course-refresh-btn"
          onClick={loadCourseData}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* COURSE HERO */}

      <div className="course-hero">
        <div className="course-hero-icon">
          <BookOpen size={30} />
        </div>

        <div className="course-hero-content">
          <Badge variant="gold">
            SKILLSELEPHANT
          </Badge>

          <h2>
            {course?.name || "Course Not Assigned"}
          </h2>

          <p>
            {course
              ? course.description ||
                "Access your assigned course modules and learning notes."
              : "Your course information will be available once a course is assigned."}
          </p>

          <div className="course-hero-meta">
            <span>
              <Layers size={16} />
              {modules.length} Modules
            </span>

            <span>
              <ClipboardList size={16} />
              {tasks.length} Assigned Tasks
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}

      <div className="my-course-grid">
        {/* COURSE MODULES */}

        <Card
          title="Course Modules"
          subtitle="Your complete learning curriculum"
        >
          {modules.length === 0 ? (
            <div className="course-empty-state">
              <BookOpen size={32} />

              <h4>
                {course
                  ? "No modules available"
                  : "Course not assigned"}
              </h4>

              <p>
                {course
                  ? "No active modules are available for your course yet."
                  : "Your modules will appear once a course is assigned."}
              </p>
            </div>
          ) : (
            <div className="modules-list">
              {modules.map((module, index) => {
                const moduleTitle =
                  module.name ||
                  `Module ${index + 1}`;

                const moduleDescription =
                  module.description ||
                  "Course Module";

                return (
                  <div
                    className="module-item"
                    key={module._id}
                  >
                    <div className="module-number">
                      {String(
                        module.moduleNumber ||
                          index + 1
                      ).padStart(2, "0")}
                    </div>

                    <div className="module-info">
                      <h4>{moduleTitle}</h4>

                      <span>
                        {moduleDescription}
                      </span>
                    </div>

                    <CheckCircle2
                      className="module-check"
                      size={20}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <a
            href={notesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="view-notes-button"
          >
            <FileText size={18} />

            View Learning Notes

            <ExternalLink size={16} />
          </a>
        </Card>

        {/* MY WORK */}

        <Card
          title="My Work"
          subtitle="Assignments and practical tasks"
        >
          {tasks.length === 0 ? (
            <div className="course-empty-state">
              <ClipboardList size={32} />

              <h4>No tasks assigned</h4>

              <p>
                Tasks assigned to your batch
                will appear here.
              </p>
            </div>
          ) : (
            <div className="work-list">
              {tasks.slice(0, 6).map((task) => {
                const taskStatus =
                  getTaskStatus(task);

                const completedCount =
                  task?.submission
                    ?.completedCount || 0;

                const totalTasks =
                  task?.totalTasks ||
                  task?.tasks?.length ||
                  0;

                return (
                  <div
                    className="work-item"
                    key={task._id}
                  >
                    <div className="work-icon">
                      {taskStatus.label ===
                      "Completed" ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <Clock size={20} />
                      )}
                    </div>

                    <div className="work-content">
                      <div className="work-header">
                        <h4>{task.title}</h4>

                        <Badge
                          variant={
                            taskStatus.variant
                          }
                          size="small"
                        >
                          {taskStatus.label}
                        </Badge>
                      </div>

                      {task.description && (
                        <p>{task.description}</p>
                      )}

                      <div className="work-meta">
                        <span className="work-date">
                          {formatDate(task.dueDate)}
                        </span>

                        <span className="work-progress">
                          {completedCount}
                          {" / "}
                          {totalTasks}
                          {" completed"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MyCourse;