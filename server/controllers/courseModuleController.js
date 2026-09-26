const CourseModule = require("../models/CourseModule");
const Course = require("../models/Course");
const mongoose = require("mongoose");

/* =====================================================
   CREATE MODULE
===================================================== */

const createModule = async (req, res) => {
  try {
    const {
      courseId,
      moduleNumber,
      name,
      description,
      externalUrl,
      durationDays,
    } = req.body;

    /* ================= VALIDATION ================= */

    if (!courseId || !moduleNumber || !name) {
      return res.status(400).json({
        success: false,
        message:
          "Course ID, module number and name are required",
      });
    }

    if (Number(moduleNumber) < 1) {
      return res.status(400).json({
        success: false,
        message:
          "Module number must be at least 1",
      });
    }

    if (
      durationDays === undefined ||
      durationDays === null ||
      Number(durationDays) < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duration must be at least 1 day",
      });
    }

    /* ================= CHECK COURSE ================= */

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    /* ================= DUPLICATE MODULE CHECK ================= */

    const existingModule = await CourseModule.findOne({
      courseId,
      moduleNumber: Number(moduleNumber),
    });

    if (existingModule) {
      return res.status(409).json({
        success: false,
        message:
          "This module number already exists for this course",
      });
    }

    /* ================= CREATE MODULE ================= */

    const courseModule = await CourseModule.create({
      courseId,
      moduleNumber: Number(moduleNumber),
      name: name.trim(),
      description: description?.trim() || "",
      externalUrl: externalUrl?.trim() || "",
      durationDays: Number(durationDays),
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message:
        "Course module created successfully",
      module: courseModule,
    });
  } catch (error) {
    console.error(
      "Create Module Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating module",
    });
  }
};

/* =====================================================
   GET ALL MODULES BY COURSE
===================================================== */

const getModulesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const modules = await CourseModule.find({
      courseId,
    }).sort({
      moduleNumber: 1,
    });

    return res.status(200).json({
      success: true,

      course: {
        id: course._id,
        name: course.name,
        code: course.code,
        description: course.description,
        durationMonths: course.durationMonths,
      },

      count: modules.length,
      modules,
    });
  } catch (error) {
    console.error(
      "Get Modules Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching modules",
    });
  }
};

/* =====================================================
   GET ACTIVE MODULES BY COURSE
   STUDENT PORTAL
===================================================== */

const getActiveModulesByCourse = async (
  req,
  res
) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    /* ================= CHECK ACTIVE COURSE ================= */

    const course = await Course.findOne({
      _id: courseId,
      isActive: true,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message:
          "Active course not found",
      });
    }

    /* ================= GET ACTIVE MODULES ================= */

    const modules = await CourseModule.find({
      courseId,
      isActive: true,
    }).sort({
      moduleNumber: 1,
    });

    return res.status(200).json({
      success: true,

      course: {
        id: course._id,
        name: course.name,
        code: course.code,
        description: course.description,
        durationMonths: course.durationMonths,
      },

      count: modules.length,
      modules,
    });
  } catch (error) {
    console.error(
      "Get Active Modules Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching active modules",
    });
  }
};

/* =====================================================
   GET SINGLE MODULE
===================================================== */

const getModuleById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    const courseModule =
      await CourseModule.findById(
        req.params.id
      ).populate(
        "courseId",
        "name code description durationMonths"
      );

    if (!courseModule) {
      return res.status(404).json({
        success: false,
        message:
          "Course module not found",
      });
    }

    return res.status(200).json({
      success: true,
      module: courseModule,
    });
  } catch (error) {
    console.error(
      "Get Module Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching module",
    });
  }
};

/* =====================================================
   UPDATE MODULE
===================================================== */

const updateModule = async (req, res) => {
  try {
    const {
      moduleNumber,
      name,
      description,
      externalUrl,
      durationDays,
      isActive,
    } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    const courseModule =
      await CourseModule.findById(
        req.params.id
      );

    if (!courseModule) {
      return res.status(404).json({
        success: false,
        message:
          "Course module not found",
      });
    }

    /* ================= UPDATE MODULE NUMBER ================= */

    if (moduleNumber !== undefined) {
      if (Number(moduleNumber) < 1) {
        return res.status(400).json({
          success: false,
          message:
            "Module number must be at least 1",
        });
      }

      const duplicateModule =
        await CourseModule.findOne({
          courseId: courseModule.courseId,
          moduleNumber: Number(moduleNumber),
          _id: {
            $ne: courseModule._id,
          },
        });

      if (duplicateModule) {
        return res.status(409).json({
          success: false,
          message:
            "This module number already exists for this course",
        });
      }

      courseModule.moduleNumber =
        Number(moduleNumber);
    }

    /* ================= UPDATE NAME ================= */

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Module name cannot be empty",
        });
      }

      courseModule.name = name.trim();
    }

    /* ================= UPDATE DURATION DAYS ================= */

    if (durationDays !== undefined) {
      if (Number(durationDays) < 1) {
        return res.status(400).json({
          success: false,
          message:
            "Duration must be at least 1 day",
        });
      }

      courseModule.durationDays =
        Number(durationDays);
    }

    /* ================= UPDATE DESCRIPTION ================= */

    if (description !== undefined) {
      courseModule.description =
        description?.trim() || "";
    }

    /* ================= UPDATE EXTERNAL URL ================= */

    if (externalUrl !== undefined) {
      courseModule.externalUrl =
        externalUrl?.trim() || "";
    }

    /* ================= UPDATE STATUS ================= */

    if (isActive !== undefined) {
      courseModule.isActive =
        Boolean(isActive);
    }

    await courseModule.save();

    return res.status(200).json({
      success: true,
      message:
        "Course module updated successfully",
      module: courseModule,
    });
  } catch (error) {
    console.error(
      "Update Module Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating module",
    });
  }
};

/* =====================================================
   DEACTIVATE MODULE
===================================================== */

const deactivateModule = async (
  req,
  res
) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    const courseModule =
      await CourseModule.findById(
        req.params.id
      );

    if (!courseModule) {
      return res.status(404).json({
        success: false,
        message:
          "Course module not found",
      });
    }

    if (!courseModule.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Module is already inactive",
      });
    }

    courseModule.isActive = false;

    await courseModule.save();

    return res.status(200).json({
      success: true,
      message:
        "Course module deactivated successfully",
      module: courseModule,
    });
  } catch (error) {
    console.error(
      "Deactivate Module Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deactivating module",
    });
  }
};
// Activate module
const activateModule = async (req, res) => {
  try {
    const { id } = req.params;

    const module = await CourseModule.findByIdAndUpdate(
      id,
      { isActive: true },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!module) {
      return res.status(404).json({
        message: "Module not found",
      });
    }

    res.status(200).json({
      message: "Module activated successfully",
      module,
    });
  } catch (error) {
    console.error("Activate Module Error:", error);

    res.status(500).json({
      message: "Failed to activate module",
      error: error.message,
    });
  }
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
  createModule,
  getModulesByCourse,
  getActiveModulesByCourse,
  getModuleById,
  updateModule,
  deactivateModule,
  activateModule
};