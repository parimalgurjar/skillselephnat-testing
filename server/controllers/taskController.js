const mongoose = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");
const Batch = require("../models/Batch");

/* =====================================================
HELPERS
===================================================== */

const getTaskDisplayStatus = (task) => {
const now = new Date();

if (task.status === "DRAFT") {
return "Draft";
}

if (task.status === "COMPLETED") {
return "Completed";
}

if (task.dueDate && new Date(task.dueDate) < now) {
return "Overdue";
}

return "Active";
};

const calculateScore = (completedCount, totalTasks) => {
if (!totalTasks || totalTasks === 0) {
return 0;
}

return Math.round(
(completedCount / totalTasks) * 100
);
};

const isValidObjectId = (id) =>
mongoose.Types.ObjectId.isValid(id);

/* =====================================================
GET BATCH DISPLAY VALUE

Database relationship:
batchId → Batch._id

UI display:
Batch.batchTiming
===================================================== */

const getBatchDisplay = (batch) => {
if (!batch) {
return "";
}

if (typeof batch === "string") {
return batch;
}

return (
batch.batchTiming ||
batch.name ||
batch.code ||
""
);
};

/* =====================================================
FORMAT TASK WITH STATS
===================================================== */

const formatTaskWithStats = async (task) => {
const taskData =
task.toObject
? task.toObject()
: task;

const batchId =
taskData.batchId?._id ||
taskData.batchId;

const totalStudents =
batchId
? await User.countDocuments({
role: "STUDENT",
batchId,
isActive: true,
})
: 0;

const submissions =
Array.isArray(taskData.submissions)
? taskData.submissions
: [];

const pendingCount =
submissions.filter(
(submission) =>
submission.status === "PENDING"
).length;

const approvedCount =
submissions.filter(
(submission) =>
submission.status === "APPROVED"
).length;

const rejectedCount =
submissions.filter(
(submission) =>
submission.status === "REJECTED"
).length;

const draftCount =
submissions.filter(
(submission) =>
submission.status === "DRAFT"
).length;

const submittedCount =
submissions.filter(
(submission) =>
submission.status !== "DRAFT"
).length;

return {
...taskData,


batch:
  getBatchDisplay(
    taskData.batchId
  ),

totalStudents,

submitted: submittedCount,

pending: pendingCount,

approved: approvedCount,

rejected: rejectedCount,

draft: draftCount,

submissionStats:
  `${submittedCount}/${totalStudents}`,

displayStatus:
  getTaskDisplayStatus(taskData),


};
};

/* =====================================================
CREATE TASK
ADMIN + TEACHER
===================================================== */

const createTask = async (req, res) => {
try {
const {
title,
description,
batchId,
tasks,
priority,
dueDate,
} = req.body;


/* ================= VALIDATION ================= */

if (
  !title ||
  typeof title !== "string" ||
  !title.trim()
) {
  return res.status(400).json({
    success: false,
    message:
      "Task report title is required",
  });
}

if (
  !batchId ||
  !isValidObjectId(batchId)
) {
  return res.status(400).json({
    success: false,
    message:
      "Valid batch is required",
  });
}

if (!dueDate) {
  return res.status(400).json({
    success: false,
    message:
      "Due date is required",
  });
}

if (
  !Array.isArray(tasks) ||
  tasks.length === 0
) {
  return res.status(400).json({
    success: false,
    message:
      "At least one checklist task is required",
  });
}

/* ================= VERIFY BATCH ================= */

const batch =
  await Batch.findOne({
    _id: batchId,
    status: "ACTIVE",
  });

if (!batch) {
  return res.status(404).json({
    success: false,
    message:
      "Active batch not found",
  });
}

/* ================= VALIDATE DATE ================= */

const parsedDueDate =
  new Date(dueDate);

if (
  Number.isNaN(
    parsedDueDate.getTime()
  )
) {
  return res.status(400).json({
    success: false,
    message:
      "Invalid due date",
  });
}

/* ================= CLEAN TASKS ================= */

const cleanedTasks =
  tasks
    .filter(
      (task) =>
        task &&
        typeof task.title === "string" &&
        task.title.trim()
    )
    .map(
      (task, index) => ({
        title:
          task.title.trim(),

        description:
          typeof task.description === "string"
            ? task.description.trim()
            : "",

        order:
          index + 1,
      })
    );

if (cleanedTasks.length === 0) {
  return res.status(400).json({
    success: false,
    message:
      "At least one valid checklist task is required",
  });
}

/* ================= PRIORITY ================= */

const validPriorities = [
  "Low",
  "Medium",
  "High",
];

const taskPriority =
  validPriorities.includes(priority)
    ? priority
    : "Medium";

/* ================= CREATE ================= */

const task =
  await Task.create({
    title:
      title.trim(),

    description:
      typeof description === "string"
        ? description.trim()
        : "",

    batchId,

    tasks:
      cleanedTasks,

    priority:
      taskPriority,

    dueDate:
      parsedDueDate,

    status:
      "ACTIVE",

    createdBy:
      req.user._id,
  });

await task.populate(
  "batchId",
  "name code batchTiming startTime endTime"
);

const formattedTask =
  await formatTaskWithStats(task);

return res.status(201).json({
  success: true,
  message:
    "Task created successfully",
  task:
    formattedTask,
});


} catch (error) {
console.error(
"Create Task Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Server error while creating task",
});


}
};

