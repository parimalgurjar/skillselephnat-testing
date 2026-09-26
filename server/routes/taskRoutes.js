const express = require("express");

const {
  createTask,
  getAllTasks,
  getMyTasks,
  getTaskById,
  updateTask,
  getStudentTasks,
  saveTaskProgress,
  submitTask,
  deleteTask,
  getPendingTaskReports,
  reviewTaskReport,
  getReviewedTaskReports,
  getMyPerformance,
  getMyTaskReport,
} = require("../controllers/taskController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   STUDENT ROUTES
===================================================== */

/* GET MY TASKS */

router.get(
  "/my-work",
  protect,
  authorize("STUDENT"),
  getStudentTasks
);

/* SAVE TASK PROGRESS */

router.put(
  "/:id/progress",
  protect,
  authorize("STUDENT"),
  saveTaskProgress
);

/* SUBMIT TASK */

router.post(
  "/:id/submit",
  protect,
  authorize("STUDENT"),
  submitTask
);
/* GET MY TASK REPORT */

router.get(
  "/my-report",
  protect,
  authorize("STUDENT"),
  getMyTaskReport
);

/* GET MY PERFORMANCE */

router.get(
  "/my-performance",
  protect,
  authorize("STUDENT"),
  getMyPerformance
);

/* =====================================================
   TEACHER ROUTES
===================================================== */

/* GET MY CREATED TASKS */

router.get(
  "/my-tasks",
  protect,
  authorize("TEACHER"),
  getMyTasks
);

/* GET PENDING REPORTS */

router.get(
  "/pending-reports",
  protect,
  authorize("TEACHER"),
  getPendingTaskReports
);

/* GET REVIEWED REPORTS */

router.get(
  "/reviewed-reports",
  protect,
  authorize("TEACHER"),
  getReviewedTaskReports
);

/* REVIEW STUDENT SUBMISSION */

router.put(
  "/:taskId/submissions/:submissionId/review",
  protect,
  authorize("TEACHER"),
  reviewTaskReport
);

/* =====================================================
   ADMIN ROUTES
===================================================== */

/* GET ALL TASKS */

router.get(
  "/",
  protect,
  authorize("ADMIN"),
  getAllTasks
);

/* =====================================================
   CREATE TASK
===================================================== */

router.post(
  "/",
  protect,
  authorize("ADMIN", "TEACHER"),
  createTask
);

/* =====================================================
   SINGLE TASK
===================================================== */

router.get(
  "/:id",
  protect,
  authorize(
    "ADMIN",
    "TEACHER",
    "STUDENT"
  ),
  getTaskById
);

/* =====================================================
   UPDATE TASK
===================================================== */

router.put(
  "/:id",
  protect,
  authorize("ADMIN", "TEACHER"),
  updateTask
);

/* =====================================================
   DELETE TASK
===================================================== */

router.delete(
  "/:id",
  protect,
  authorize("ADMIN", "TEACHER"),
  deleteTask
);

module.exports = router;