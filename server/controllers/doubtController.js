const Doubt = require("../models/Doubt");
const User = require("../models/User");
const mongoose = require("mongoose");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
/* =====================================================
   ESCAPE REGEX
===================================================== */

const escapeRegex = (text) => {
  return text.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

/* =====================================================
   CREATE DOUBT
   STUDENT ONLY
===================================================== */

const createDoubt = async (req, res) => {
  try {
    const {
      topic,
      title,
      description,
      attachments,
    } = req.body;

    if (
  typeof topic !== "string" ||
  typeof title !== "string" ||
  typeof description !== "string" ||
  !topic.trim() ||
  !title.trim() ||
  !description.trim()
) {
  return res.status(400).json({
    success: false,
    message:
      "Topic, title and description are required and must be strings",
  });
}

    const cleanedTopic = topic.trim();
    const cleanedTitle = title.trim();
    const cleanedDescription =
      description.trim();


    /* ================= FIND ASSIGNED TEACHER ================= */

   const topicRegex = new RegExp(
  escapeRegex(cleanedTopic),
  "i"
);

    const assignedTeacher =
      await User.findOne({
        role: "TEACHER",
        status: "ACTIVE",
        isActive: true,
        specializations: {
          $elemMatch: {
            $regex: topicRegex,
          },
        },
      });


    if (!assignedTeacher) {
      return res.status(404).json({
        success: false,
        message:
          "No active teacher is assigned to this topic",
      });
    }
let uploadedAttachments = [];

if (Array.isArray(attachments)) {
  uploadedAttachments = attachments;
}

if (req.file) {
  const uploadedFile = await uploadToCloudinary(
    req.file.buffer,
    {
      resource_type: "image",
      folder: "skillselephant/doubts",
    }
  );

  uploadedAttachments.push(uploadedFile.secure_url);
}
    /* ================= CREATE DOUBT ================= */

    const doubt = await Doubt.create({
      studentId: req.user._id,
      topic: cleanedTopic,
      title: cleanedTitle,
      description:
        cleanedDescription,
      attachments: uploadedAttachments,
      assignedTeacher:
        assignedTeacher._id,
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message:
        "Doubt submitted successfully and assigned to teacher",
      doubt,
    });
  } catch (error) {
    console.error(
      "Create Doubt Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to submit doubt",
    });
  }
};

/* =====================================================
   GET DOUBTS
===================================================== */

const getDoubts = async (req, res) => {
  try {
    let doubts = [];

    if (req.user.role === "STUDENT") {
      doubts = await Doubt.find({
        studentId: req.user._id,
      })
        .populate(
          "assignedTeacher",
          "name email specializations"
        )
        .sort({ createdAt: -1 });
    }

    else if (
      req.user.role === "TEACHER"
    ) {
      doubts = await Doubt.find({
        assignedTeacher:
          req.user._id,
      })
        .populate(
          "studentId",
          "name email phone batchTiming"
        )
        .sort({ createdAt: -1 });
    }

    else if (
      req.user.role === "ADMIN"
    ) {
      doubts = await Doubt.find()
        .populate(
          "studentId",
          "name email phone batchTiming"
        )
        .populate(
          "assignedTeacher",
          "name email specializations"
        )
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      count: doubts.length,
      doubts,
    });
  } catch (error) {
    console.error(
      "Get Doubts Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch doubts",
    });
  }
};

/* =====================================================
   GET SINGLE DOUBT
===================================================== */

const getDoubtById = async (
  req,
  res
) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid doubt ID",
  });
}
    const doubt = await Doubt.findById(
      req.params.id
    )
      .populate(
        "studentId",
        "name email phone batchTiming"
      )
      .populate(
        "assignedTeacher",
        "name email specializations"
      )
      .populate(
        "replies.senderId",
        "name email role"
      );

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: "Doubt not found",
      });
    }

    /* ================= ADMIN ACCESS ================= */

    if (req.user.role === "ADMIN") {
      return res.status(200).json({
        success: true,
        doubt,
      });
    }

    /* ================= STUDENT ACCESS ================= */

    if (
      req.user.role === "STUDENT" &&
      doubt.studentId._id.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to access this doubt",
      });
    }

    /* ================= TEACHER ACCESS ================= */

    if (
      req.user.role === "TEACHER" &&
      (!doubt.assignedTeacher ||
        doubt.assignedTeacher._id.toString() !==
          req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to access this doubt",
      });
    }

    return res.status(200).json({
      success: true,
      doubt,
    });
  } catch (error) {
    console.error(
      "Get Doubt By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch doubt",
    });
  }
};

/* =====================================================
   ADD REPLY
===================================================== */

const addDoubtReply = async (
  req,
  res
) => {
  try {
    const { message, attachments } =
      req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Reply message is required",
      });
    }

    const doubt = await Doubt.findById(
      req.params.id
    );

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: "Doubt not found",
      });
    }

    /* ================= STUDENT SECURITY ================= */

    if (
      req.user.role === "STUDENT" &&
      doubt.studentId.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to reply to this doubt",
      });
    }

    /* ================= TEACHER SECURITY ================= */

    if (
      req.user.role === "TEACHER" &&
      (!doubt.assignedTeacher ||
        doubt.assignedTeacher.toString() !==
          req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to reply to this doubt",
      });
    }

    /* ================= ADD REPLY ================= */

    doubt.replies.push({
      senderId: req.user._id,
      message: message.trim(),
      attachments:
        Array.isArray(attachments)
          ? attachments
          : [],
    });

    /* ================= UPDATE STATUS ================= */

    if (doubt.status === "PENDING") {
      doubt.status = "IN_PROGRESS";
    }

    await doubt.save();

    return res.status(201).json({
      success: true,
      message:
        "Reply added successfully",
      doubt,
    });
  } catch (error) {
    console.error(
      "Add Reply Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to add reply",
    });
  }
};

/* =====================================================
   RESOLVE DOUBT
   ASSIGNED TEACHER ONLY
===================================================== */

const resolveDoubt = async (
  req,
  res
) => {
  try {
    const doubt = await Doubt.findById(
      req.params.id
    );

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: "Doubt not found",
      });
    }

    /* ================= TEACHER SECURITY ================= */

    if (
      !doubt.assignedTeacher ||
      doubt.assignedTeacher.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to resolve this doubt",
      });
    }

    /* ================= ALREADY RESOLVED ================= */

    if (doubt.status === "RESOLVED") {
      return res.status(400).json({
        success: false,
        message:
          "This doubt is already resolved",
      });
    }

    /* ================= RESOLVE ================= */

    doubt.status = "RESOLVED";
    doubt.resolvedAt = new Date();

    await doubt.save();

    return res.status(200).json({
      success: true,
      message:
        "Doubt marked as resolved successfully",
      doubt,
    });
  } catch (error) {
    console.error(
      "Resolve Doubt Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to resolve doubt",
    });
  }
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
  createDoubt,
  getDoubts,
  getDoubtById,
  addDoubtReply,
  resolveDoubt,
};