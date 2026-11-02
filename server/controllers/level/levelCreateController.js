const logger = require('../../utils/logger');
const Level = require("../../models/Level");
const Course = require("../../models/Course");
const User = require("../../models/User");
const { validationResult } = require("express-validator");

/**
 * Ensure General level exists in database
 */

const ensureGeneralLevel = async () => {
  try {
    const generalLevel = await Level.findOne({ name: "General" });

    if (!generalLevel) {
      // Find an admin user to assign as creator
      const adminUser = await User.findOne({ role: "admin" });

      if (adminUser) {
        await Level.create({
          name: "General",
          description: "General level suitable for all learners",
          difficulty: 1,
          color: "#6B7280",
          icon: "BookOpen",
          order: 0,
          isActive: true,
          createdBy: adminUser._id,
        });
        logger.info("✅ Created default General level");
      }
    }
  } catch (error) {
    logger.error("❌ Error ensuring General level:", error);
  }
};

/**
 * @desc    Get all levels with statistics
 * @route   GET /api/levels
 * @access  Public
 */

const createLevel = async (req, res) => {
  try {
    logger.info("🔍 CREATE LEVEL - Request received");
    logger.info("🔍 User:", req.user?.name, "Role:", req.user?.role);
    logger.info("🔍 Request body:", req.body);

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.info("❌ Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      name,
      description,
      difficulty,
      color,
      icon,
      prerequisites,
      isActive,
      order,
    } = req.body;

    // Check if level name already exists
    const existingLevel = await Level.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingLevel) {
      return res.status(400).json({
        success: false,
        message: "A level with this name already exists",
      });
    }

    // Create new level
    const level = new Level({
      name: name.trim(),
      description: description.trim(),
      difficulty,
      color,
      icon: icon || "BookOpen",
      prerequisites: prerequisites || [],
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      createdBy: req.user._id,
    });

    await level.save();

    // Populate the created level
    await level.populate("createdBy", "name email role");
    await level.populate("prerequisites", "name difficulty color");

    logger.info(`✅ Level created: ${level.name} by ${req.user.name}`);

    res.status(201).json({
      success: true,
      message: "Level created successfully",
      data: level,
    });
  } catch (error) {
    logger.error("❌ Error creating level:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A level with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create level",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};


module.exports = {
  createLevel
};
