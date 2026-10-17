const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
dotenv.config();
const helmet = require("helmet");
const connectDB = require("./config/db");
const feeRoutes = require("./routes/feeRoutes");
const multer=require("multer")
/* ================= APP ================= */

const app = express();
app.use(helmet());
/* ================= RATE LIMITER ================= */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

/* ================= ROUTES IMPORTS ================= */

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");

const courseRoutes = require("./routes/courseRoutes");

const doubtRoutes = require("./routes/doubtRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const batchRoutes = require("./routes/batchRoutes");

const taskRoutes = require("./routes/taskRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const taskReportRoutes = require("./routes/taskReportRoutes");
const courseModuleRoutes = require("./routes/courseModuleRoutes");
const specializationRoutes = require("./routes/specializationRoutes");
const PORT = process.env.PORT || 5001;

/* ================= CORS ================= */

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (e.g. Mobile apps / Postman / Server-to-Server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* ================= MIDDLEWARE ================= */

app.use(
  express.json({
    limit: "1mb",
  })
);


/* ================= RATE LIMIT APPLICATION ================= */

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/admin-setup", authLimiter);

/* ================= ROUTES ================= */
app.use(
  "/api/notifications",
  require("./routes/notificationRoutes")
);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doubts", doubtRoutes);
app.use("/api/fees", feeRoutes);

/* NORMAL TEACHER ASSIGNMENT SYSTEM */
app.use("/api/tasks", taskRoutes);

/* 4 MONTH TASK REPORT SYSTEM */
app.use("/api/task-report", taskReportRoutes);

app.use("/api/announcements", announcementRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/modules", courseModuleRoutes);
app.use("/api/specializations", specializationRoutes);

/* ================= TEST ROUTE ================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Skillselephant Backend API is running",
  });
});
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    let statusCode = 400;
    let message = "Unable to upload the selected files.";

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        statusCode = 413;
        message =
          "A selected file exceeds the allowed size limit.";
        break;

      case "LIMIT_FILE_COUNT":
        message =
          "Too many files selected. Please reduce the number of files.";
        break;

      case "LIMIT_UNEXPECTED_FILE":
        message =
          "Too many files or an unexpected upload field was received.";
        break;

      case "LIMIT_FIELD_VALUE":
        message = "An uploaded form field is too large.";
        break;

      default:
        message = "Invalid upload request. Please check your files.";
    }

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "The request exceeds the allowed size limit.",
    });
  }

  const suppliedStatus = error.statusCode || error.status;

  const statusCode =
    Number.isInteger(suppliedStatus) &&
    suppliedStatus >= 400 &&
    suppliedStatus < 500
      ? suppliedStatus
      : 500;

  if (statusCode === 500) {
    console.error("Unhandled Server Error:", error);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Something went wrong. Please try again."
        : error.message || "Invalid request.",
  });
});
/* ================= SERVER ================= */

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();