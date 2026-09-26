import {
  useCallback,
  useEffect,
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

import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";

import api from "../../services/api";

import "./MyCourse.css";

const MyCourse = () => {
  const [course, setCourse] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD COURSE + STUDENT TASKS
  ===================================================== */

  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [courseResult, taskResult] =
        await Promise.allSettled([
          api.get("/courses/active"),
          api.get("/tasks/student"),
        ]);

      /* ===============================================
         COURSE
      =============================================== */

      if (courseResult.status === "fulfilled") {
        const courseData =
          courseResult.value?.data;

        if (courseData?.success) {
          const courses =
            Array.isArray(courseData.courses)
              ? courseData.courses
              : [];

          setCourse(
            courses.length > 0
              ? courses[0]
              : null
          );
        } else {
          setCourse(null);
        }
      } else {
        console.error(
          "Course API Error:",
          courseResult.reason
        );

        setCourse(null);
      }

      /* ===============================================
         STUDENT TASKS
      =============================================== */

      if (taskResult.status === "fulfilled") {
        const taskData =
          taskResult.value?.data;

        if (taskData?.success) {
          setTasks(
            Array.isArray(taskData.tasks)
              ? taskData.tasks
              : []
          );
        } else {
          setTasks([]);
        }
      } else {
        console.error(
          "Student Tasks API Error:",
          taskResult.reason
        );

        setTasks([]);
      }

      /*
        Only show full page error when BOTH APIs fail.
      */

      if (
        courseResult.status === "rejected" &&
        taskResult.status === "rejected"
      ) {
        setError(
          "Unable to load course information. Please try again."
        );
      }
    } catch (err) {
      console.error(
        "My Course Load Error:",
        err
      );

      setError(
        "Unable to load course information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  /* =====================================================
     GET MODULES FROM COURSE

     Supports multiple possible backend structures.
  ===================================================== */

  const modules =
    Array.isArray(course?.modules)
      ? course.modules
      : Array.isArray(course?.curriculum)
      ? course.curriculum
      : Array.isArray(course?.topics)
      ? course.topics
      : [];

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

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
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

          <p>
            Loading your course...
          </p>
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
            <h3>
              Unable to load course
            </h3>

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
            {course?.name ||
              "Course Not Assigned"}
          </h2>

          <p>
            {course?.description ||
              "Your course information will be available once a course is assigned."}
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
                No modules available
              </h4>

              <p>
                Course modules have not been added yet.
              </p>
            </div>

          ) : (

            <div className="modules-list">

              {modules.map(
                (module, index) => {
                  const moduleTitle =
                    typeof module === "string"
                      ? module
                      : module?.title ||
                        module?.name ||
                        `Module ${index + 1}`;

                  const moduleDescription =
                    typeof module === "object"
                      ? module?.description ||
                        "Course Module"
                      : "Course Module";

                  return (
                    <div
                      className="module-item"
                      key={
                        module?._id ||
                        `${moduleTitle}-${index}`
                      }
                    >

                      <div className="module-number">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div className="module-info">
                        <h4>
                          {moduleTitle}
                        </h4>

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
                }
              )}

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

              <h4>
                No tasks assigned
              </h4>

              <p>
                Tasks assigned to your batch
                will appear here.
              </p>

            </div>

          ) : (

            <div className="work-list">

              {tasks.slice(0, 6).map(
                (task) => {
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

                          <CheckCircle2
                            size={20}
                          />

                        ) : (

                          <Clock size={20} />

                        )}

                      </div>

                      <div className="work-content">

                        <div className="work-header">

                          <h4>
                            {task.title}
                          </h4>

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
                          <p>
                            {task.description}
                          </p>
                        )}

                        <div className="work-meta">

                          <span className="work-date">
                            {formatDate(
                              task.dueDate
                            )}
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
                }
              )}

            </div>

          )}

        </Card>

      </div>

    </div>
  );
};

export default MyCourse;