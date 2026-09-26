const TaskCategory = require("../models/TaskCategory");
const TaskReportTask = require("../models/TaskReportTask");
const StudentTaskProgress = require("../models/StudentTaskProgress");
const Batch = require("../models/Batch");
const User = require("../models/User");
const TaskReportSettings = require("../models/TaskReportSettings");
const mongoose = require("mongoose");

/* =====================================================
HELPER
ESCAPE REGEX CHARACTERS
===================================================== */

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/* =====================================================
HELPER
CHECK TASK REPORT TEACHER ACCESS
===================================================== */

const isAssignedTaskReportTeacher = async (teacherId) => {
  const settings = await TaskReportSettings.findOne()
    .select("assignedTeachers")
    .lean();

  if (!settings || !settings.assignedTeachers?.length) {
    return false;
  }
return settings.assignedTeachers.some(
  (assignedTeacherId) =>
    assignedTeacherId &&
    teacherId &&
    String(assignedTeacherId) === String(teacherId)
);
};

/* =====================================================
HELPER
BUILD STUDENT TASK REPORT
===================================================== */

const buildStudentTaskReport = async (studentId) => {
  const categories = await TaskCategory.find({
    isActive: true,
  })
    .sort({
      order: 1,
      createdAt: 1,
    })
    .lean();

  const tasks = await TaskReportTask.find({
    isActive: true,
  })
    .sort({
      order: 1,
      createdAt: 1,
    })
    .lean();

  const progressRecords = await StudentTaskProgress.find({
    studentId,
  }).lean();

  const progressMap = new Map();

  progressRecords.forEach((progress) => {
    progressMap.set(progress.taskId.toString(), progress);
  });

  /* ===============================================
  BUILD CATEGORY + TASK STRUCTURE
  =============================================== */

  const formattedCategories = categories.map((category) => {
    const categoryTasks = tasks
      .filter(
        (task) => task.categoryId.toString() === category._id.toString()
      )
      .map((task) => {
        const progress = progressMap.get(task._id.toString());

        return {
          _id: task._id,
          title: task.title,
          description: task.description || "",
          order: task.order,
          progressId: progress?._id || null,
          status: progress?.status || "NOT_STARTED",
          submittedAt: progress?.submittedAt || null,
          reviewedAt: progress?.reviewedAt || null,
          rejectionReason: progress?.rejectionReason || "",
        };
      });

    return {
      _id: category._id,
      name: category.name,
      description: category.description || "",
      order: category.order,
      tasks: categoryTasks,
    };
  });

  /* ===============================================
  CALCULATE STATS
  =============================================== */

  const totalTasks = tasks.length;

  const completedTasks = progressRecords.filter(
    (progress) => progress.status === "COMPLETED"
  ).length;

  const pendingTasks = progressRecords.filter(
    (progress) => progress.status === "PENDING"
  ).length;

  const rejectedTasks = progressRecords.filter(
    (progress) => progress.status === "REJECTED"
  ).length;

  const notStartedTasks = Math.max(
    totalTasks - completedTasks - pendingTasks - rejectedTasks,
    0
  );

  const score =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    categories: formattedCategories,
    stats: {
      totalTasks,
      completedTasks,
      pendingTasks,
      rejectedTasks,
      notStartedTasks,
      score,
    },
  };
};

/* =====================================================
ADMIN
CREATE CATEGORY
===================================================== */

