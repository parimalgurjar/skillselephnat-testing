
const express = require("express");

const router = express.Router();

const {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  reviewLeaveRequest,
  cancelMyLeaveRequest
} = require("../controllers/leaveController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const {
  uploadLeaveProof,
} = require("../middleware/uploadMiddleware");

/* =====================================================
   STUDENT - SUBMIT LEAVE REQUEST

   POST /api/leaves

   FormData:
   startDate
   endDate
   reason
   proof (optional)
===================================================== */

router.post(
  "/",
  protect,
  authorize("STUDENT"),
  uploadLeaveProof.single("proof"),
  createLeaveRequest
);

/* =====================================================
   STUDENT - GET OWN LEAVE REQUESTS

   GET /api/leaves/my
===================================================== */

router.get(
  "/my",
  protect,
  authorize("STUDENT"),
  getMyLeaveRequests
);
// STUDENT - CANCEL OWN PENDING LEAVE
router.delete(
  "/:id",
  protect,
  authorize("STUDENT"),
  cancelMyLeaveRequest
);
/* =====================================================
   ADMIN - GET ALL LEAVE REQUESTS

   GET /api/leaves
===================================================== */

router.get(
  "/",
  protect,
  authorize("ADMIN"),
  getAllLeaveRequests
);

/* =====================================================
   ADMIN - APPROVE / REJECT LEAVE

   PATCH /api/leaves/:id/review
===================================================== */

router.patch(
  "/:id/review",
  protect,
  authorize("ADMIN"),
  reviewLeaveRequest
);

module.exports = router;
