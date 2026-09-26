const express = require("express");

const {
  createCategory,
  updateCategory,
  deleteCategory,

  createTaskReportTask,
  updateTaskReportTask,
  deleteTaskReportTask,

  getTaskReportMaster,

  getTaskReportSettings,
  updateTaskReportSettings,

  getMyTaskReport,
  submitTaskForApproval,

  getTeacherStudentsTaskReports,
  getStudentTaskReport,
  reviewStudentTask,

  getAllStudentsTaskReports,
} = require("../controllers/taskReportController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   ADMIN
   MASTER TASK REPORT
===================================================== */

router.get(
  "/master",
  protect,
  authorize("ADMIN"),
  getTaskReportMaster
);

/* =====================================================
   ADMIN
   CATEGORY CRUD
===================================================== */

router.post(
  "/categories",
  protect,
  authorize("ADMIN"),
  createCategory
);

router.put(
  "/categories/:id",
  protect,
  authorize("ADMIN"),
  updateCategory
);

router.delete(
  "/categories/:id",
  protect,
  authorize("ADMIN"),
  deleteCategory
);

/* =====================================================
   ADMIN
   TASK CRUD
===================================================== */

router.post(
  "/master/tasks",
  protect,
  authorize("ADMIN"),
  createTaskReportTask
);

router.put(
  "/master/tasks/:id",
  protect,
  authorize("ADMIN"),
  updateTaskReportTask
);

router.delete(
  "/master/tasks/:id",
  protect,
  authorize("ADMIN"),
  deleteTaskReportTask
);

/* =====================================================
   ADMIN
   TASK REPORT SETTINGS

   Assign multiple teachers who can review
   Task Reports
===================================================== */

router.get(
  "/settings",
  protect,
  authorize("ADMIN"),
  getTaskReportSettings
);

router.put(
  "/settings",
  protect,
  authorize("ADMIN"),
  updateTaskReportSettings
);

/* =====================================================
   ADMIN
   ALL STUDENTS TASK REPORT
===================================================== */

router.get(
  "/students",
  protect,
  authorize("ADMIN"),
  getAllStudentsTaskReports
);

/* =====================================================
   STUDENT
   MY TASK REPORT
===================================================== */

router.get(
  "/my-report",
  protect,
  authorize("STUDENT"),
  getMyTaskReport
);

/* =====================================================
   STUDENT
   SUBMIT TASK FOR APPROVAL
===================================================== */

router.post(
  "/tasks/:taskId/submit",
  protect,
  authorize("STUDENT"),
  submitTaskForApproval
);

/* =====================================================
   TEACHER
   STUDENTS TASK REPORT SUMMARY
===================================================== */

router.get(
  "/teacher/students",
  protect,
  authorize("TEACHER"),
  getTeacherStudentsTaskReports
);

/* =====================================================
   TEACHER + ADMIN
   SINGLE STUDENT REPORT
===================================================== */

router.get(
  "/students/:studentId",
  protect,
  authorize("ADMIN", "TEACHER"),
  getStudentTaskReport
);

/* =====================================================
   TEACHER + ADMIN
   APPROVE / REJECT TASK
===================================================== */

router.put(
  "/progress/:progressId/review",
  protect,
  authorize("ADMIN", "TEACHER"),
  reviewStudentTask
);

module.exports = router;