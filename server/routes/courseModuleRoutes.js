const express = require("express");

const {
  createModule,
  getModulesByCourse,
  getActiveModulesByCourse,
  getModuleById,
  updateModule,
  deactivateModule,
  activateModule,
} = require("../controllers/courseModuleController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   CREATE COURSE MODULE
   ADMIN ONLY
===================================================== */

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createModule
);

/* =====================================================
   GET ACTIVE MODULES
   STUDENT PORTAL
===================================================== */

router.get(
  "/course/:courseId/active",
  protect,
  getActiveModulesByCourse
);

/* =====================================================
   GET ALL MODULES OF COURSE
===================================================== */

router.get(
  "/course/:courseId",
  protect,
  getModulesByCourse
);

/* =====================================================
   GET SINGLE MODULE
===================================================== */

router.get(
  "/:id",
  protect,
  getModuleById
);

/* =====================================================
   UPDATE MODULE
   ADMIN ONLY
===================================================== */

router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateModule
);

/* =====================================================
   DEACTIVATE MODULE
   ADMIN ONLY
===================================================== */

router.patch(
  "/:id/deactivate",
  protect,
  authorize("ADMIN"),
  deactivateModule
);
router.patch(
  "/:id/activate",
  protect,
  authorize("ADMIN"),
  activateModule
);
module.exports = router;