/* =====================================================
GET ALL TASKS
===================================================== */

const getAllTasks = async (req, res) => {
try {
const tasks =
await Task.find()
.populate(
"createdBy",
"name email role"
)
.populate(
"batchId",
"name code batchTiming startTime endTime status"
)
.sort({
createdAt: -1,
});


const formattedTasks =
  await Promise.all(
    tasks.map(formatTaskWithStats)
  );

return res.status(200).json({
  success: true,
  count:
    formattedTasks.length,
  tasks:
    formattedTasks,
});


} catch (error) {
console.error(
"Get All Tasks Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to fetch tasks",
});


}
};

/* =====================================================
GET MY CREATED TASKS
===================================================== */

const getMyTasks = async (req, res) => {
try {
const tasks =
await Task.find({
createdBy:
req.user._id,
})
.populate(
"createdBy",
"name email role"
)
.populate(
"batchId",
"name code batchTiming startTime endTime status"
)
.sort({
createdAt: -1,
});


const formattedTasks =
  await Promise.all(
    tasks.map(formatTaskWithStats)
  );

return res.status(200).json({
  success: true,
  count:
    formattedTasks.length,
  tasks:
    formattedTasks,
});


} catch (error) {
console.error(
"Get My Tasks Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to fetch your tasks",
});


}
};

/* =====================================================
GET SINGLE TASK
===================================================== */

const getTaskById = async (req, res) => {
try {
if (
!isValidObjectId(
req.params.id
)
) {
return res.status(400).json({
success: false,
message:
"Invalid task ID",
});
}


const task =
  await Task.findById(
    req.params.id
  )
    .populate(
      "createdBy",
      "name email"
    )
    .populate(
      "batchId",
      "name code batchTiming startTime endTime"
    )
    .populate(
      "submissions.studentId",
      "name email batchId batchTiming"
    )
    .populate(
      "submissions.reviewedBy",
      "name email"
    );

if (!task) {
  return res.status(404).json({
    success: false,
    message:
      "Task not found",
  });
}
if (req.user.role === "STUDENT") {
  const studentBatchId = req.user.batchId?.toString();
  const taskBatchId = task.batchId?._id?.toString();

  if (!studentBatchId || !taskBatchId || studentBatchId !== taskBatchId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to access this task",
    });
  }
}

if (req.user.role === "STUDENT") {
  task.submissions = task.submissions.filter(
    (submission) =>
      submission.studentId?._id?.toString() ===
      req.user._id.toString()
  );
}

const formattedTask =

  await formatTaskWithStats(task);

return res.status(200).json({
  success: true,
  task:
    formattedTask,
});


} catch (error) {
console.error(
"Get Task Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to fetch task",
});


}
};

/* =====================================================
UPDATE TASK
===================================================== */

