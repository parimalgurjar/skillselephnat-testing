const Notification = require("../models/Notification");
const User = require("../models/User");
const TaskReportSettings = require("../models/TaskReportSettings");

/*
  ObjectId aur populated document dono handle karega.
*/
const getId = (value) => value?._id || value;

/*
  Matching active users ko notification save karta hai.
  Sender ko uske khud ke action ki notification nahi milegi.
*/
const deliver = async (
  filter,
  actor,
  eventKey,
  title,
  message,
  link
) => {
  const users = await User.find({
    $and: [
      filter,
      {
        status: "ACTIVE",
        isActive: true,
      },
    ],
  })
    .select("_id role")
    .lean();

  const recipients = users.filter(
    (user) => String(user._id) !== String(getId(actor))
  );

  // Large recipient lists ko batches mein process karo.
  for (let start = 0; start < recipients.length; start += 200) {
    const operations = recipients
      .slice(start, start + 200)
      .map((user) => ({
        updateOne: {
          filter: {
            recipient: user._id,
            eventKey,
          },

          update: {
            $setOnInsert: {
              recipient: user._id,
              eventKey,

              title: String(title).slice(0, 180),

              message: String(message || "").slice(0, 500),

              link:
                typeof link === "function"
                  ? link(user)
                  : link,

              readAt: null,
            },
          },

          upsert: true,
        },
      }));

    if (operations.length > 0) {
      await Notification.bulkWrite(operations, {
        ordered: false,
      });
    }
  }
};

/*
  Controllers successful save ke baad notify() call karenge.
*/
const notify = async (
  event,
  {
    actor,
    entity,
    studentId,
    eventId,
  } = {}
) => {
  try {
    const eventKey =
      `${event}:${getId(entity)}:${eventId || "created"}`;

    switch (event) {
      /* NEW NORMAL TASK: ONLY ASSIGNED BATCH STUDENTS */

      case "TASK_CREATED": {
        if (
          entity.status !== "ACTIVE" ||
          !getId(entity.batchId)
        ) {
          return;
        }

        return await deliver(
          {
            role: "STUDENT",
            batchId: getId(entity.batchId),
          },
          actor,
          eventKey,
          "New task assigned",
          entity.title,
          "/student/work"
        );
      }

      /* NEW TASK REPORT ACTIVITY */

      case "REPORT_TASK_CREATED": {
        return await deliver(
          {
            role: "STUDENT",
          },
          actor,
          eventKey,
          "New Task Report activity",
          entity.title,
          "/student/task-report"
        );
      }

      /* PUBLISHED ANNOUNCEMENT */

      case "ANNOUNCEMENT": {
        if (entity.status !== "PUBLISHED") {
          return;
        }

        const audiences = [];

        if (
          ["STUDENTS", "EVERYONE"].includes(entity.audience)
        ) {
          const studentFilter = {
            role: "STUDENT",
          };

          if (getId(entity.batchId)) {
            studentFilter.batchId = getId(entity.batchId);
          }

          audiences.push(studentFilter);
        }

        if (
          ["TEACHERS", "EVERYONE"].includes(entity.audience)
        ) {
          audiences.push({
            role: "TEACHER",
          });
        }

        if (audiences.length === 0) {
          return;
        }

        return await deliver(
          {
            $or: audiences,
          },
          actor,
          eventKey,
          "New announcement",
          entity.title,
          (user) =>
            `/${user.role.toLowerCase()}/announcements`
        );
      }

      /* NEW DOUBT: ASSIGNED TEACHER */

      case "DOUBT_CREATED": {
        const teacherId = getId(entity.assignedTeacher);

        if (!teacherId) {
          return;
        }

        return await deliver(
          {
            _id: teacherId,
            role: "TEACHER",
          },
          actor,
          eventKey,
          "New student doubt",
          entity.title,
          `/teacher/doubts/${entity._id}`
        );
      }

      /* CHAT / REPLY: OTHER PARTICIPANT */

      case "DOUBT_MESSAGE": {
        const participantIds = [
          getId(entity.studentId),
          getId(entity.assignedTeacher),
        ].filter(Boolean);

        return await deliver(
          {
            _id: {
              $in: participantIds,
            },
          },
          actor,
          eventKey,
          "New doubt message",
          entity.title,
          (user) =>
            `/${user.role.toLowerCase()}/doubts/${entity._id}`
        );
      }

      /* DOUBT RESOLVED: STUDENT */

      case "DOUBT_RESOLVED": {
        return await deliver(
          {
            _id: getId(entity.studentId),
            role: "STUDENT",
          },
          actor,
          eventKey,
          "Your doubt was resolved",
          entity.title,
          `/student/doubts/${entity._id}`
        );
      }

      /* NORMAL TASK SUBMITTED: STUDENT'S REVIEWERS */

      case "TASK_SUBMITTED": {
        const student = await User.findById(studentId)
          .select("name taskReportTeacherIds")
          .lean();

        if (!student) {
          return;
        }

        return await deliver(
          {
            role: "TEACHER",
            _id: {
              $in: student.taskReportTeacherIds || [],
            },
          },
          actor,
          eventKey,
          "Task awaiting review",
          `${student.name}: ${entity.title}`,
          `/teacher/tasks/${entity._id}/submissions`
        );
      }

      /* NORMAL TASK REVIEWED: STUDENT */

      case "TASK_REVIEWED": {
        return await deliver(
          {
            _id: getId(studentId),
            role: "STUDENT",
          },
          actor,
          eventKey,
          "Your task review is ready",
          entity.title,
          "/student/work"
        );
      }

      /* TASK REPORT SUBMITTED: GLOBAL REPORT REVIEWERS */

      case "REPORT_SUBMITTED": {
        const settings = await TaskReportSettings.findOne()
          .select("assignedTeachers")
          .lean();

        const student = await User.findById(studentId)
          .select("name")
          .lean();

        return await deliver(
          {
            role: "TEACHER",
            _id: {
              $in: settings?.assignedTeachers || [],
            },
          },
          actor,
          eventKey,
          "Task Report awaiting review",
          `${student?.name || "Student"}: ${entity.title}`,
          "/teacher/task-report"
        );
      }

      /* TASK REPORT REVIEWED: STUDENT */

      case "REPORT_REVIEWED": {
        return await deliver(
          {
            _id: getId(entity.studentId),
            role: "STUDENT",
          },
          actor,
          eventKey,
          entity.status === "COMPLETED"
            ? "Task Report approved"
            : "Task Report needs changes",
          entity.rejectionReason ||
            "Your submitted activity has been reviewed.",
          "/student/task-report"
        );
      }

      /* NEW SIGNUP: ADMINS */

      case "SIGNUP": {
        return await deliver(
          {
            role: "ADMIN",
          },
          actor,
          eventKey,
          "New signup awaiting approval",
          `${entity.name} (${entity.role})`,
          "/admin"
        );
      }

      default:
        throw new Error(
          `Unknown notification event: ${event}`
        );
    }
  } catch (error) {
    /*
      Notification fail hone par already-saved task/message
      ko failed response nahi dena hai.
    */
    console.error(
      "Notification delivery failed:",
      event,
      String(getId(entity)),
      error.message
    );
  }
};

module.exports = {
  notify,
};