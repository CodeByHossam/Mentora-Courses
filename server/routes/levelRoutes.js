const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getLevels,
  getLevel,
  createLevel,
  updateLevel,
  deleteLevel,
  getLevelStatistics,
  reorderLevels,
  getLevelsDashboard
} = require('../controllers/levelController');

// Validation middleware
const validateLevel = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Level name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Level name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('difficulty')
    .isInt({ min: 1, max: 10 })
    .withMessage('Difficulty must be a number between 1 and 10'),
  
  body('color')
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  
  body('icon')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Icon name must be between 1 and 50 characters'),
  
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array'),
  
  body('prerequisites.*')
    .optional()
    .isMongoId()
    .withMessage('Each prerequisite must be a valid level ID'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

const validateLevelUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Level name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Level name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('difficulty')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Difficulty must be a number between 1 and 10'),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  
  body('icon')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Icon name must be between 1 and 50 characters'),
  
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array'),
  
  body('prerequisites.*')
    .optional()
    .isMongoId()
    .withMessage('Each prerequisite must be a valid level ID'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

const validateReorder = [
  body('levelOrders')
    .isArray({ min: 1 })
    .withMessage('levelOrders must be a non-empty array'),
  
  body('levelOrders.*.id')
    .isMongoId()
    .withMessage('Each level ID must be valid'),
  
  body('levelOrders.*.order')
    .isInt({ min: 0 })
    .withMessage('Each order must be a non-negative integer')
];

/**
 * @route   GET /api/levels
 * @desc    Get all levels with statistics
 * @access  Private (Admin/Instructor)
 */
router.get('/', protect, authorize(['admin', 'instructor']), getLevels);

/**
 * @route   GET /api/levels/dashboard
 * @desc    Get levels dashboard data
 * @access  Private (Admin/Instructor)
 */
router.get('/dashboard', protect, authorize(['admin', 'instructor']), getLevelsDashboard);

/**
 * @route   GET /api/levels/:id
 * @desc    Get single level by ID with statistics
 * @access  Public
 */
router.get('/:id', getLevel);

/**
 * @route   GET /api/levels/:id/statistics
 * @desc    Get level statistics
 * @access  Public
 */
router.get('/:id/statistics', getLevelStatistics);

/**
 * @route   POST /api/levels
 * @desc    Create new level
 * @access  Private (Admin/Instructor)
 */
router.post('/', protect, (req, res, next) => {
  console.log('🔍 Level creation - User:', req.user?.name, 'Role:', req.user?.role);
  next();
}, authorize(['admin', 'instructor']), validateLevel, createLevel);

/**
 * @route   PUT /api/levels/:id
 * @desc    Update level
 * @access  Private (Admin/Instructor - own levels only for instructors)
 */
router.put('/:id', protect, authorize(['admin', 'instructor']), validateLevelUpdate, updateLevel);

/**
 * @route   PUT /api/levels/reorder
 * @desc    Update level order
 * @access  Private (Admin only)
 */
router.put('/reorder', protect, authorize(['admin']), validateReorder, reorderLevels);

/**
 * @route   DELETE /api/levels/:id
 * @desc    Delete level
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, authorize(['admin']), deleteLevel);

module.exports = router;