const updateTask = async (req, res) => {
try {
const {
title,
description,
batchId,
tasks,
priority,
dueDate,
status,
} = req.body;


if (
  !isValidObjectId(
    req.params.id
  )
) {
  return res.status(400).json({
    success: false,
    message:
      "Invalid task ID",
  });
}

const task =
  await Task.findById(
    req.params.id
  );

if (!task) {
  return res.status(404).json({
    success: false,
    message:
      "Task not found",
  });
}

/* Teacher ownership */

if (
  req.user.role === "TEACHER" &&
  task.createdBy.toString() !==
    req.user._id.toString()
) {
  return res.status(403).json({
    success: false,
    message:
      "You can only update your own tasks",
  });
}

/* ================= TITLE ================= */

if (title !== undefined) {
  if (
    typeof title !== "string" ||
    !title.trim()
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Title cannot be empty",
    });
  }

  task.title =
    title.trim();
}

/* ================= DESCRIPTION ================= */

if (description !== undefined) {
  if (typeof description !== "string") {
    return res.status(400).json({
      success: false,
      message: "Description must be a string",
    });
  }

  task.description = description.trim();
}

/* ================= BATCH ================= */

if (batchId !== undefined) {
  if (
    !isValidObjectId(batchId)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid batch ID",
    });
  }

  const batch =
    await Batch.findById(
      batchId
    );

  if (!batch) {
    return res.status(404).json({
      success: false,
      message:
        "Batch not found",
    });
  }

  task.batchId =
    batchId;
}

/* ================= PRIORITY ================= */

if (priority !== undefined) {
  const validPriorities = [
    "Low",
    "Medium",
    "High",
  ];

  if (
    !validPriorities.includes(
      priority
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid priority",
    });
  }

  task.priority =
    priority;
}

/* ================= STATUS ================= */

if (status !== undefined) {
  const validStatuses = [
    "ACTIVE",
    "COMPLETED",
    "DRAFT",
  ];

  if (
    !validStatuses.includes(
      status
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid task status",
    });
  }

  task.status =
    status;
}

/* ================= DUE DATE ================= */

if (dueDate !== undefined) {
  const parsedDueDate =
    new Date(dueDate);

  if (
    Number.isNaN(
      parsedDueDate.getTime()
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid due date",
    });
  }

  task.dueDate =
    parsedDueDate;
}

/* ================= CHECKLIST ================= */

if (tasks !== undefined) {
  if (
    !Array.isArray(tasks) ||
    tasks.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "At least one task is required",
    });
  }

  const cleanedTasks =
    tasks
      .filter(
        (item) =>
          item &&
          typeof item.title === "string" &&
          item.title.trim()
      )
      .map(
        (item, index) => ({
          _id:
            item._id || undefined,

          title:
            item.title.trim(),

          description:
            typeof item.description === "string"
              ? item.description.trim()
              : "",

          order:
            index + 1,
        })
      );

  if (
    cleanedTasks.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "At least one valid task is required",
    });
  }

  const validTaskIds =
    cleanedTasks
      .filter(
        (item) => item._id
      )
      .map(
        (item) =>
          item._id.toString()
      );

  task.submissions.forEach(
    (submission) => {
      submission.completedTasks =
        submission.completedTasks.filter(
          (completedTaskId) =>
            validTaskIds.includes(
              completedTaskId.toString()
            )
        );

      submission.completedCount =
        submission.completedTasks.length;

      submission.totalTasks =
        cleanedTasks.length;

      submission.score =
        calculateScore(
          submission.completedCount,
          submission.totalTasks
        );
    }
  );

  task.tasks =
    cleanedTasks;
}

await task.save();

await task.populate(
  "batchId",
  "name code batchTiming startTime endTime"
);

const formattedTask =
  await formatTaskWithStats(task);

return res.status(200).json({
  success: true,
  message:
    "Task updated successfully",
  task:
    formattedTask,
});


} catch (error) {
console.error(
"Update Task Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to update task",
});


}
};

/* =====================================================
DELETE TASK
===================================================== */

