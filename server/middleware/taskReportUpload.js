
const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

 if (!allowedTypes.includes(file.mimetype)) {
  const error = new Error(
    "Only JPG, PNG and WEBP images are allowed"
  );

  error.statusCode = 400;
  return cb(error);
}

  cb(null, true);
};

const taskReportUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

module.exports = taskReportUpload;
