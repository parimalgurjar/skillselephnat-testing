
const StudentCounter = require("../models/StudentCounter");

const generateStudentId = async () => {
  const counter = await StudentCounter.findOneAndUpdate(
    { _id: "student" },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return `SE-${String(counter.sequence).padStart(4, "0")}`;
};

module.exports = generateStudentId;