const deleteTask = async (req, res) => {
try {
if (
!isValidObjectId(
req.params.id
)
) {
return res.status(400).json({
success: false,
message:
"Invalid task ID",
});
}


const task =
  await Task.findById(
    req.params.id
  );

if (!task) {
  return res.status(404).json({
    success: false,
    message:
      "Task not found",
  });
}

if (
  req.user.role === "TEACHER" &&
  task.createdBy.toString() !==
    req.user._id.toString()
) {
  return res.status(403).json({
    success: false,
    message:
      "You can only delete your own tasks",
  });
}

await task.deleteOne();

return res.status(200).json({
  success: true,
  message:
    "Task deleted successfully",
});


} catch (error) {
console.error(
"Delete Task Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to delete task",
});


}
};

/* =====================================================
STUDENT - GET MY TASKS
===================================================== */

const getStudentTasks = async (req, res) => {
try {
const student =
await User.findOne({
_id: req.user._id,
role: "STUDENT",
isActive: true,
})
.select("batchId")
.populate(
"batchId",
"name code batchTiming"
)
.lean();


if (!student) {
  return res.status(404).json({
    success: false,
    message:
      "Student not found",
  });
}

if (!student.batchId) {
  return res.status(400).json({
    success: false,
    message:
      "No batch assigned to student",
  });
}

const batchObjectId =
  student.batchId._id ||
  student.batchId;

const tasks =
  await Task.find({
    batchId:
      batchObjectId,

    status: {
      $ne: "DRAFT",
    },
  })
    .sort({
      dueDate: 1,
      createdAt: -1,
    })
    .lean();

const formattedTasks =
  tasks.map((task) => {
    const submissions =
      Array.isArray(task.submissions)
        ? task.submissions
        : [];

    const mySubmission =
      submissions.find(
        (submission) =>
          submission.studentId
            ?.toString() ===
          req.user._id.toString()
      );

    return {
      _id:
        task._id,

      title:
        task.title,

      description:
        task.description || "",

      batch:
        student.batchId.batchTiming || "",

      batchId:
        batchObjectId,

      priority:
        task.priority,

      dueDate:
        task.dueDate,

      taskStatus:
        getTaskDisplayStatus(task),

      totalTasks:
        task.tasks?.length || 0,

      tasks:
        task.tasks || [],

      submission:
        mySubmission
          ? {
              completedTasks:
                mySubmission.completedTasks || [],

              completedCount:
                mySubmission.completedCount || 0,

              totalTasks:
                mySubmission.totalTasks ||
                task.tasks?.length ||
                0,

              score:
                mySubmission.score || 0,

              status:
                mySubmission.status,

              submittedAt:
                mySubmission.submittedAt,

              teacherRemarks:
                mySubmission.teacherRemarks || "",

              reviewedAt:
                mySubmission.reviewedAt,
            }
          : null,
    };
  });

return res.status(200).json({
  success: true,

  count:
    formattedTasks.length,

  batchTiming:
    student.batchId.batchTiming || "",

  batchId:
    batchObjectId,

  tasks:
    formattedTasks,
});


} catch (error) {
console.error(
"Get Student Tasks Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to fetch tasks",
});


}
};

/* =====================================================
STUDENT - SAVE TASK PROGRESS
===================================================== */

