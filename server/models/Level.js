const logger = require('../utils/logger');
const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Level name is required'],
    unique: true,
    trim: true,
    default: 'General',
    minlength: [2, 'Level name must be at least 2 characters'],
    maxlength: [50, 'Level name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Level description is required'],
    trim: true,
    default: 'General level suitable for all learners',
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  difficulty: {
    type: Number,
    required: [true, 'Difficulty rating is required'],
    default: 1,
    min: [1, 'Difficulty must be at least 1'],
    max: [10, 'Difficulty cannot exceed 10']
  },
  color: {
    type: String,
    required: [true, 'Level color is required'],
    default: '#6B7280',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
  },
  icon: {
    type: String,
    default: 'BookOpen',
    trim: true
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Statistics (virtual fields calculated from other collections)
  courseCount: {
    type: Number,
    default: 0
  },
  studentCount: {
    type: Number,
    default: 0
  },
  instructorCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
levelSchema.index({ name: 1 });
levelSchema.index({ difficulty: 1 });
levelSchema.index({ isActive: 1 });
levelSchema.index({ order: 1 });

// Virtual for courses using this level
levelSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'level',
  count: true
});

// Virtual for students enrolled in courses of this level
levelSchema.virtual('students', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'level',
  populate: {
    path: 'enrolledStudents',
    select: '_id'
  }
});

// Pre-save middleware to handle order
levelSchema.pre('save', async function(next) {
  if (this.isNew && this.order === 0) {
    const maxOrder = await this.constructor.findOne({}, {}, { sort: { order: -1 } });
    this.order = maxOrder ? maxOrder.order + 1 : 1;
  }
  next();
});

// Static method to get level statistics
levelSchema.statics.getLevelStatistics = async function(levelId) {
  const Course = mongoose.model('Course');
  const User = mongoose.model('User');
  
  try {
    // Get courses for this level
    const courses = await Course.find({ level: levelId }).populate('enrolledStudents instructor');
    
    // Calculate statistics
    const courseCount = courses.length;
    const studentIds = new Set();
    const instructorIds = new Set();
    
    courses.forEach(course => {
      // Count unique students
      if (course.enrolledStudents) {
        course.enrolledStudents.forEach(student => {
          studentIds.add(student._id.toString());
        });
      }
      
      // Count unique instructors
      if (course.instructor) {
        instructorIds.add(course.instructor._id.toString());
      }
    });
    
    return {
      courseCount,
      studentCount: studentIds.size,
      instructorCount: instructorIds.size,
      totalEnrollments: courses.reduce((sum, course) => sum + (course.enrolledStudents?.length || 0), 0),
      averageRating: courses.length > 0 ? 
        courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length : 0
    };
  } catch (error) {
    logger.error('Error calculating level statistics:', error);
    return {
      courseCount: 0,
      studentCount: 0,
      instructorCount: 0,
      totalEnrollments: 0,
      averageRating: 0
    };
  }
};

// Static method to update all level statistics
levelSchema.statics.updateAllStatistics = async function() {
  const levels = await this.find({ isActive: true });
  
  for (const level of levels) {
    const stats = await this.getLevelStatistics(level._id);
    await this.findByIdAndUpdate(level._id, {
      courseCount: stats.courseCount,
      studentCount: stats.studentCount,
      instructorCount: stats.instructorCount
    });
  }
};

// Instance method to update statistics for this level
levelSchema.methods.updateStatistics = async function() {
  const stats = await this.constructor.getLevelStatistics(this._id);
  this.courseCount = stats.courseCount;
  this.studentCount = stats.studentCount;
  this.instructorCount = stats.instructorCount;
  await this.save();
  return stats;
};

// Static method to get levels with statistics
levelSchema.statics.getLevelsWithStats = async function(filter = {}) {
  const levels = await this.find(filter)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('prerequisites', 'name difficulty')
    .sort({ order: 1, difficulty: 1 });
  
  // Get statistics for each level
  const levelsWithStats = await Promise.all(
    levels.map(async (level) => {
      const stats = await this.getLevelStatistics(level._id);
      return {
        ...level.toObject(),
        ...stats
      };
    })
  );
  
  return levelsWithStats;
};

module.exports = mongoose.model('Level', levelSchema);
