const express = require("express");

const {
  createDoubt,
  getDoubts,
  getDoubtById,
  addDoubtReply,
  resolveDoubt,
} = require("../controllers/doubtController");
const {
  uploadAttachment,
} = require("../middleware/uploadMiddleware");
const {
  getConversationMessages,
  sendMessage,
} = require("../controllers/doubtMessageController");
const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   CREATE DOUBT
===================================================== */

router.post(
  "/",
  protect,
  authorize("STUDENT"),
  uploadAttachment.single("attachment"),
  createDoubt
);

/* =====================================================
   GET ALL ACCESSIBLE DOUBTS
===================================================== */

router.get(
  "/",
  protect,
  getDoubts
);

/* ================= NEW MESSAGE API ================= */

router.get(
  "/:id/messages",
  protect,
  authorize("STUDENT", "TEACHER"),
  getConversationMessages
);

router.post(
  "/:id/messages",
  protect,
  authorize("STUDENT", "TEACHER"),
  uploadAttachment.single("attachment"),
  sendMessage
);
/* =====================================================
   GET SINGLE DOUBT
===================================================== */

router.get(
  "/:id",
  protect,
  getDoubtById
);

/* =====================================================
   ADD REPLY
===================================================== */

router.post(
  "/:id/reply",
  protect,
  authorize("STUDENT", "TEACHER"),
  addDoubtReply
);

/* =====================================================
   RESOLVE DOUBT
   TEACHER ONLY
===================================================== */

router.patch(
  "/:id/resolve",
  protect,
  authorize("TEACHER"),
  resolveDoubt
);

module.exports = router;