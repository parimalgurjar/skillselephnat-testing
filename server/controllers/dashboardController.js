const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Task = require("../models/Task");
const Batch = require("../models/Batch");

/* =====================================================
   STUDENT DASHBOARD
===================================================== */

const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    /* ===============================================
       GET LOGGED-IN STUDENT
    =============================================== */

    const student = await User.findOne({
      _id: studentId,
      role: "STUDENT",
    })
      .select(
        "name email batchId batchTiming teacherId courseId phone avatar joiningDate status isActive createdAt"
      )
      .populate({
        path: "courseId",
        select: "title name",
      })
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    /* ===============================================
       ATTENDANCE
    =============================================== */

    const attendanceRecords = await Attendance.find({
      studentId,
    })
      .select("status")
      .lean();

    const totalClasses = attendanceRecords.length;

    const presentClasses = attendanceRecords.filter(
      (record) => record.status === "PRESENT"
    ).length;

    const absentClasses = attendanceRecords.filter(
      (record) => record.status === "ABSENT"
    ).length;

    const attendancePercentage =
      totalClasses > 0
        ? Math.round(
            (presentClasses / totalClasses) * 100
          )
        : 0;

    /* ===============================================
       TASKS
    =============================================== */

    let tasks = [];

    if (student.batchTiming) {
      tasks = await Task.find({
        batch: student.batchTiming,

        status: {
          $ne: "DRAFT",
        },
      })
        .sort({
          createdAt: -1,
        })
        .lean();
    }

    /* ===============================================
       STUDENT-SPECIFIC TASK STATUS
    =============================================== */

    const formattedTasks = tasks.map((task) => {
      const submission = task.submissions?.find(
        (item) =>
          item.studentId?.toString() ===
          studentId.toString()
      );

      const isSubmitted = Boolean(submission);

      return {
        ...task,

        studentStatus: isSubmitted
          ? submission.status
          : "PENDING",

        isSubmitted,

        submittedAt: submission?.submittedAt || null,

        submissionUrl:
          submission?.submissionUrl || "",

        remarks:
          submission?.remarks || "",
      };
    });

    /* ===============================================
       TASK COUNTS
    =============================================== */

    const totalTasks = formattedTasks.length;

    const submittedTasks = formattedTasks.filter(
      (task) => task.isSubmitted
    );

    const pendingTasks = formattedTasks.filter(
      (task) => !task.isSubmitted
    );

    /* ===============================================
       RECENT TASKS
    =============================================== */

    const recentTasks = formattedTasks
      .slice(0, 5)
      .map((task) => ({
        _id: task._id,

        title:
          task.title ||
          "Untitled Task",

        description:
          task.description || "",

        dueDate:
          task.dueDate || null,

        priority:
          task.priority || "Medium",

        status:
          task.studentStatus,

        isSubmitted:
          task.isSubmitted,

        submittedAt:
          task.submittedAt,

        createdAt:
          task.createdAt || null,
      }));

    /* ===============================================
       COURSE PROGRESS
    =============================================== */

    const courseProgress =
      totalTasks > 0
        ? Math.round(
            (submittedTasks.length / totalTasks) *
              100
          )
        : 0;

    /* ===============================================
       RESPONSE
    =============================================== */

    return res.status(200).json({
      success: true,

      dashboard: {
        student: {
          _id: student._id,

          name: student.name,

          email: student.email,

          batchId:
            student.batchId || null,

          batchTiming:
            student.batchTiming || "",

          teacherId:
            student.teacherId || null,

          course:
            student.courseId
              ? {
                  _id: student.courseId._id,

                  name:
                    student.courseId.title ||
                    student.courseId.name ||
                    "",
                }
              : null,
        },

        attendance: {
          totalClasses,

          presentClasses,

          absentClasses,

          percentage:
            attendancePercentage,

          requiredAttendance: 75,
        },

        tasks: {
          total: totalTasks,

          completed:
            submittedTasks.length,

          pending:
            pendingTasks.length,

          recent:
            recentTasks,
        },

        courseProgress,

        announcements: [],
      },
    });
  } catch (error) {
    console.error(
      "Student Dashboard Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load student dashboard",
    });
  }
};


/* =====================================================
   GET LOGGED-IN STUDENT PROFILE
   STUDENT ONLY
===================================================== */

