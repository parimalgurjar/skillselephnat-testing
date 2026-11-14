
const VideoTutorial = require("../models/VideoTutorial");

// Extract YouTube video ID from supported URL formats
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

// ADMIN: Get all videos
exports.getAllVideos = async (req, res) => {
  try {
    const videos = await VideoTutorial.find()
      .populate("createdBy", "name")
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
    const { title, youtubeUrl } = req.body;

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

    const video = await VideoTutorial.create({
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim(),
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      createdBy: req.user._id,
    });

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
    const { title, youtubeUrl, isPublished } = req.body;

    const video = await VideoTutorial.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video tutorial not found.",
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Video title cannot be empty.",
        });
      }

      video.title = title.trim();
    }

    if (youtubeUrl !== undefined) {
      if (!youtubeUrl.trim()) {
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
    const video = await VideoTutorial.findByIdAndDelete(
      req.params.id
    );

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
      .select("title youtubeUrl videoId thumbnail createdAt")
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
