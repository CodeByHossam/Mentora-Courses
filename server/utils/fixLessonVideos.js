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
    console.log('📊 Connected to MongoDB');

    // Find lessons that might have video issues
    const lessons = await Lesson.find({});
    console.log(`🔍 Found ${lessons.length} lessons to check`);

    let fixedCount = 0;
    let issuesFound = 0;

    for (const lesson of lessons) {
      console.log(`\n📝 Checking lesson: ${lesson.title} (ID: ${lesson._id})`);
      
      // Check if lesson has any video-related fields
      const hasVideoUrl = lesson.video || lesson.videoUrl;
      const hasVideoRef = lesson.videoRef?.publicId;
      
      console.log(`  - Has video URL: ${!!hasVideoUrl}`);
      console.log(`  - Has videoRef.publicId: ${!!hasVideoRef}`);
      console.log(`  - VideoRef structure:`, lesson.videoRef);

      // Case 1: Has old video URL but no videoRef
      if (hasVideoUrl && !hasVideoRef) {
        console.log(`  ⚠️  Issue found: Lesson has video URL but no videoRef.publicId`);
        console.log(`  📹 Video URL: ${hasVideoUrl}`);
        
        // Try to extract Cloudinary public ID from URL
        const publicIdMatch = hasVideoUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        if (publicIdMatch) {
          const publicId = publicIdMatch[1];
          console.log(`  🔧 Extracted publicId: ${publicId}`);
          
          // Update lesson with proper videoRef structure
          await Lesson.findByIdAndUpdate(lesson._id, {
            videoRef: {
              publicId: publicId,
              resourceType: 'video',
              uploadedAt: lesson.createdAt || new Date()
            }
          });
          
          console.log(`  ✅ Fixed lesson videoRef`);
          fixedCount++;
        } else {
          console.log(`  ❌ Could not extract publicId from URL`);
          issuesFound++;
        }
      }
      
      // Case 2: No video at all
      else if (!hasVideoUrl && !hasVideoRef) {
        console.log(`  ℹ️  No video content found (this is normal for text-only lessons)`);
      }
      
      // Case 3: Already has proper videoRef
      else if (hasVideoRef) {
        console.log(`  ✅ Lesson already has proper videoRef structure`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  - Total lessons checked: ${lessons.length}`);
    console.log(`  - Lessons fixed: ${fixedCount}`);
    console.log(`  - Issues that need manual attention: ${issuesFound}`);
    
    if (fixedCount > 0) {
      console.log(`\n🎉 Successfully fixed ${fixedCount} lessons!`);
    }
    
    if (issuesFound > 0) {
      console.log(`\n⚠️  ${issuesFound} lessons need manual attention. Check the logs above.`);
    }

  } catch (error) {
    console.error('❌ Error fixing lesson videos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
};

// Run the script if called directly
if (require.main === module) {
  fixLessonVideos();
}

module.exports = fixLessonVideos;