const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.user._id;

    /* ===============================================
       GET STUDENT
    =============================================== */

    const student = await User.findOne({
      _id: studentId,
      role: "STUDENT",
    })
      .select(
        "name email phone avatar batchId batchTiming courseId teacherId joiningDate status isActive createdAt"
      )
      .populate({
        path: "batchId",
        select: "name code batchTiming startTime endTime classDays",
      })
      .populate({
        path: "courseId",
        select: "title name",
      })
      .populate({
        path: "teacherId",
        select: "name email phone",
      })
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    /* ===============================================
       ATTENDANCE STATS
    =============================================== */

    const attendanceRecords = await Attendance.find({
      studentId,
    })
      .select("status")
      .lean();

    const totalClasses = attendanceRecords.length;

    const presentClasses = attendanceRecords.filter(
      (record) => record.status === "PRESENT"
    ).length;

    const absentClasses = attendanceRecords.filter(
      (record) => record.status === "ABSENT"
    ).length;

    const attendancePercentage =
      totalClasses > 0
        ? Math.round(
            (presentClasses / totalClasses) * 100
          )
        : 0;

    /* ===============================================
       PROFILE RESPONSE
    =============================================== */

    return res.status(200).json({
      success: true,

      profile: {
        _id: student._id,

        name: student.name,

        email: student.email,

        phone: student.phone || "",

        avatar: student.avatar || "",

        studentId: student._id,

        batchId:
          student.batchId || null,

        batchTiming:
          student.batchTiming || "",

        joiningDate:
          student.joiningDate ||
          student.createdAt,

        accountStatus:
          student.status,

        isActive:
          student.isActive,

        course: student.courseId
          ? {
              _id: student.courseId._id,

              name:
                student.courseId.title ||
                student.courseId.name ||
                "",
            }
          : null,

        teacher: student.teacherId
          ? {
              _id: student.teacherId._id,

              name:
                student.teacherId.name,

              email:
                student.teacherId.email,

              phone:
                student.teacherId.phone || "",
            }
          : null,

        attendance: {
          totalClasses,

          presentClasses,

          absentClasses,

          percentage:
            attendancePercentage,

          requiredAttendance: 75,
        },
      },
    });
  } catch (error) {
    console.error(
      "Get Student Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load student profile",
    });
  }
};

/* =====================================================
   ADMIN REPORTS & ANALYTICS
===================================================== */

