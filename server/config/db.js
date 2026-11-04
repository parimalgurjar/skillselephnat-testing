const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI,
      {
        maxPoolSize: 30,
        minPoolSize: 2,

        serverSelectionTimeoutMS: 10000,
        waitQueueTimeoutMS: 10000,

        maxIdleTimeMS: 30000,
      }
    );

    console.log(
      `MongoDB Connected: ${conn.connection.host}`
    );

    console.log(
      "MongoDB Connection Pool: 30"
    );

  } catch (error) {
    console.error(
      "MongoDB Connection Error:",
      error.message
    );

    process.exit(1);
  }
};

module.exports = connectDB;