
const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video", "file"],
      required: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    filename: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      required: true,
      trim: true,
    },

    size: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const doubtMessageSchema = new mongoose.Schema(
  {
    doubtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doubt",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderRole: {
      type: String,
      enum: ["STUDENT", "TEACHER"],
      required: true,
    },

    message: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },

    attachment: {
      type: attachmentSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

doubtMessageSchema.index({
  doubtId: 1,
  createdAt: 1,
});

doubtMessageSchema.pre("validate", function () {
  const hasMessage =
    typeof this.message === "string" &&
    this.message.trim().length > 0;

  const hasAttachment = Boolean(this.attachment);

  if (!hasMessage && !hasAttachment) {
    throw new Error("Message or attachment is required");
  }
});

module.exports = mongoose.model(
  "DoubtMessage",
  doubtMessageSchema
);