
const mongoose = require("mongoose");
const VideoTutorial = require("../models/VideoTutorial");
const CourseModule = require("../models/CourseModule");

// Extract YouTube video ID
const extractYouTubeId = (url) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    let videoId = null;

    if (hostname === "youtu.be") {
      videoId = parsedUrl.pathname.split("/")[1];
    } else if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "youtube-nocookie.com"
    ) {
      if (parsedUrl.pathname === "/watch") {
        videoId = parsedUrl.searchParams.get("v");
      } else {
        const match = parsedUrl.pathname.match(
          /^\/(?:embed|shorts|live)\/([^/?]+)/
        );

        videoId = match?.[1] || null;
      }
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return null;
    }

    return videoId;
  } catch {
    return null;
  }
};

// Validate module IDs
const validateModules = async (moduleIds) => {
  if (!Array.isArray(moduleIds)) {
    return {
      valid: false,
      message: "Modules must be provided as an array.",
    };
  }

  const uniqueIds = [...new Set(moduleIds.map(String))];

  if (uniqueIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    return {
      valid: false,
      message: "Invalid module ID provided.",
    };
  }

  if (uniqueIds.length === 0) {
    return {
      valid: true,
      modules: [],
    };
  }

  const foundModules = await CourseModule.find({
    _id: { $in: uniqueIds },
    isActive: true,
  }).select("_id");

  if (foundModules.length !== uniqueIds.length) {
    return {
      valid: false,
      message: "One or more selected modules are invalid or inactive.",
    };
  }

  return {
    valid: true,
    modules: foundModules.map((module) => module._id),
  };
};

// ADMIN: Get all videos
exports.getAllVideos = async (req, res) => {
  try {
    const videos = await VideoTutorial.find()
      .populate("createdBy", "name")
      .populate("modules", "name moduleNumber courseId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error("Get videos error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch video tutorials.",
    });
  }
};

// ADMIN: Add video
exports.addVideo = async (req, res) => {
  try {
    const { title, youtubeUrl, modules = [] } = req.body;

    if (!title?.trim() || !youtubeUrl?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Video title and YouTube link are required.",
      });
    }

    const videoId = extractYouTubeId(youtubeUrl.trim());

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid YouTube video link.",
      });
    }

    const moduleValidation = await validateModules(modules);

    if (!moduleValidation.valid) {
      return res.status(400).json({
        success: false,
        message: moduleValidation.message,
      });
    }

    const video = await VideoTutorial.create({
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim(),
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      modules: moduleValidation.modules,
      createdBy: req.user._id,
    });

    await video.populate("modules", "name moduleNumber courseId");

    return res.status(201).json({
      success: true,
      message: "Video tutorial added successfully.",
      video,
    });
  } catch (error) {
    console.error("Add video error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add video tutorial.",
    });
  }
};

// ADMIN: Update video
exports.updateVideo = async (req, res) => {
  try {
    const { title, youtubeUrl, isPublished, modules } = req.body;

    const video = await VideoTutorial.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video tutorial not found.",
      });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Video title cannot be empty.",
        });
      }

      video.title = title.trim();
    }

    if (youtubeUrl !== undefined) {
      if (typeof youtubeUrl !== "string" || !youtubeUrl.trim()) {
        return res.status(400).json({
          success: false,
          message: "YouTube link cannot be empty.",
        });
      }

      const videoId = extractYouTubeId(youtubeUrl.trim());

      if (!videoId) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid YouTube video link.",
        });
      }

      video.youtubeUrl = youtubeUrl.trim();
      video.videoId = videoId;
      video.thumbnail =
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    if (modules !== undefined) {
      const moduleValidation = await validateModules(modules);

      if (!moduleValidation.valid) {
        return res.status(400).json({
          success: false,
          message: moduleValidation.message,
        });
      }

      video.modules = moduleValidation.modules;
    }

    if (isPublished !== undefined) {
      if (typeof isPublished !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Invalid publish status.",
        });
      }

      video.isPublished = isPublished;
    }

    await video.save();

    await video.populate("modules", "name moduleNumber courseId");

    return res.status(200).json({
      success: true,
      message: "Video tutorial updated successfully.",
      video,
    });
  } catch (error) {
    console.error("Update video error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update video tutorial.",
    });
  }
};

// ADMIN: Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const video = await VideoTutorial.findByIdAndDelete(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video tutorial not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Video tutorial deleted successfully.",
    });
  } catch (error) {
    console.error("Delete video error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete video tutorial.",
    });
  }
};

// STUDENT + TEACHER: Get published videos
exports.getPublishedVideos = async (req, res) => {
  try {
    const videos = await VideoTutorial.find({
      isPublished: true,
    })
      .select("title youtubeUrl videoId thumbnail createdAt modules")
      .populate("modules", "name moduleNumber courseId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error("Get published videos error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch video tutorials.",
    });
  }
};
