
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const StudentCounter = require("../models/StudentCounter");
const generateStudentId = require("../utils/generateStudentId");

const run = async () => {
  try {
    await connectDB();

    const duplicates = await User.aggregate([
      {
        $match: {
          role: "STUDENT",
          studentId: { $type: "string", $ne: "" },
        },
      },
      {
        $group: {
          _id: "$studentId",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    if (duplicates.length) {
      throw new Error(
        `Duplicate existing IDs found: ${JSON.stringify(duplicates)}`
      );
    }

    const existing = await User.find({
      role: "STUDENT",
      studentId: /^SE-(\d+)$/,
    })
      .select("studentId")
      .lean();

    const maxExisting = existing.reduce((max, student) => {
      const value = Number(student.studentId.slice(3));
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);

    await StudentCounter.updateOne(
      { _id: "student" },
      { $max: { sequence: maxExisting } },
      { upsert: true }
    );

    const missingStudents = await User.find({
      role: "STUDENT",
      $or: [
        { studentId: { $exists: false } },
        { studentId: null },
        { studentId: "" },
      ],
    })
      .select("_id name email createdAt")
      .sort({ createdAt: 1, _id: 1 });

    let assigned = 0;

    for (const student of missingStudents) {
      const studentId = await generateStudentId();

      await User.updateOne(
        {
          _id: student._id,
          role: "STUDENT",
          $or: [
            { studentId: { $exists: false } },
            { studentId: null },
            { studentId: "" },
          ],
        },
        {
          $set: { studentId },
        }
      );

      assigned++;

      console.log(
        `Assigned ${studentId} to ${student.name} (${student.email})`
      );
    }

    console.log(
      `Backfill complete. Existing IDs: ${existing.length}; newly assigned: ${assigned}.`
    );
  } catch (error) {
    console.error("Student ID backfill failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
