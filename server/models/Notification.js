const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    eventKey: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
      maxlength: 180,
    },

    message: {
      type: String,
      default: "",
      maxlength: 500,
    },

    link: {
      type: String,
      required: true,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Same event ke duplicate notifications prevent karega.
notificationSchema.index(
  {
    recipient: 1,
    eventKey: 1,
  },
  {
    unique: true,
  }
);

// User ki latest notifications fetch karne ke liye.
notificationSchema.index({
  recipient: 1,
  _id: -1,
});

// Unread notifications count karne ke liye.
notificationSchema.index({
  recipient: 1,
  readAt: 1,
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);