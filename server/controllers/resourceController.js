
const mongoose = require("mongoose");
const Resource = require("../models/Resource");
const Course = require("../models/Course");
const CourseModule = require("../models/CourseModule");

/* =========================================
   VALIDATE RESOURCE DATA
========================================= */

const validateResourceData = async ({
  title,
  resourceType,
  resourceUrl,
  courseId,
  modules = [],
}) => {
  if (!title?.trim()) {
    throw new Error("Resource title is required.");
  }

  if (!resourceType) {
    throw new Error("Please select resource type.");
  }

  if (!resourceUrl?.trim()) {
    throw new Error("Resource URL is required.");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(resourceUrl.trim());
  } catch {
    throw new Error("Please enter a valid resource URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS links are allowed.");
  }

  const normalizedCourseId = courseId?._id || courseId;

  if (
    !normalizedCourseId ||
    !mongoose.Types.ObjectId.isValid(normalizedCourseId)
  ) {
    throw new Error("Please select a valid course.");
  }

  const course = await Course.findById(normalizedCourseId);

  if (!course || course.isActive === false) {
    throw new Error("Selected course is not available.");
  }

  if (!Array.isArray(modules)) {
    throw new Error("Invalid module selection.");
  }

  const uniqueModules = [...new Set(modules.map(String))];

  for (const moduleId of uniqueModules) {
    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      throw new Error("Invalid module selected.");
    }
  }

  if (uniqueModules.length > 0) {
    const validModules = await CourseModule.find({
      _id: { $in: uniqueModules },
      courseId: normalizedCourseId,
      isActive: true,
    }).select("_id");

    if (validModules.length !== uniqueModules.length) {
      throw new Error(
        "One or more selected modules do not belong to this course."
      );
    }
  }

  return {
    courseId: normalizedCourseId,
    modules: uniqueModules,
  };
};

/* =========================================
   GET ALL RESOURCES - ADMIN
========================================= */

const getAdminResources = async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate("courseId", "name code")
      .populate("modules", "name moduleNumber")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      resources,
    });
  } catch (error) {
    console.error("Get Admin Resources Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch resources.",
    });
  }
};

/* =========================================
   GET PUBLISHED RESOURCES - STUDENT / TEACHER
========================================= */


const getPublishedResources = async (req, res) => {
  try {
    // All students and teachers can see all published resources.
    const filter = {
      status: "PUBLISHED",
    };

    const resources = await Resource.find(filter)
      .populate("courseId", "name code")
      .populate("modules", "name moduleNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      resources,
    });
  } catch (error) {
    console.error("Get Published Resources Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch published resources.",
    });
  }
};


/* =========================================
   CREATE RESOURCE - ADMIN
   New resources are always published.
========================================= */

const createResource = async (req, res) => {
  try {
    const {
      title,
      description,
      resourceType,
      resourceUrl,
      courseId,
      modules = [],
    } = req.body;

    const validated = await validateResourceData({
      title,
      resourceType,
      resourceUrl,
      courseId,
      modules,
    });

    const resource = await Resource.create({
      title: title.trim(),
      description: description?.trim() || "",
      resourceType,
      resourceUrl: resourceUrl.trim(),
      courseId: validated.courseId,
      modules: validated.modules,
      status: "PUBLISHED",
      createdBy: req.user._id,
    });

    const savedResource = await Resource.findById(resource._id)
      .populate("courseId", "name code")
      .populate("modules", "name moduleNumber")
      .populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Resource published successfully.",
      resource: savedResource,
    });
  } catch (error) {
    console.error("Create Resource Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create resource.",
    });
  }
};

/* =========================================
   UPDATE RESOURCE - ADMIN
========================================= */

const updateResource = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource ID.",
      });
    }

    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found.",
      });
    }

    const {
      title,
      description,
      resourceType,
      resourceUrl,
      courseId,
      modules,
    } = req.body;

    const updatedData = {
      title: title ?? resource.title,
      resourceType: resourceType ?? resource.resourceType,
      resourceUrl: resourceUrl ?? resource.resourceUrl,
      courseId: courseId ?? resource.courseId,
      modules:
        modules !== undefined
          ? modules
          : resource.modules.map((module) => String(module)),
    };

    const validated = await validateResourceData(updatedData);

    resource.title = updatedData.title.trim();
    resource.description =
      description !== undefined
        ? description.trim()
        : resource.description;

    resource.resourceType = updatedData.resourceType;
    resource.resourceUrl = updatedData.resourceUrl.trim();
    resource.courseId = validated.courseId;
    resource.modules = validated.modules;

    await resource.save();

    const updatedResource = await Resource.findById(resource._id)
      .populate("courseId", "name code")
      .populate("modules", "name moduleNumber")
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Resource updated successfully.",
      resource: updatedResource,
    });
  } catch (error) {
    console.error("Update Resource Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update resource.",
    });
  }
};

/* =========================================
   UPDATE RESOURCE STATUS - ADMIN
========================================= */

const updateResourceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource ID.",
      });
    }

    if (!["PUBLISHED", "DRAFT"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource status.",
      });
    }

    const resource = await Resource.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("courseId", "name code")
      .populate("modules", "name moduleNumber");

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Resource ${status.toLowerCase()} successfully.`,
      resource,
    });
  } catch (error) {
    console.error("Update Resource Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update resource status.",
    });
  }
};

/* =========================================
   DELETE RESOURCE - ADMIN
========================================= */

const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource ID.",
      });
    }

    const resource = await Resource.findByIdAndDelete(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Resource deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Resource Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete resource.",
    });
  }
};

module.exports = {
  getAdminResources,
  getPublishedResources,
  createResource,
  updateResource,
  updateResourceStatus,
  deleteResource,
};
