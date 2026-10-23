const Level = require("../models/Level");
const Course = require("../models/Course");
const User = require("../models/User");
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
        console.log("✅ Created default General level");
      }
    }
  } catch (error) {
    console.error("❌ Error ensuring General level:", error);
  }
};

/**
 * @desc    Get all levels with statistics
 * @route   GET /api/levels
 * @access  Public
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

    console.log(
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
    console.error("❌ Error getting levels:", error);
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

    console.log(
      `📖 Retrieved level: ${level.name} with ${stats.courseCount} courses`
    );

    res.status(200).json({
      success: true,
      message: "Level retrieved successfully",
      data: levelWithDetails,
    });
  } catch (error) {
    console.error("❌ Error getting level:", error);
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
const createLevel = async (req, res) => {
  try {
    console.log("🔍 CREATE LEVEL - Request received");
    console.log("🔍 User:", req.user?.name, "Role:", req.user?.role);
    console.log("🔍 Request body:", req.body);

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
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

    console.log(`✅ Level created: ${level.name} by ${req.user.name}`);

    res.status(201).json({
      success: true,
      message: "Level created successfully",
      data: level,
    });
  } catch (error) {
    console.error("❌ Error creating level:", error);

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

    console.log(`✅ Level updated: ${level.name} by ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: "Level updated successfully",
      data: level,
    });
  } catch (error) {
    console.error("❌ Error updating level:", error);

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

    console.log(`🗑️ Level deleted: ${level.name} by ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: "Level deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting level:", error);
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

    console.log(`📊 Retrieved statistics for level: ${level.name}`);

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
    console.error("❌ Error getting level statistics:", error);
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

    console.log(`🔄 Level order updated by ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: "Level order updated successfully",
    });
  } catch (error) {
    console.error("❌ Error reordering levels:", error);
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

    console.log(`📊 Retrieved levels dashboard data`);

    res.status(200).json({
      success: true,
      message: "Levels dashboard data retrieved successfully",
      data: dashboardData,
    });
  } catch (error) {
    console.error("❌ Error getting levels dashboard:", error);
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
  createLevel,
  updateLevel,
  deleteLevel,
  getLevelStatistics,
  reorderLevels,
  getLevelsDashboard,
};
