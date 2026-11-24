
const express = require("express");
const router = express.Router();

const {
  getAdminResources,
  getPublishedResources,
  createResource,
  updateResource,
  updateResourceStatus,
  deleteResource,
} = require("../controllers/resourceController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Admin: View all resources
router.get("/admin", protect, authorize("ADMIN"), getAdminResources);

// Student and Teacher: View published resources
router.get(
  "/published",
  protect,
  authorize("STUDENT", "TEACHER"),
  getPublishedResources
);

// Admin: Create resource
router.post("/", protect, authorize("ADMIN"), createResource);

// Admin: Update resource
router.put("/:id", protect, authorize("ADMIN"), updateResource);

// Admin: Publish / move to draft
router.patch(
  "/:id/status",
  protect,
  authorize("ADMIN"),
  updateResourceStatus
);

// Admin: Delete resource
router.delete("/:id", protect, authorize("ADMIN"), deleteResource);

module.exports = router;
