const Specialization = require("../models/Specialization");
const User = require("../models/User");

/* =====================================================
   HELPER
   Escape special characters before using a string
   inside a RegExp.
===================================================== */

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/* =====================================================
   CREATE SPECIALIZATION
   ADMIN ONLY

   Example:
   WordPress
   Meta Ads
   Google Ads
===================================================== */

const createSpecialization = async (req, res) => {
  try {
    const { name, displayOrder } = req.body;

    /* ================= VALIDATION ================= */

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Specialization name is required",
      });
    }

    const cleanName = name.trim();

    /* ================= DUPLICATE CHECK ================= */

    const existing = await Specialization.findOne({
      name: {
        $regex: `^${escapeRegex(cleanName)}$`,
        $options: "i",
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This specialization already exists",
      });
    }

    /* ================= CREATE ================= */

    const specialization = await Specialization.create({
      name: cleanName,
      displayOrder:
        Number.isFinite(Number(displayOrder)) &&
        Number(displayOrder) >= 0
          ? Number(displayOrder)
          : 0,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Specialization created successfully",
      specialization,
    });
  } catch (error) {
    console.error(
      "Create Specialization Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating specialization",
    });
  }
};

/* =====================================================
   GET ALL SPECIALIZATIONS
   ADMIN

   Includes active + inactive.
===================================================== */

const getAllSpecializations = async (req, res) => {
  try {
    const specializations =
      await Specialization.find()
        .sort({
          displayOrder: 1,
          name: 1,
        });

    return res.status(200).json({
      success: true,
      count: specializations.length,
      specializations,
    });
  } catch (error) {
    console.error(
      "Get All Specializations Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching specializations",
    });
  }
};

/* =====================================================
   GET ACTIVE SPECIALIZATIONS
   TEACHER SIGNUP + STUDENT ASK A DOUBT

   Only active specializations are returned.
===================================================== */

const getActiveSpecializations = async (req, res) => {
  try {
    const specializations =
      await Specialization.find({
        isActive: true,
      }).sort({
        displayOrder: 1,
        name: 1,
      });

    return res.status(200).json({
      success: true,
      count: specializations.length,
      specializations,
    });
  } catch (error) {
    console.error(
      "Get Active Specializations Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching active specializations",
    });
  }
};

/* =====================================================
   GET SINGLE SPECIALIZATION
   ADMIN
===================================================== */

const getSpecializationById = async (req, res) => {
  try {
    const specialization =
      await Specialization.findById(req.params.id);

    if (!specialization) {
      return res.status(404).json({
        success: false,
        message: "Specialization not found",
      });
    }

    return res.status(200).json({
      success: true,
      specialization,
    });
  } catch (error) {
    console.error(
      "Get Specialization Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching specialization",
    });
  }
};

/* =====================================================
   UPDATE SPECIALIZATION
   ADMIN ONLY

   IMPORTANT:
   If Admin changes:

   WordPress
        ↓
   WordPress Advanced

   Existing teachers having "WordPress" will also
   be updated to "WordPress Advanced".

   This keeps teacher specialization matching
   consistent with the specialization master list.
===================================================== */

const updateSpecialization = async (req, res) => {
  try {
    const { name, displayOrder, isActive } =
      req.body;

    const specialization =
      await Specialization.findById(req.params.id);

    if (!specialization) {
      return res.status(404).json({
        success: false,
        message: "Specialization not found",
      });
    }

    const oldName = specialization.name;

    /* ================= NAME UPDATE ================= */

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Specialization name cannot be empty",
        });
      }

      const newName = name.trim();

      /* Prevent duplicate names */

      const duplicate =
        await Specialization.findOne({
          _id: {
            $ne: specialization._id,
          },
          name: {
            $regex: `^${escapeRegex(newName)}$`,
            $options: "i",
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "Another specialization with this name already exists",
        });
      }

      specialization.name = newName;
    }

    /* ================= ORDER UPDATE ================= */

    if (displayOrder !== undefined) {
      const order = Number(displayOrder);

      if (!Number.isFinite(order) || order < 0) {
        return res.status(400).json({
          success: false,
          message:
            "Display order must be a valid positive number",
        });
      }

      specialization.displayOrder = order;
    }

    /* ================= STATUS UPDATE ================= */

    if (isActive !== undefined) {
      specialization.isActive =
        Boolean(isActive);
    }

    await specialization.save();

    /* =================================================
       SYNC TEACHER SPECIALIZATIONS

       Only when name actually changed.
    ================================================= */

    if (
      name !== undefined &&
      oldName !== specialization.name
    ) {
      const teachers = await User.find({
        role: "TEACHER",
        specializations: oldName,
      });

      for (const teacher of teachers) {
        teacher.specializations =
          teacher.specializations.map(
            (item) =>
              item === oldName
                ? specialization.name
                : item
          );

        await teacher.save();
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Specialization updated successfully",
      specialization,
    });
  } catch (error) {
    console.error(
      "Update Specialization Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating specialization",
    });
  }
};

/* =====================================================
   DEACTIVATE SPECIALIZATION
   ADMIN ONLY

   We DO NOT delete it.

   This protects historical teacher/doubt data.
===================================================== */

const deactivateSpecialization = async (
  req,
  res
) => {
  try {
    const specialization =
      await Specialization.findById(req.params.id);

    if (!specialization) {
      return res.status(404).json({
        success: false,
        message: "Specialization not found",
      });
    }

    specialization.isActive = false;

    await specialization.save();

    return res.status(200).json({
      success: true,
      message:
        "Specialization deactivated successfully",
      specialization,
    });
  } catch (error) {
    console.error(
      "Deactivate Specialization Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deactivating specialization",
    });
  }
};

/* =====================================================
   ACTIVATE SPECIALIZATION
   ADMIN ONLY

   Useful if Admin wants to bring a module back.
===================================================== */

const activateSpecialization = async (
  req,
  res
) => {
  try {
    const specialization =
      await Specialization.findById(req.params.id);

    if (!specialization) {
      return res.status(404).json({
        success: false,
        message: "Specialization not found",
      });
    }

    specialization.isActive = true;

    await specialization.save();

    return res.status(200).json({
      success: true,
      message:
        "Specialization activated successfully",
      specialization,
    });
  } catch (error) {
    console.error(
      "Activate Specialization Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while activating specialization",
    });
  }
};

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
  createSpecialization,
  getAllSpecializations,
  getActiveSpecializations,
  getSpecializationById,
  updateSpecialization,
  deactivateSpecialization,
  activateSpecialization,
};