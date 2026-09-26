const mongoose = require("mongoose");

const taskReportSettingsSchema =
  new mongoose.Schema(
    {
      /* =====================================================
         ASSIGNED TEACHERS

         Only these teachers can view and review
         Student Task Reports.
      ===================================================== */

      assignedTeachers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "TaskReportSettings",
  taskReportSettingsSchema
);