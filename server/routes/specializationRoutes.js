const express = require("express");

const {
  createSpecialization,
  getAllSpecializations,
  getActiveSpecializations,
  getSpecializationById,
  updateSpecialization,
  deactivateSpecialization,
  activateSpecialization,
} = require("../controllers/specializationController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   ADMIN — GET ALL SPECIALIZATIONS
   Includes active + inactive
===================================================== */

router.get(
  "/",
  protect,
  authorize("ADMIN"),
  getAllSpecializations
);

/* =====================================================
   PUBLIC/AUTHENTICATED — ACTIVE SPECIALIZATIONS
   Used by:
   - Teacher Signup
   - Student Ask a Doubt
===================================================== */

router.get(
  "/active",
  getActiveSpecializations
);

/* =====================================================
   ADMIN — CREATE
===================================================== */

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createSpecialization
);

/* =====================================================
   ADMIN — GET SINGLE
===================================================== */

router.get(
  "/:id",
  protect,
  authorize("ADMIN"),
  getSpecializationById
);

/* =====================================================
   ADMIN — UPDATE
===================================================== */

router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateSpecialization
);

/* =====================================================
   ADMIN — DEACTIVATE
===================================================== */

router.patch(
  "/:id/deactivate",
  protect,
  authorize("ADMIN"),
  deactivateSpecialization
);

/* =====================================================
   ADMIN — ACTIVATE
===================================================== */

router.patch(
  "/:id/activate",
  protect,
  authorize("ADMIN"),
  activateSpecialization
);

module.exports = router;