const createCategory = async (req, res) => {
  try {
    const { name, description, order } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const existingCategory = await TaskCategory.findOne({
      name: {
        $regex: `^${escapeRegex(name.trim())}$`,
        $options: "i",
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await TaskCategory.create({
      name: name.trim(),
      description: description?.trim() || "",
      order: Number(order) || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create Task Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create category",
    });
  }
};

/* =====================================================
ADMIN
UPDATE CATEGORY
===================================================== */

const updateCategory = async (req, res) => {
  try {
    const { name, description, order, isActive } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await TaskCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name !== undefined) {
  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Category name must be a valid string",
    });
  }

      /* Prevent duplicate category name */

      const existingCategory = await TaskCategory.findOne({
        _id: {
          $ne: category._id,
        },
        name: {
          $regex: `^${escapeRegex(name.trim())}$`,
          $options: "i",
        },
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category already exists",
        });
      }

      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    if (order !== undefined) {
      category.order = Number(order) || 0;
    }

    if (isActive !== undefined) {
      category.isActive = Boolean(isActive);
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Update Task Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update category",
    });
  }
};

/* =====================================================
ADMIN
DELETE CATEGORY

Also deletes all tasks inside category
and related student progress.
===================================================== */

const deleteCategory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await TaskCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const tasks = await TaskReportTask.find({
      categoryId: category._id,
    });

    const taskIds = tasks.map((task) => task._id);

    if (taskIds.length > 0) {
      await StudentTaskProgress.deleteMany({
        taskId: {
          $in: taskIds,
        },
      });

      await TaskReportTask.deleteMany({
        categoryId: category._id,
      });
    }

    await TaskCategory.findByIdAndDelete(category._id);

    return res.status(200).json({
      success: true,
      message: "Category and related tasks deleted successfully",
    });
  } catch (error) {
    console.error("Delete Task Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete category",
    });
  }
};

/* =====================================================
ADMIN
CREATE TASK
===================================================== */

const createTaskReportTask = async (req, res) => {
  try {
    const { categoryId, title, description, order } = req.body;

    if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Valid category ID is required",
      });
    }

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const category = await TaskCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const task = await TaskReportTask.create({
      categoryId,
      title: title.trim(),
      description: description?.trim() || "",
      order: Number(order) || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Task added successfully",
      task,
    });
  } catch (error) {
    console.error("Create Task Report Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create task",
    });
  }
};

/* =====================================================
ADMIN
UPDATE TASK
===================================================== */

const updateTaskReportTask = async (req, res) => {
  try {
    const { categoryId, title, description, order, isActive } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await TaskReportTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (categoryId !== undefined) {
      if (!mongoose.isValidObjectId(categoryId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      const category = await TaskCategory.findById(categoryId);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      task.categoryId = categoryId;
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title cannot be empty",
        });
      }

      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = description.trim();
    }

    if (order !== undefined) {
      task.order = Number(order) || 0;
    }

    if (isActive !== undefined) {
      task.isActive = Boolean(isActive);
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update Task Report Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update task",
    });
  }
};

/* =====================================================
ADMIN
DELETE TASK
===================================================== */

const deleteTaskReportTask = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await TaskReportTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await StudentTaskProgress.deleteMany({
      taskId: task._id,
    });

    await TaskReportTask.findByIdAndDelete(task._id);

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete Task Report Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete task",
    });
  }
};

/* =====================================================
ADMIN
GET COMPLETE MASTER TASK REPORT
===================================================== */

const getTaskReportMaster = async (req, res) => {
  try {
    const categories = await TaskCategory.find()
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    const tasks = await TaskReportTask.find()
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    const formattedCategories = categories.map((category) => ({
      ...category,
      tasks: tasks.filter(
        (task) => task.categoryId.toString() === category._id.toString()
      ),
    }));

    return res.status(200).json({
      success: true,
      categories: formattedCategories,
    });
  } catch (error) {
    console.error("Get Task Report Master Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch task report",
    });
  }
};

/* =====================================================
ADMIN
GET TASK REPORT SETTINGS
Returns currently assigned teachers
===================================================== */

const getTaskReportSettings = async (req, res) => {
  try {
    let settings = await TaskReportSettings.findOne()
      .populate(
        "assignedTeachers",
        "name email avatar phone specializations status isActive"
      )
      .lean();

    if (!settings) {
      settings = {
        assignedTeachers: [],
      };
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get Task Report Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch task report settings",
    });
  }
};