const saveTaskProgress = async (req, res) => {
try {
const { id } = req.params;


const {
  completedTasks,
  remarks,
} = req.body;

if (
  !isValidObjectId(id)
) {
  return res.status(400).json({
    success: false,
    message:
      "Invalid task ID",
  });
}

if (
  !Array.isArray(
    completedTasks
  )
) {
  return res.status(400).json({
    success: false,
    message:
      "Completed tasks must be an array",
  });
}

const student =
  await User.findOne({
    _id: req.user._id,
    role: "STUDENT",
    isActive: true,
  })
    .select("batchId")
    .lean();

if (!student) {
  return res.status(404).json({
    success: false,
    message:
      "Student not found",
  });
}

if (!student.batchId) {
  return res.status(400).json({
    success: false,
    message:
      "No batch assigned to student",
  });
}

const task =
  await Task.findOne({
    _id: id,
    batchId:
      student.batchId,
    status: "ACTIVE",
  });

if (!task) {
  return res.status(404).json({
    success: false,
    message:
      "Task not found",
  });
}

let submission =
  task.submissions.find(
    (item) =>
      item.studentId.toString() ===
      req.user._id.toString()
  );

if (
  submission &&
  submission.status === "APPROVED"
) {
  return res.status(400).json({
    success: false,
    message:
      "Approved task cannot be edited",
  });
}

if (
  submission &&
  submission.status === "PENDING"
) {
  return res.status(400).json({
    success: false,
    message:
      "Task is pending teacher review",
  });
}

const validTaskIds =
  task.tasks.map(
    (item) =>
      item._id.toString()
  );

const uniqueCompletedTasks =
  [
    ...new Set(
      completedTasks.map(
        (item) =>
          item.toString()
      )
    ),
  ];

const invalidTask =
  uniqueCompletedTasks.find(
    (taskId) =>
      !validTaskIds.includes(
        taskId
      )
  );

if (invalidTask) {
  return res.status(400).json({
    success: false,
    message:
      "Invalid task selected",
  });
}

const completedCount =
  uniqueCompletedTasks.length;

const totalTasks =
  task.tasks.length;

const score =
  calculateScore(
    completedCount,
    totalTasks
  );

if (!submission) {
  task.submissions.push({
    studentId:
      req.user._id,

    completedTasks:
      uniqueCompletedTasks,

    completedCount,

    totalTasks,

    score,

    remarks:
      typeof remarks === "string"
        ? remarks.trim()
        : "",

    status:
      "DRAFT",
  });
} else {
  submission.completedTasks =
    uniqueCompletedTasks;

  submission.completedCount =
    completedCount;

  submission.totalTasks =
    totalTasks;

  submission.score =
    score;

  submission.remarks =
    typeof remarks === "string"
      ? remarks.trim()
      : "";

  if (
    submission.status === "REJECTED"
  ) {
    submission.status =
      "DRAFT";

    submission.reviewedBy =
      null;

    submission.reviewedAt =
      null;

    submission.teacherRemarks =
      "";
  }
}

await task.save();

const updatedSubmission =
  task.submissions.find(
    (item) =>
      item.studentId.toString() ===
      req.user._id.toString()
  );

return res.status(200).json({
  success: true,

  message:
    "Task progress saved successfully",

  submission:
    updatedSubmission,
});


} catch (error) {
console.error(
"Save Task Progress Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to save task progress",
});


}
};

/* =====================================================
STUDENT - SUBMIT TASK
===================================================== */

const submitTask = async (req, res) => {
try {
const { id } = req.params;


if (
  !isValidObjectId(id)
) {
  return res.status(400).json({
    success: false,
    message:
      "Invalid task ID",
  });
}

const student =
  await User.findOne({
    _id: req.user._id,
    role: "STUDENT",
    isActive: true,
  })
    .select("batchId")
    .lean();

if (!student) {
  return res.status(404).json({
    success: false,
    message:
      "Student not found",
  });
}

if (!student.batchId) {
  return res.status(400).json({
    success: false,
    message:
      "No batch assigned to student",
  });
}

const task =
  await Task.findOne({
    _id: id,
    batchId:
      student.batchId,
    status: "ACTIVE",
  });

if (!task) {
  return res.status(404).json({
    success: false,
    message:
      "Task not found",
  });
}

const submission =
  task.submissions.find(
    (item) =>
      item.studentId.toString() ===
      req.user._id.toString()
  );

if (!submission) {
  return res.status(400).json({
    success: false,
    message:
      "Please save your task progress before submitting",
  });
}

if (
  submission.status === "APPROVED"
) {
  return res.status(400).json({
    success: false,
    message:
      "Task is already approved",
  });
}

if (
  submission.status === "PENDING"
) {
  return res.status(400).json({
    success: false,
    message:
      "Task is already pending review",
  });
}

submission.status =
  "PENDING";

submission.submittedAt =
  new Date();

submission.reviewedBy =
  null;

submission.reviewedAt =
  null;

await task.save();

return res.status(200).json({
  success: true,

  message:
    "Task submitted for teacher review",

  submission,
});


} catch (error) {
console.error(
"Submit Task Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to submit task",
});


}
};