const getAdminReports = async (req, res) => {
  try {
    /* ===============================================
       GET ACTIVE STUDENTS
    =============================================== */

    const students = await User.find({
      role: "STUDENT",
      status: "ACTIVE",
    })
      .select("_id name batchTiming")
      .lean();

    /* ===============================================
       GET ACTIVE BATCHES
    =============================================== */

    const batches = await Batch.find({})
      .select(
        "name code batchTiming startTime endTime status"
      )
      .sort({
        createdAt: 1,
      })
      .lean();

    /* ===============================================
       GET ATTENDANCE
    =============================================== */

    const attendanceRecords = await Attendance.find({})
      .select(
        "studentId batchTiming status date"
      )
      .lean();

    /* ===============================================
       GET TASKS
    =============================================== */

    const tasks = await Task.find({
      status: {
        $ne: "DRAFT",
      },
    })
      .select(
        "batch submissions createdAt"
      )
      .lean();

    /* ===============================================
       TOTAL STUDENTS
    =============================================== */

    const totalStudents = students.length;

    /* ===============================================
       TOTAL TEACHERS
    =============================================== */

    const totalTeachers =
      await User.countDocuments({
        role: "TEACHER",
        status: "ACTIVE",
      });

    /* ===============================================
       OVERALL ATTENDANCE
    =============================================== */

    const totalAttendanceRecords =
      attendanceRecords.length;

    const presentRecords =
      attendanceRecords.filter(
        (record) =>
          record.status === "PRESENT"
      ).length;

    const averageAttendance =
      totalAttendanceRecords > 0
        ? Math.round(
            (presentRecords /
              totalAttendanceRecords) *
              100
          )
        : 0;

    /* ===============================================
       TASK COMPLETION

       Only APPROVED submissions count
       as completed.
    =============================================== */

    let totalTaskOpportunities = 0;

    let approvedSubmissions = 0;

    tasks.forEach((task) => {
      const batchStudents =
        students.filter(
          (student) =>
            student.batchTiming ===
            task.batch
        );

      totalTaskOpportunities +=
        batchStudents.length;

      approvedSubmissions +=
        task.submissions?.filter(
          (submission) =>
            submission.status ===
            "APPROVED"
        ).length || 0;
    });

    const taskCompletion =
      totalTaskOpportunities > 0
        ? Math.round(
            (approvedSubmissions /
              totalTaskOpportunities) *
              100
          )
        : 0;

    /* ===============================================
       OVERALL PERFORMANCE

       Average of attendance +
       approved task completion
    =============================================== */

    const overallPerformance =
      Math.round(
        (averageAttendance +
          taskCompletion) /
          2
      );

    /* ===============================================
       BATCH PERFORMANCE
    =============================================== */

    const batchPerformance =
      batches.map((batch) => {
        const batchStudents =
          students.filter(
            (student) =>
              student.batchTiming ===
              batch.batchTiming
          );

        const studentIds =
          batchStudents.map(
            (student) =>
              student._id.toString()
          );

        const batchAttendance =
          attendanceRecords.filter(
            (record) =>
              record.batchTiming ===
              batch.batchTiming ||
              studentIds.includes(
                record.studentId?.toString()
              )
          );

        const batchPresent =
          batchAttendance.filter(
            (record) =>
              record.status ===
              "PRESENT"
          ).length;

        const attendancePercentage =
          batchAttendance.length > 0
            ? Math.round(
                (batchPresent /
                  batchAttendance.length) *
                  100
              )
            : 0;

        const batchTasks =
          tasks.filter(
            (task) =>
              task.batch ===
              batch.batchTiming
          );

        const totalOpportunities =
          batchTasks.length *
          batchStudents.length;

        let batchApproved = 0;

        batchTasks.forEach((task) => {
          batchApproved +=
            task.submissions?.filter(
              (submission) =>
                submission.status ===
                "APPROVED"
            ).length || 0;
        });

        const completion =
          totalOpportunities > 0
            ? Math.round(
                (batchApproved /
                  totalOpportunities) *
                  100
              )
            : 0;

        const performance =
          Math.round(
            (attendancePercentage +
              completion) /
              2
          );

        return {
          _id: batch._id,

          batch:
            batch.name ||
            batch.batchTiming,

          batchTiming:
            batch.batchTiming,

          students:
            batchStudents.length,

          attendance:
            attendancePercentage,

          completion,

          performance,
        };
      });

    /* ===============================================
       MONTHLY PERFORMANCE
       LAST 6 MONTHS
    =============================================== */

    const monthlyData = [];

    const currentDate =
      new Date();

    for (
      let i = 5;
      i >= 0;
      i--
    ) {
      const monthDate =
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );

      const nextMonth =
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i + 1,
          1
        );

      const monthAttendance =
        attendanceRecords.filter(
          (record) => {
            const recordDate =
              new Date(record.date);

            return (
              recordDate >=
                monthDate &&
              recordDate <
                nextMonth
            );
          }
        );

      const monthPresent =
        monthAttendance.filter(
          (record) =>
            record.status ===
            "PRESENT"
        ).length;

      const monthlyAttendance =
        monthAttendance.length > 0
          ? Math.round(
              (monthPresent /
                monthAttendance.length) *
                100
            )
          : 0;

      let monthTaskOpportunities = 0;

      let monthApprovedTasks = 0;

      tasks.forEach((task) => {
        const submissions =
          task.submissions || [];

        const approvedInMonth =
          submissions.filter(
            (submission) => {
              if (
                submission.status !==
                  "APPROVED" ||
                !submission.reviewedAt
              ) {
                return false;
              }

              const reviewDate =
                new Date(
                  submission.reviewedAt
                );

              return (
                reviewDate >=
                  monthDate &&
                reviewDate <
                  nextMonth
              );
            }
          ).length;

        const studentsInBatch =
          students.filter(
            (student) =>
              student.batchTiming ===
              task.batch
          ).length;

        if (
          new Date(
            task.createdAt
          ) < nextMonth
        ) {
          monthTaskOpportunities +=
            studentsInBatch;
        }

        monthApprovedTasks +=
          approvedInMonth;
      });

      const monthlyTaskCompletion =
        monthTaskOpportunities > 0
          ? Math.round(
              (monthApprovedTasks /
                monthTaskOpportunities) *
                100
            )
          : 0;

      const monthlyPerformance =
        monthAttendance.length === 0 &&
        monthTaskOpportunities === 0
          ? 0
          : Math.round(
              (monthlyAttendance +
                monthlyTaskCompletion) /
                2
            );

      monthlyData.push({
        month:
          monthDate.toLocaleString(
            "en-IN",
            {
              month: "short",
            }
          ),

        value:
          monthlyPerformance,

        attendance:
          monthlyAttendance,

        completion:
          monthlyTaskCompletion,
      });
    }

    /* ===============================================
       QUICK INSIGHTS
    =============================================== */

    const batchesWithStudents =
      batchPerformance.filter(
        (batch) =>
          batch.students > 0
      );

    const bestBatch =
      batchesWithStudents.length > 0
        ? [...batchesWithStudents].sort(
            (a, b) =>
              b.performance -
              a.performance
          )[0]
        : null;

    const lowestAttendanceBatch =
      batchesWithStudents.length > 0
        ? [...batchesWithStudents].sort(
            (a, b) =>
              a.attendance -
              b.attendance
          )[0]
        : null;

    const pendingTaskStudents =
      students.filter(
        (student) => {
          const studentTasks =
            tasks.filter(
              (task) =>
                task.batch ===
                student.batchTiming
            );

          if (
            studentTasks.length === 0
          ) {
            return false;
          }

          return studentTasks.some(
            (task) => {
              const submission =
                task.submissions?.find(
                  (item) =>
                    item.studentId?.toString() ===
                    student._id.toString()
                );

              return (
                !submission ||
                submission.status !==
                  "APPROVED"
              );
            }
          );
        }
      ).length;

    /* ===============================================
       RESPONSE
    =============================================== */

    return res.status(200).json({
      success: true,

      stats: {
        totalStudents,
        totalTeachers,
        averageAttendance,
        taskCompletion,
        overallPerformance,
      },

      monthlyData,

      batchPerformance,

      insights: {
        bestBatch,

        pendingTaskStudents,

        lowestAttendanceBatch,
      },
    });
  } catch (error) {
    console.error(
      "Get Admin Reports Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load reports and analytics",
    });
  }
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
  getStudentDashboard,
  getStudentProfile,
  getAdminReports,
};