/* =====================================================
ADMIN
UPDATE TASK REPORT ASSIGNED TEACHERS

Only assigned teachers can review
student task reports.
===================================================== */

const updateTaskReportSettings = async (req, res) => {
  try {
    const { assignedTeachers } = req.body;

    if (!Array.isArray(assignedTeachers)) {
      return res.status(400).json({
        success: false,
        message: "assignedTeachers must be an array",
      });
    }

    /* Remove duplicate and invalid IDs */

    const uniqueTeacherIds = [
      ...new Set(
        assignedTeachers
          .filter((id) => mongoose.isValidObjectId(id))
          .map((id) => id.toString())
      ),
    ];

    /* Validate all teachers */

    if (uniqueTeacherIds.length > 0) {
      const teachers = await User.find({
        _id: {
          $in: uniqueTeacherIds,
        },
        role: "TEACHER",
        isActive: true,
        status: "ACTIVE",
      });

      if (teachers.length !== uniqueTeacherIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected teachers are invalid or inactive",
        });
      }
    }

    /* Find existing settings */

    let settings = await TaskReportSettings.findOne();

    if (!settings) {
      settings = await TaskReportSettings.create({
        assignedTeachers: uniqueTeacherIds,
      });
    } else {
      settings.assignedTeachers = uniqueTeacherIds;
      await settings.save();
    }

    /* Populate response */

    await settings.populate(
      "assignedTeachers",
      "name email avatar phone specializations status isActive"
    );

    return res.status(200).json({
      success: true,
      message: "Task report teachers updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update Task Report Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update task report settings",
    });
  }
};

/* =====================================================
STUDENT
GET MY TASK REPORT
===================================================== */

const getMyTaskReport = async (req, res) => {
  try {
    const report = await buildStudentTaskReport(req.user._id);

    return res.status(200).json({
      success: true,
      ...report,
    });
  } catch (error) {
    console.error("Get My Task Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch task report",
    });
  }
};

/* =====================================================
STUDENT
SUBMIT TASK FOR APPROVAL
===================================================== */

const submitTaskForApproval = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await TaskReportTask.findOne({
      _id: taskId,
      isActive: true,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    let progress = await StudentTaskProgress.findOne({
      studentId: req.user._id,
      taskId,
    });

    if (progress && progress.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "This task is already completed",
      });
    }

    if (progress && progress.status === "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Task is already pending for teacher approval",
      });
    }

    if (!progress) {
      progress = await StudentTaskProgress.create({
        studentId: req.user._id,
        taskId,
        status: "PENDING",
        submittedAt: new Date(),
        rejectionReason: "",
      });
    } else {
      progress.status = "PENDING";
      progress.submittedAt = new Date();
      progress.reviewedAt = null;
      progress.reviewedBy = null;
      progress.rejectionReason = "";

      await progress.save();
    }

    return res.status(200).json({
      success: true,
      message: "Task submitted for teacher approval",
      progress,
    });
  } catch (error) {
    console.error("Submit Task For Approval Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit task",
    });
  }
};

/* =====================================================
TEACHER
GET STUDENTS TASK REPORT SUMMARY

Only Admin-assigned Task Report teachers
can access all student Task Reports.
===================================================== */