/* =====================================================
TEACHER - GET PENDING REPORTS

Teacher sees submissions only from students
assigned to that teacher for task report review.
===================================================== */

const getPendingTaskReports = async (req, res) => {
try {
const students =
await User.find({
role: "STUDENT",
isActive: true,
taskReportTeacherIds:
req.user._id,
})
.select("_id")
.lean();


const studentIds =
  students.map(
    (student) =>
      student._id
  );

if (studentIds.length === 0) {
  return res.status(200).json({
    success: true,
    count: 0,
    reports: [],
  });
}

const tasks =
  await Task.find({
    submissions: {
      $elemMatch: {
        studentId: {
          $in: studentIds,
        },
        status: "PENDING",
      },
    },
  })
    .populate(
      "batchId",
      "name code batchTiming"
    )
    .populate(
      "submissions.studentId",
      "name email batchId batchTiming avatar"
    )
    .sort({
      createdAt: -1,
    })
    .lean();

const pendingReports = [];

tasks.forEach((task) => {
  task.submissions.forEach(
    (submission) => {
      const studentId =
        submission.studentId?._id ||
        submission.studentId;

      const isAssignedStudent =
        studentIds.some(
          (id) =>
            id.toString() ===
            studentId?.toString()
        );

      if (
        submission.status === "PENDING" &&
        isAssignedStudent
      ) {
        pendingReports.push({
          taskId:
            task._id,

          submissionId:
            submission._id,

          reportTitle:
            task.title,

          batch:
            getBatchDisplay(
              task.batchId
            ),

          batchId:
            task.batchId?._id ||
            task.batchId,

          totalTasks:
            task.tasks?.length || 0,

          completedTasks:
            submission.completedCount || 0,

          score:
            submission.score || 0,

          submittedAt:
            submission.submittedAt,

          student:
            submission.studentId,

          status:
            submission.status,
        });
      }
    }
  );
});

return res.status(200).json({
  success: true,
  count:
    pendingReports.length,
  reports:
    pendingReports,
});


} catch (error) {
console.error(
"Get Pending Task Reports Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to fetch pending reports",
});


}
};

/* =====================================================
TEACHER - REVIEW TASK REPORT
===================================================== */

const reviewTaskReport = async (req, res) => {
try {
const {
taskId,
submissionId,
} = req.params;


const {
  action,
  teacherRemarks,
} = req.body;

if (
  !isValidObjectId(taskId) ||
  !isValidObjectId(submissionId)
) {
  return res.status(400).json({
    success: false,
    message:
      "Invalid task or submission ID",
  });
}

if (
  ![
    "APPROVED",
    "REJECTED",
  ].includes(action)
) {
  return res.status(400).json({
    success: false,
    message:
      "Action must be APPROVED or REJECTED",
  });
}

const task =
  await Task.findById(taskId);

if (!task) {
  return res.status(404).json({
    success: false,
    message:
      "Task not found",
  });
}

const submission =
  task.submissions.id(
    submissionId
  );

if (!submission) {
  return res.status(404).json({
    success: false,
    message:
      "Student submission not found",
  });
}

const student =
  await User.findOne({
    _id:
      submission.studentId,
    role:
      "STUDENT",
    isActive:
      true,
  })
    .select(
      "taskReportTeacherIds"
    )
    .lean();

if (!student) {
  return res.status(404).json({
    success: false,
    message:
      "Student not found",
  });
}

const canReview =
  req.user.role === "ADMIN" ||
  student.taskReportTeacherIds?.some(
    (teacherId) =>
      teacherId.toString() ===
      req.user._id.toString()
  );

if (!canReview) {
  return res.status(403).json({
    success: false,
    message:
      "You are not assigned to review this student's task reports",
  });
}

if (
  submission.status !==
  "PENDING"
) {
  return res.status(400).json({
    success: false,
    message:
      "Only pending reports can be reviewed",
  });
}

submission.status =
  action;

submission.reviewedBy =
  req.user._id;

submission.reviewedAt =
  new Date();

submission.teacherRemarks =
  typeof teacherRemarks === "string"
    ? teacherRemarks.trim()
    : "";

await task.save();

return res.status(200).json({
  success: true,

  message:
    action === "APPROVED"
      ? "Task approved successfully"
      : "Task rejected successfully",

  submission,
});


} catch (error) {
console.error(
"Review Task Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to review task",
});


}
};

