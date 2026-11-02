const logger = require('../../utils/logger');
const Level = require("../../models/Level");
const Course = require("../../models/Course");
const User = require("../../models/User");
const { validationResult } = require("express-validator");

/**
 * Ensure General level exists in database
 */

const getLevels = async (req, res) => {
  try {
    // Ensure General level exists
    await ensureGeneralLevel();

    const {
      page = 1,
      limit = 20,
      search = "",
      isActive = "all",
      sortBy = "order",
      sortOrder = "asc",
    } = req.query;

    // Build filter
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== "all") {
      filter.isActive = isActive === "true";
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get levels with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const levels = await Level.find(filter)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .populate("prerequisites", "name difficulty color")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get statistics for each level
    const levelsWithStats = await Promise.all(
      levels.map(async (level) => {
        const stats = await Level.getLevelStatistics(level._id);
        return {
          ...level.toObject(),
          ...stats,
        };
      })
    );

    // Get total count for pagination
    const totalLevels = await Level.countDocuments(filter);
    const totalPages = Math.ceil(totalLevels / parseInt(limit));

    logger.info(
      `📊 Retrieved ${levels.length} levels (page ${page}/${totalPages})`
    );

    res.status(200).json({
      success: true,
      message: "Levels retrieved successfully",
      data: {
        levels: levelsWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalLevels,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error("❌ Error getting levels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve levels",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};

/**
 * @desc    Get single level by ID with statistics
 * @route   GET /api/levels/:id
 * @access  Public
 */

const getLevel = async (req, res) => {
  try {
    const { id } = req.params;

    const level = await Level.findById(id)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .populate("prerequisites", "name difficulty color");

    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    // Get detailed statistics
    const stats = await Level.getLevelStatistics(level._id);

    // Get courses for this level
    const courses = await Course.find({ level: level._id })
      .populate("instructor", "name email")
      .select("title description rating enrolledStudents createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    const levelWithDetails = {
      ...level.toObject(),
      ...stats,
      recentCourses: courses,
    };

    logger.info(
      `📖 Retrieved level: ${level.name} with ${stats.courseCount} courses`
    );

    res.status(200).json({
      success: true,
      message: "Level retrieved successfully",
      data: levelWithDetails,
    });
  } catch (error) {
    logger.error("❌ Error getting level:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve level",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};

/**
 * @desc    Create new level
 * @route   POST /api/levels
 * @access  Private (Admin/Instructor)
 */

const getLevelStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    const level = await Level.findById(id);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    const stats = await Level.getLevelStatistics(id);

    logger.info(`📊 Retrieved statistics for level: ${level.name}`);

    res.status(200).json({
      success: true,
      message: "Level statistics retrieved successfully",
      data: {
        levelId: id,
        levelName: level.name,
        ...stats,
      },
    });
  } catch (error) {
    logger.error("❌ Error getting level statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve level statistics",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};

/**
 * @desc    Update level order
 * @route   PUT /api/levels/reorder
 * @access  Private (Admin only)
 */

const getLevelsDashboard = async (req, res) => {
  try {
    // Ensure General level exists
    await ensureGeneralLevel();

    // Get basic counts
    const totalLevels = await Level.countDocuments();
    const activeLevels = await Level.countDocuments({ isActive: true });
    const inactiveLevels = await Level.countDocuments({ isActive: false });

    // Get levels with most courses
    const levelsWithStats = await Level.getLevelsWithStats({ isActive: true });
    const topLevelsByCourses = levelsWithStats
      .sort((a, b) => b.courseCount - a.courseCount)
      .slice(0, 5);

    // Get levels with most students
    const topLevelsByStudents = levelsWithStats
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 5);

    // Get recent levels
    const recentLevels = await Level.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    const dashboardData = {
      overview: {
        totalLevels,
        activeLevels,
        inactiveLevels,
        totalCourses: levelsWithStats.reduce(
          (sum, level) => sum + level.courseCount,
          0
        ),
        totalStudents: levelsWithStats.reduce(
          (sum, level) => sum + level.studentCount,
          0
        ),
      },
      topLevelsByCourses,
      topLevelsByStudents,
      recentLevels,
    };

    logger.info(`📊 Retrieved levels dashboard data`);

    res.status(200).json({
      success: true,
      message: "Levels dashboard data retrieved successfully",
      data: dashboardData,
    });
  } catch (error) {
    logger.error("❌ Error getting levels dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve levels dashboard data",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};

module.exports = {
  getLevels,
  getLevel,
  getLevelStatistics,
  getLevelsDashboard
};