const getTeacherStudentsTaskReports = async (req, res) => {
  try {
    /* ===============================================
       CHECK TASK REPORT TEACHER ACCESS
    =============================================== */

    const hasAccess = await isAssignedTaskReportTeacher(req.user._id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to review Task Reports",
      });
    }

    /* ===============================================
       OPTIONAL FILTERS
    =============================================== */

    const { batchTiming, batchId, search } = req.query;

    const studentQuery = {
      role: "STUDENT",
      isActive: true,
    };

    /* Filter by Batch Timing */

    if (batchTiming?.trim()) {
      studentQuery.batchTiming = batchTiming.trim();
    }

    /* Filter by Canonical Batch ID */

    if (batchId?.trim()) {
      if (!mongoose.isValidObjectId(batchId.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch ID",
        });
      }

      studentQuery.batchId = batchId.trim();
    }

    /* Search Student */

    if (search?.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(safeSearch, "i");

      studentQuery.$or = [
        {
          name: searchRegex,
        },
        {
          email: searchRegex,
        },
      ];
    }

    /* ===============================================
       GET STUDENTS
    =============================================== */



      const students = await User.find(studentQuery)
  .select("name email avatar batchId batchTiming joiningDate")
  .sort({
    name: 1,
  })
  .lean();

    /* ===============================================
       TOTAL ACTIVE TASK REPORT TASKS
    =============================================== */

    const totalTasks = await TaskReportTask.countDocuments({
      isActive: true,
    });

    const studentIds = students.map((student) => student._id);

    /* ===============================================
       GET ALL STUDENT PROGRESS
    =============================================== */

    const progressRecords = await StudentTaskProgress.find({
      studentId: {
        $in: studentIds,
      },
    }).lean();

    /* ===============================================
       BUILD STUDENT SUMMARY
    =============================================== */

    const formattedStudents = students.map((student) => {
      const studentProgress = progressRecords.filter(
  (progress) =>
    progress.studentId &&
    student?._id &&
    progress.studentId.toString() ===
      student._id.toString()
);

      const completed = studentProgress.filter(
        (progress) => progress.status === "COMPLETED"
      ).length;

      const pending = studentProgress.filter(
        (progress) => progress.status === "PENDING"
      ).length;

      const rejected = studentProgress.filter(
        (progress) => progress.status === "REJECTED"
      ).length;

      const notStarted = Math.max(
        totalTasks - completed - pending - rejected,
        0
      );

      const score =
        totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

      return {
        ...student,
        stats: {
          totalTasks,
          completed,
          pending,
          rejected,
          notStarted,
          score,
        },
      };
    });

    /* ===============================================
       GET AVAILABLE BATCH TIMINGS
    =============================================== */

    const batchTimings = [
      ...new Set(
        formattedStudents
          .map((student) => student.batchTiming)
          .filter(Boolean)
      ),
    ];

    return res.status(200).json({
      success: true,
      count: formattedStudents.length,
      filters: {
        batchTiming: batchTiming || "",
        batchId: batchId || "",
        search: search || "",
        availableBatchTimings: batchTimings,
      },
      students: formattedStudents,
    });
  } catch (error) {
    console.error(
  "Get Teacher Student Reports Error:",
  error.message,
  error.stack
);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch student task reports",
    });
  }
};

/* =====================================================
TEACHER / ADMIN
GET SINGLE STUDENT TASK REPORT

ADMIN can view any student report.

TEACHER can view reports only if assigned by Admin
as a Task Report reviewer.
===================================================== */

const getStudentTaskReport = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    /* ===============================================
       CHECK STUDENT
    =============================================== */

    const student = await User.findOne({
      _id: studentId,
      role: "STUDENT",
      isActive: true,
    })
      .select("name email avatar batchId batchTiming joiningDate")
      .populate("batchId", "name code batchTiming startTime endTime")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    /* ===============================================
       TEACHER ACCESS CHECK

       Only Admin-assigned Task Report teachers
       can view student Task Reports.
    =============================================== */

    if (req.user.role === "TEACHER") {
      const hasAccess = await isAssignedTaskReportTeacher(req.user._id);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to review Task Reports",
        });
      }
    }

    /* ===============================================
       BUILD STUDENT REPORT
    =============================================== */

    const report = await buildStudentTaskReport(studentId);

    return res.status(200).json({
      success: true,
      student,
      ...report,
    });
  } catch (error) {
    console.error("Get Student Task Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch student task report",
    });
  }
};

/* =====================================================
TEACHER / ADMIN
REVIEW STUDENT TASK

ADMIN can review any task.

Only teachers assigned by Admin in Task Report Settings
can approve or reject student Task Report tasks.
===================================================== */