/* =====================================================
TEACHER - GET REVIEWED REPORTS
===================================================== */

const getReviewedTaskReports = async (req, res) => {
try {
const tasks =
await Task.find({
"submissions.reviewedBy":
req.user._id,
})
.populate(
"batchId",
"name code batchTiming"
)
.populate(
"submissions.studentId",
"name email batchId batchTiming"
)
.sort({
updatedAt: -1,
})
.lean();


const reports = [];

tasks.forEach((task) => {
  task.submissions.forEach(
    (submission) => {
      if (
        submission.reviewedBy &&
        submission.reviewedBy.toString() ===
          req.user._id.toString()
      ) {
        reports.push({
          taskId:
            task._id,

          submissionId:
            submission._id,

          reportTitle:
            task.title,

          batch:
            getBatchDisplay(
              task.batchId
            ),

          batchId:
            task.batchId?._id ||
            task.batchId,

          student:
            submission.studentId,

          completedCount:
            submission.completedCount,

          totalTasks:
            submission.totalTasks,

          score:
            submission.score,

          status:
            submission.status,

          submittedAt:
            submission.submittedAt,

          reviewedAt:
            submission.reviewedAt,

          teacherRemarks:
            submission.teacherRemarks,
        });
      }
    }
  );
});

return res.status(200).json({
  success: true,
  count:
    reports.length,
  reports,
});


} catch (error) {
console.error(
"Get Reviewed Task Reports Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to fetch reviewed reports",
});


}
};

/* =====================================================
STUDENT - GET MY TASK REPORT
===================================================== */

const getMyTaskReport = async (req, res) => {
try {
const student =
await User.findOne({
_id: req.user._id,
role: "STUDENT",
isActive: true,
})
.select("batchId")
.lean();


if (!student) {
  return res.status(404).json({
    success: false,
    message:
      "Student not found",
  });
}

if (!student.batchId) {
  return res.status(400).json({
    success: false,
    message:
      "No batch assigned to student",
  });
}

const tasks =
  await Task.find({
    batchId:
      student.batchId,

    status: {
      $ne: "DRAFT",
    },
  })
    .sort({
      createdAt: -1,
    })
    .lean();

let totalTasks = 0;
let completedTasks = 0;
let pendingTasks = 0;
let rejectedTasks = 0;
let notStartedTasks = 0;

const categories =
  tasks.map((task) => {
    const submissions =
      Array.isArray(
        task.submissions
      )
        ? task.submissions
        : [];

    const mySubmission =
      submissions.find(
        (submission) =>
          submission.studentId?.toString() ===
          req.user._id.toString()
      );

    let taskStatus =
      "NOT_STARTED";

    let rejectionReason =
      "";

    if (mySubmission) {
      if (
        mySubmission.status ===
        "APPROVED"
      ) {
        taskStatus =
          "COMPLETED";
      }

      if (
        mySubmission.status ===
        "PENDING"
      ) {
        taskStatus =
          "PENDING";
      }

      if (
        mySubmission.status ===
        "REJECTED"
      ) {
        taskStatus =
          "REJECTED";

        rejectionReason =
          mySubmission.teacherRemarks || "";
      }

      if (
        mySubmission.status ===
        "DRAFT"
      ) {
        taskStatus =
          "NOT_STARTED";
      }
    }

    totalTasks +=
      task.tasks?.length || 0;

    if (
      taskStatus === "COMPLETED"
    ) {
      completedTasks +=
        task.tasks?.length || 0;
    }

    if (
      taskStatus === "PENDING"
    ) {
      pendingTasks +=
        task.tasks?.length || 0;
    }

    if (
      taskStatus === "REJECTED"
    ) {
      rejectedTasks +=
        task.tasks?.length || 0;
    }

    if (
      taskStatus === "NOT_STARTED"
    ) {
      notStartedTasks +=
        task.tasks?.length || 0;
    }

    return {
      _id:
        task._id,

      name:
        task.title,

      description:
        task.description || "",

      tasks:
        (task.tasks || []).map(
          (item) => ({
            _id:
              item._id,

            title:
              item.title,

            description:
              item.description || "",

            status:
              taskStatus,

            rejectionReason,
          })
        ),
    };
  });

const score =
  totalTasks > 0
    ? Math.round(
        (completedTasks / totalTasks) *
          100
      )
    : 0;

return res.status(200).json({
  success: true,

  categories,

  stats: {
    totalTasks,
    completedTasks,
    pendingTasks,
    rejectedTasks,
    notStartedTasks,
    score,
  },
});


} catch (error) {
console.error(
"Get My Task Report Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to fetch task report",
});


}
};

