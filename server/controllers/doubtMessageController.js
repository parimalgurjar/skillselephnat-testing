const mongoose = require("mongoose");
const Doubt = require("../models/Doubt");
const DoubtMessage = require("../models/DoubtMessage");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const checkDoubtAccess = (doubt, user) => {
  if (user.role === "ADMIN") return true;

  if (
    user.role === "STUDENT" &&
    doubt.studentId.toString() === user._id.toString()
  ) {
    return true;
  }

  if (
    user.role === "TEACHER" &&
    doubt.assignedTeacher &&
    doubt.assignedTeacher.toString() === user._id.toString()
  ) {
    return true;
  }

  return false;
};

/* ================= GET CONVERSATION ================= */

const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doubt ID",
      });
    }

    const doubt = await Doubt.findById(id);

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: "Doubt not found",
      });
    }

    if (!checkDoubtAccess(doubt, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this conversation",
      });
    }

    const messages = await DoubtMessage.find({
      doubtId: id,
    })
      .populate("senderId", "name email role")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get Conversation Messages Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch conversation messages",
    });
  }
};

/* ================= SEND MESSAGE ================= */

const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doubt ID",
      });
    }

    const doubt = await Doubt.findById(id);

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: "Doubt not found",
      });
    }

    if (!checkDoubtAccess(doubt, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reply to this doubt",
      });
    }

    if (doubt.status === "RESOLVED") {
      return res.status(400).json({
        success: false,
        message: "Resolved doubts cannot receive new messages",
      });
    }

    const trimmedMessage =
      typeof message === "string" ? message.trim() : "";

    if (!trimmedMessage && !req.file) {
      return res.status(400).json({
        message: "Message or attachment is required",
      });
    }

    let attachment = null;

    if (req.file) {
      const file = req.file;

      let attachmentType = "file";

      if (file.mimetype.startsWith("image/")) {
        attachmentType = "image";
      } else if (file.mimetype.startsWith("video/")) {
        attachmentType = "video";
      }

      const uploadedFile = await uploadToCloudinary(
        file.buffer,
        {
          resource_type: "auto",
        }
      );

      attachment = {
        type: attachmentType,
        url: uploadedFile.secure_url,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    const newMessage = await DoubtMessage.create({
      doubtId: doubt._id,
      senderId: req.user._id,
      senderRole: req.user.role,
      message: trimmedMessage,
      attachment,
    });

    if (doubt.status === "PENDING") {
      doubt.status = "IN_PROGRESS";
      await doubt.save();
    }

    await newMessage.populate("senderId", "name email role");

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Send Message Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send message",
    });
  }
};

module.exports = {
  getConversationMessages,
  sendMessage,
};