const reviewStudentTask = async (req, res) => {
  try {
    const { progressId } = req.params;

    if (!mongoose.isValidObjectId(progressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid progress ID",
      });
    }

    const { status, rejectionReason } = req.body;

const normalizedRejectionReason =
  typeof rejectionReason === "string"
    ? rejectionReason.trim()
    : "";

    /* ===============================================
       VALIDATE STATUS
    =============================================== */

    if (!["COMPLETED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be COMPLETED or REJECTED",
      });
    }

    if (status === "REJECTED" && !normalizedRejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    /* ===============================================
       FIND PROGRESS
    =============================================== */

    const progress = await StudentTaskProgress.findById(progressId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Task progress not found",
      });
    }

    if (progress.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending tasks can be reviewed",
      });
    }

    /* ===============================================
       TEACHER ACCESS CHECK

       Admin can always review.

       Teacher must be assigned by Admin
       as a Task Report reviewer.
    =============================================== */

    if (req.user.role === "TEACHER") {
      const hasAccess = await isAssignedTaskReportTeacher(req.user._id);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to review Task Reports",
        });
      }
    }

    /* ===============================================
       UPDATE PROGRESS
    =============================================== */

    progress.status = status;
    progress.reviewedAt = new Date();
    progress.reviewedBy = req.user._id;
progress.rejectionReason =
  status === "REJECTED" ? normalizedRejectionReason : "";

    await progress.save();

    return res.status(200).json({
      success: true,
      message:
        status === "COMPLETED"
          ? "Task approved successfully"
          : "Task rejected successfully",
      progress,
    });
  } catch (error) {
    console.error("Review Student Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to review student task",
    });
  }
};

/* =====================================================
ADMIN
GET ALL STUDENT TASK REPORT SUMMARY
===================================================== */

const getAllStudentsTaskReports = async (req, res) => {
  try {
    const students = await User.find({
      role: "STUDENT",
      isActive: true,
    })
      .select(
  "name email avatar batchId batchTiming teacherId"
)
.populate("teacherId", "name email")
.populate(
  "batchId",
  "name code batchTiming startTime endTime"
)
      .sort({
        name: 1,
      })
      .lean();

    const totalTasks = await TaskReportTask.countDocuments({
      isActive: true,
    });

    const studentIds = students.map((student) => student._id);

    const progressRecords = await StudentTaskProgress.find({
      studentId: {
        $in: studentIds,
      },
    }).lean();

    const formattedStudents = students.map((student) => {
      const progress = progressRecords.filter(
        (item) => item.studentId.toString() === student._id.toString()
      );

      const completed = progress.filter(
        (item) => item.status === "COMPLETED"
      ).length;

      const pending = progress.filter(
        (item) => item.status === "PENDING"
      ).length;

      const rejected = progress.filter(
        (item) => item.status === "REJECTED"
      ).length;

      const score =
        totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

      return {
        ...student,
        stats: {
          totalTasks,
          completed,
          pending,
          rejected,
          score,
        },
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedStudents.length,
      students: formattedStudents,
    });
  } catch (error) {
    console.error("Get All Student Task Reports Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch student task reports",
    });
  }
};

module.exports = {
  /* ADMIN CATEGORY */
  createCategory,
  updateCategory,
  deleteCategory,

  /* ADMIN TASK */
  createTaskReportTask,
  updateTaskReportTask,
  deleteTaskReportTask,

  /* MASTER */
  getTaskReportMaster,

  /* STUDENT */
  getMyTaskReport,
  submitTaskForApproval,

  /* TEACHER */
  getTeacherStudentsTaskReports,
  getStudentTaskReport,
  reviewStudentTask,

  /* ADMIN REPORT */
  getAllStudentsTaskReports,

  /* ADMIN TASK REPORT SETTINGS */
  getTaskReportSettings,
  updateTaskReportSettings,
};