/* =====================================================
STUDENT PERFORMANCE
ONLY APPROVED TASKS
===================================================== */

const getMyPerformance = async (req, res) => {
try {
const student =
await User.findOne({
_id: req.user._id,
role: "STUDENT",
isActive: true,
})
.select("batchId")
.lean();


if (!student) {
  return res.status(404).json({
    success: false,
    message:
      "Student not found",
  });
}

if (!student.batchId) {
  return res.status(400).json({
    success: false,
    message:
      "No batch assigned to student",
  });
}

const tasks =
  await Task.find({
    batchId:
      student.batchId,

    submissions: {
      $elemMatch: {
        studentId:
          req.user._id,

        status:
          "APPROVED",
      },
    },
  })
    .sort({
      updatedAt: -1,
    })
    .lean();

const performanceItems = [];

let totalScore = 0;
let totalCompleted = 0;
let totalTaskCount = 0;

tasks.forEach((task) => {
  const submission =
    task.submissions.find(
      (item) =>
        item.studentId?.toString() ===
          req.user._id.toString() &&
        item.status === "APPROVED"
    );

  if (submission) {
    performanceItems.push({
      id:
        task._id,

      title:
        task.title,

      score:
        submission.score,

      completedTasks:
        submission.completedCount,

      totalTasks:
        submission.totalTasks,

      status:
        submission.score >= 90
          ? "Excellent"
          : submission.score >= 70
          ? "Good"
          : submission.score >= 50
          ? "Average"
          : "Needs Improvement",

      approvedAt:
        submission.reviewedAt,
    });

    totalScore +=
      submission.score || 0;

    totalCompleted +=
      submission.completedCount || 0;

    totalTaskCount +=
      submission.totalTasks || 0;
  }
});

const overallScore =
  performanceItems.length > 0
    ? Math.round(
        totalScore /
          performanceItems.length
      )
    : 0;

const completionPercentage =
  totalTaskCount > 0
    ? Math.round(
        (totalCompleted /
          totalTaskCount) *
          100
      )
    : 0;

return res.status(200).json({
  success: true,

  performance: {
    overallScore,

    completedTasks:
      totalCompleted,

    totalTasks:
      totalTaskCount,

    taskProgress:
      completionPercentage,

    approvedReports:
      performanceItems.length,
  },

  recentPerformance:
    performanceItems.slice(0, 10),
});


} catch (error) {
console.error(
"Get My Performance Error:",
error
);


return res.status(500).json({
  success: false,
  message:
    "Unable to fetch performance data",
});

}
};

/* =====================================================
EXPORTS
===================================================== */

module.exports = {
createTask,
getAllTasks,
getMyTasks,
getTaskById,
updateTask,
deleteTask,
getStudentTasks,
saveTaskProgress,
submitTask,
getPendingTaskReports,
reviewTaskReport,
getReviewedTaskReports,
getMyTaskReport,
getMyPerformance,
};
