const Course = require("../models/Course");
const mongoose = require("mongoose");
/* =====================================================
   CREATE COURSE
===================================================== */

const createCourse = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      durationMonths,
    } = req.body;

    /* ================= VALIDATION ================= */

    if (
  typeof name !== "string" ||
  typeof code !== "string" ||
  !name.trim() ||
  !code.trim() ||
  durationMonths === undefined ||
  durationMonths === null ||
  durationMonths === ""
) {
  return res.status(400).json({
    success: false,
    message: "Valid name, code and duration are required",
  });
}

const parsedDuration = Number(durationMonths);

if (
  !Number.isFinite(parsedDuration) ||
  !Number.isInteger(parsedDuration) ||
  parsedDuration < 1
) {
  return res.status(400).json({
    success: false,
    message: "Course duration must be a positive whole number",
  });
}

    if (Number(durationMonths) < 1) {
      return res.status(400).json({
        success: false,
        message:
          "Course duration must be at least 1 month",
      });
    }

    /* ================= CHECK DUPLICATE CODE ================= */

    const existingCourse =
      await Course.findOne({
        code: code.toUpperCase().trim(),
      });

    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message:
          "Course code already exists",
      });
    }

    /* ================= CREATE COURSE ================= */

    const course = await Course.create({
      name: name.trim(),

      code: code.toUpperCase().trim(),

      description:
        description?.trim() || "",

     durationMonths: parsedDuration,

      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message:
        "Course created successfully",

      course,
    });
  } catch (error) {
    console.error(
      "Create Course Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating course",
    });
  }
};

/* =====================================================
   GET ALL COURSES
===================================================== */

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,

      count: courses.length,

      courses,
    });
  } catch (error) {
    console.error(
      "Get Courses Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching courses",
    });
  }
};

/* =====================================================
   GET ACTIVE COURSES
   OPTIONAL HELPER FOR STUDENT/REGISTRATION
===================================================== */

const getActiveCourses = async (
  req,
  res
) => {
  try {
    const courses = await Course.find({
      isActive: true,
    }).sort({
      name: 1,
    });

    return res.json({
      success: true,

      count: courses.length,

      courses,
    });
  } catch (error) {
    console.error(
      "Get Active Courses Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching active courses",
    });
  }
};

/* =====================================================
   GET SINGLE COURSE
===================================================== */

const getCourseById = async (
  req,
  res
) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid course ID",
  });
}
    const course =
      await Course.findById(
        req.params.id
      );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.json({
      success: true,
      course,
    });
  } catch (error) {
    console.error(
      "Get Course Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching course",
    });
  }
};

/* =====================================================
   UPDATE COURSE
===================================================== */

const updateCourse = async (
  req,
  res
) => {
  try {
    const {
      name,
      code,
      description,
      durationMonths,
      isActive,
    } = req.body;

    /* ================= FIND COURSE ================= */

    const course =
      await Course.findById(
        req.params.id
      );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    /* ================= CHECK COURSE CODE ================= */

    if (
      code &&
      code.toUpperCase().trim() !==
        course.code
    ) {
      const existingCourse =
        await Course.findOne({
          code: code
            .toUpperCase()
            .trim(),

          _id: {
            $ne: course._id,
          },
        });

      if (existingCourse) {
        return res.status(409).json({
          success: false,
          message:
            "Course code already exists",
        });
      }

      course.code =
        code.toUpperCase().trim();
    }

    /* ================= UPDATE FIELDS ================= */

    if (name !== undefined) {
      course.name = name.trim();
    }

    if (description !== undefined) {
      course.description =
        description.trim();
    }

    if (durationMonths !== undefined) {
      if (
        Number(durationMonths) < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Course duration must be at least 1 month",
        });
      }

      course.durationMonths =
        Number(durationMonths);
    }

    if (isActive !== undefined) {
      course.isActive = isActive;
    }

    await course.save();

    return res.json({
      success: true,
      message:
        "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error(
      "Update Course Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating course",
    });
  }
};

/* =====================================================
   DEACTIVATE COURSE
===================================================== */

const deactivateCourse = async (
  req,
  res
) => {
  try {
    const course =
      await Course.findById(
        req.params.id
      );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (!course.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Course is already inactive",
      });
    }

    course.isActive = false;

    await course.save();

    return res.json({
      success: true,
      message:
        "Course deactivated successfully",
      course,
    });
  } catch (error) {
    console.error(
      "Deactivate Course Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deactivating course",
    });
  }
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
  createCourse,
  getCourses,
  getActiveCourses,
  getCourseById,
  updateCourse,
  deactivateCourse,
};