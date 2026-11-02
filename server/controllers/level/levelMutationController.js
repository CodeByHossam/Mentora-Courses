const logger = require('../../utils/logger');
const Level = require("../../models/Level");
const Course = require("../../models/Course");
const User = require("../../models/User");
const { validationResult } = require("express-validator");

/**
 * @desc    Update level
 * @route   PUT /api/levels/:id
 * @access  Private (Admin/Instructor - own levels only for instructors)
 */

const updateLevel = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
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

    const level = await Level.findById(id);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    // Check permissions - instructors can only update their own levels
    if (
      req.user.role === "instructor" &&
      level.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update levels you created.",
      });
    }

    // Check if new name conflicts with existing level (excluding current level)
    if (name && name !== level.name) {
      const existingLevel = await Level.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: id },
      });

      if (existingLevel) {
        return res.status(400).json({
          success: false,
          message: "A level with this name already exists",
        });
      }
    }

    // Update fields
    if (name) level.name = name.trim();
    if (description) level.description = description.trim();
    if (difficulty !== undefined) level.difficulty = difficulty;
    if (color) level.color = color;
    if (icon) level.icon = icon;
    if (prerequisites !== undefined) level.prerequisites = prerequisites;
    if (isActive !== undefined) level.isActive = isActive;
    if (order !== undefined) level.order = order;
    level.updatedBy = req.user._id;

    await level.save();

    // Populate the updated level
    await level.populate("createdBy", "name email role");
    await level.populate("updatedBy", "name email role");
    await level.populate("prerequisites", "name difficulty color");

    logger.info(`✅ Level updated: ${level.name} by ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: "Level updated successfully",
      data: level,
    });
  } catch (error) {
    logger.error("❌ Error updating level:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A level with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update level",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};

/**
 * @desc    Delete level
 * @route   DELETE /api/levels/:id
 * @access  Private (Admin only)
 */

const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;

    const level = await Level.findById(id);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    // Check if level is being used by any courses
    const coursesUsingLevel = await Course.countDocuments({ level: id });

    if (coursesUsingLevel > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete level. It is currently being used by ${coursesUsingLevel} course(s). Please reassign these courses to another level first.`,
      });
    }

    await Level.findByIdAndDelete(id);

    logger.info(`🗑️ Level deleted: ${level.name} by ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: "Level deleted successfully",
    });
  } catch (error) {
    logger.error("❌ Error deleting level:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete level",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};

/**
 * @desc    Get level statistics
 * @route   GET /api/levels/:id/statistics
 * @access  Public
 */

const reorderLevels = async (req, res) => {
  try {
    const { levelOrders } = req.body; // Array of { id, order }

    if (!Array.isArray(levelOrders)) {
      return res.status(400).json({
        success: false,
        message: "levelOrders must be an array",
      });
    }

    // Update each level's order
    const updatePromises = levelOrders.map(({ id, order }) =>
      Level.findByIdAndUpdate(id, { order, updatedBy: req.user._id })
    );

    await Promise.all(updatePromises);

    logger.info(`🔄 Level order updated by ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: "Level order updated successfully",
    });
  } catch (error) {
    logger.error("❌ Error reordering levels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder levels",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};

/**
 * @desc    Get levels dashboard data
 * @route   GET /api/levels/dashboard
 * @access  Private (Admin/Instructor)
 */


module.exports = {
  updateLevel,
  deleteLevel,
  reorderLevels
};
