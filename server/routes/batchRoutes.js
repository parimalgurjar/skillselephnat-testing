const express = require("express");

const {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchStats,
  getBatchByTiming,
  getPublicBatches,
} = require("../controllers/batchController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();


/* PUBLIC - SIGNUP BATCH DROPDOWN */
router.get(
  "/public",
  getPublicBatches
);


/* ADMIN STATS */
router.get(
  "/stats",
  protect,
  authorize("ADMIN"),
  getBatchStats
);


/* ADMIN GET ALL BATCHES */
router.get(
  "/",
  protect,
  authorize("ADMIN"),
  getBatches
);


/* CREATE BATCH */
router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createBatch
);


/* GET BATCH BY TIMING */
router.get(
  "/by-timing",
  protect,
  getBatchByTiming
);


/* UPDATE BATCH */
router.patch(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateBatch
);


/* DELETE BATCH */
router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  deleteBatch
);

module.exports = router;