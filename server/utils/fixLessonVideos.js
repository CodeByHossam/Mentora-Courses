const logger = require('./logger');
const mongoose = require('mongoose');
const Lesson = require('../models/lessonModel');
require('dotenv').config();

/**
 * Utility script to fix lessons that have video URLs but no proper videoRef structure
 * This handles lessons created before the new video security system
 */

const fixLessonVideos = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('📊 Connected to MongoDB');

    // Find lessons that might have video issues
    const lessons = await Lesson.find({});
    logger.info(`🔍 Found ${lessons.length} lessons to check`);

    let fixedCount = 0;
    let issuesFound = 0;

    for (const lesson of lessons) {
      logger.info(`\n📝 Checking lesson: ${lesson.title} (ID: ${lesson._id})`);
      
      // Check if lesson has any video-related fields
      const hasVideoUrl = lesson.video || lesson.videoUrl;
      const hasVideoRef = lesson.videoRef?.publicId;
      
      logger.info(`  - Has video URL: ${!!hasVideoUrl}`);
      logger.info(`  - Has videoRef.publicId: ${!!hasVideoRef}`);
      logger.info(`  - VideoRef structure:`, lesson.videoRef);

      // Case 1: Has old video URL but no videoRef
      if (hasVideoUrl && !hasVideoRef) {
        logger.info(`  ⚠️  Issue found: Lesson has video URL but no videoRef.publicId`);
        logger.info(`  📹 Video URL: ${hasVideoUrl}`);
        
        // Try to extract Cloudinary public ID from URL
        const publicIdMatch = hasVideoUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        if (publicIdMatch) {
          const publicId = publicIdMatch[1];
          logger.info(`  🔧 Extracted publicId: ${publicId}`);
          
          // Update lesson with proper videoRef structure
          await Lesson.findByIdAndUpdate(lesson._id, {
            videoRef: {
              publicId: publicId,
              resourceType: 'video',
              uploadedAt: lesson.createdAt || new Date()
            }
          });
          
          logger.info(`  ✅ Fixed lesson videoRef`);
          fixedCount++;
        } else {
          logger.info(`  ❌ Could not extract publicId from URL`);
          issuesFound++;
        }
      }
      
      // Case 2: No video at all
      else if (!hasVideoUrl && !hasVideoRef) {
        logger.info(`  ℹ️  No video content found (this is normal for text-only lessons)`);
      }
      
      // Case 3: Already has proper videoRef
      else if (hasVideoRef) {
        logger.info(`  ✅ Lesson already has proper videoRef structure`);
      }
    }

    logger.info(`\n📊 Summary:`);
    logger.info(`  - Total lessons checked: ${lessons.length}`);
    logger.info(`  - Lessons fixed: ${fixedCount}`);
    logger.info(`  - Issues that need manual attention: ${issuesFound}`);
    
    if (fixedCount > 0) {
      logger.info(`\n🎉 Successfully fixed ${fixedCount} lessons!`);
    }
    
    if (issuesFound > 0) {
      logger.info(`\n⚠️  ${issuesFound} lessons need manual attention. Check the logs above.`);
    }

  } catch (error) {
    logger.error('❌ Error fixing lesson videos:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('📊 Disconnected from MongoDB');
  }
};

// Run the script if called directly
if (require.main === module) {
  fixLessonVideos();
}

module.exports = fixLessonVideos;
