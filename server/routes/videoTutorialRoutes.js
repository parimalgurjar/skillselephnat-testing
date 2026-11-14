
const express = require("express");
const router = express.Router();

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const {
  getAllVideos,
  addVideo,
  updateVideo,
  deleteVideo,
  getPublishedVideos,
} = require("../controllers/videoTutorialController");

// Student and Teacher: Published videos
router.get(
  "/published",
  protect,
  authorize("STUDENT", "TEACHER"),
  getPublishedVideos
);

// Admin: Manage videos
router.get(
  "/",
  protect,
  authorize("ADMIN"),
  getAllVideos
);

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  addVideo
);

router.patch(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateVideo
);

router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  deleteVideo
);

module.exports = router;
