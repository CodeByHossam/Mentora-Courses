const mongoose = require('mongoose');
const Lesson = require('../models/lessonModel');
const videoService = require('../services/videoService');
const { uploadToCloudinary } = require('../utils/cloudinary');

/**
 * VideoMigration Class
 * 
 * Handles migration of legacy video URL structure to new videoRef structure.
 * This migration converts direct Cloudinary URLs stored in 'videoUrl' field
 * to structured video references with metadata in 'videoRef' field.
 * 
 * Features:
 * - Batch processing to prevent system overload
 * - Rollback capability for safe migration reversal
 * - Comprehensive error tracking and reporting
 * - Skip already migrated lessons to prevent duplicate processing
 * 
 * Usage:
 * - Run migration: node videoMigration.js
 * - Rollback migration: node videoMigration.js rollback
 */
class VideoMigration {
  /**
   * Initialize migration instance with tracking counters
   */
  constructor() {
    this.processedCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
    this.batchSize = 10; // Process lessons in batches to avoid overwhelming the system
    this.batchDelay = 1000; // Delay between batches in milliseconds
  }

  /**
   * Extract Cloudinary public ID and format from legacy video URL
   * 
   * Parses Cloudinary URLs to extract the public ID and file format.
   * Supports both versioned and non-versioned URL formats.
   * 
   * @param {string} url - The Cloudinary video URL to parse
   * @returns {Object|null} Object containing publicId and format, or null if parsing fails
   * 
   * @example
   * // Input: "https://res.cloudinary.com/demo/video/upload/v1234567890/sample.mp4"
   * // Output: { publicId: "sample", format: "mp4" }
   */
  extractPublicIdFromUrl(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }
    
    try {
      // Regex pattern to match Cloudinary URL structure:
      // - Matches optional version number (v\d+/)
      // - Captures public ID (everything before the last dot)
      // - Captures file format (extension after the last dot)
      const cloudinaryUrlPattern = /\/upload\/(?:v\d+\/)?(.+?)\.([a-z0-9]+)(?:\?|$)/i;
      const match = url.match(cloudinaryUrlPattern);
      
      if (match && match[1] && match[2]) {
        return {
          publicId: match[1],
          format: match[2].toLowerCase()
        };
      }
      
      console.warn(`Invalid Cloudinary URL format: ${url}`);
      return null;
    } catch (error) {
      console.error('Error extracting public ID from URL:', url, error.message);
      return null;
    }
  }

  /**
   * Generate video metadata structure for migration
   * 
   * Creates a standardized videoRef object with metadata placeholders.
   * In a production environment, this would fetch actual metadata from Cloudinary Admin API.
   * 
   * @param {string} publicId - The Cloudinary public ID of the video
   * @param {string} format - The video file format (e.g., 'mp4', 'webm')
   * @returns {Promise<Object|null>} Video metadata object or null if error occurs
   */
  async generateVideoMetadata(publicId, format = 'mp4') {
    if (!publicId) {
      console.error('Public ID is required for video metadata generation');
      return null;
    }

    try {
      // TODO: In production, implement Cloudinary Admin API call to fetch real metadata
      // const cloudinaryAdmin = require('cloudinary').v2;
      // const metadata = await cloudinaryAdmin.api.resource(publicId, { resource_type: 'video' });
      
      return {
        publicId,
        resourceType: 'video',
        format: format.toLowerCase(),
        // Placeholder values - would be populated from Cloudinary API response
        duration: null,
        bytes: null,
        width: null,
        height: null,
        uploadedAt: new Date(),
        // Additional metadata for future use
        quality: 'auto',
        secure: true
      };
    } catch (error) {
      console.error(`Error generating video metadata for ${publicId}:`, error.message);
      return null;
    }
  }

  /**
   * Migrate a single lesson's video URL to videoRef structure
   * 
   * Processes one lesson at a time, converting legacy videoUrl field to structured videoRef.
   * Includes comprehensive error handling and validation.
   * 
   * @param {Object} lesson - The lesson document to migrate
   * @returns {Promise<Object>} Migration result with success status and details
   */
  async migrateLessonVideo(lesson) {
    if (!lesson || !lesson._id) {
      console.error('Invalid lesson object provided for migration');
      this.errorCount++;
      return { success: false, error: 'Invalid lesson object' };
    }

    try {
      // Skip lessons that are already migrated or have no video URL
      const isAlreadyMigrated = lesson.videoRef?.publicId;
      const hasVideoUrl = lesson.videoUrl && lesson.videoUrl.trim();

      if (isAlreadyMigrated || !hasVideoUrl) {
        this.skippedCount++;
        const reason = isAlreadyMigrated ? 'already migrated' : 'no video URL';
        console.log(`⏭️  Skipping lesson "${lesson.title}" (${lesson._id}): ${reason}`);
        return { success: true, skipped: true, reason };
      }

      console.log(`🔄 Migrating lesson: "${lesson.title}" (${lesson._id})`);

      // Extract public ID and format from existing URL
      const urlInfo = this.extractPublicIdFromUrl(lesson.videoUrl);
      if (!urlInfo) {
        const errorMsg = `Invalid Cloudinary URL format: ${lesson.videoUrl}`;
        console.warn(`⚠️  ${errorMsg}`);
        this.errorCount++;
        return { success: false, error: errorMsg };
      }

      // Generate video metadata structure
      const videoRef = await this.generateVideoMetadata(urlInfo.publicId, urlInfo.format);
      if (!videoRef) {
        const errorMsg = 'Failed to generate video metadata';
        console.error(`❌ ${errorMsg} for lesson ${lesson._id}`);
        this.errorCount++;
        return { success: false, error: errorMsg };
      }

      // Update lesson document with new videoRef structure and remove old videoUrl
      const updateResult = await Lesson.findByIdAndUpdate(
        lesson._id,
        {
          videoRef,
          $unset: { videoUrl: 1 } // Remove legacy videoUrl field
        },
        { new: true, runValidators: true }
      );

      if (!updateResult) {
        const errorMsg = 'Failed to update lesson document';
        console.error(`❌ ${errorMsg} for lesson ${lesson._id}`);
        this.errorCount++;
        return { success: false, error: errorMsg };
      }

      this.processedCount++;
      console.log(`✅ Successfully migrated lesson: "${lesson.title}"`);
      
      return { 
        success: true, 
        videoRef,
        lessonId: lesson._id,
        lessonTitle: lesson.title
      };

    } catch (error) {
      const errorMsg = `Migration failed for lesson ${lesson._id}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.errorCount++;
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Execute the complete video URL to videoRef migration process
   * 
   * Orchestrates the entire migration workflow including:
   * - Finding lessons that need migration
   * - Processing lessons in manageable batches
   * - Providing comprehensive progress reporting
   * - Error handling and recovery
   * 
   * @returns {Promise<void>} Resolves when migration is complete
   */
  async runMigration() {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting video URL to videoRef migration...');
      console.log(`📋 Configuration: Batch size: ${this.batchSize}, Batch delay: ${this.batchDelay}ms\n`);
      
      // Find all lessons that need migration
      const migrationQuery = {
        $or: [
          // Lessons with videoUrl but no videoRef
          { 
            videoUrl: { $exists: true, $ne: null, $ne: '' },
            'videoRef.publicId': { $exists: false }
          },
          // Lessons with videoUrl and incomplete videoRef (safety check)
          {
            videoUrl: { $exists: true, $ne: null, $ne: '' },
            $or: [
              { videoRef: { $exists: false } },
              { 'videoRef.publicId': { $exists: false } }
            ]
          }
        ]
      };

      const lessons = await Lesson.find(migrationQuery).select('_id title videoUrl videoRef');
      
      console.log(`📊 Found ${lessons.length} lessons requiring migration`);

      if (lessons.length === 0) {
        console.log('✅ No lessons need migration - all videos are already using the new structure');
        return;
      }

      // Process lessons in batches to prevent system overload
      const totalBatches = Math.ceil(lessons.length / this.batchSize);
      
      for (let i = 0; i < lessons.length; i += this.batchSize) {
        const batch = lessons.slice(i, i + this.batchSize);
        const currentBatch = Math.floor(i / this.batchSize) + 1;
        
        console.log(`\n📦 Processing batch ${currentBatch}/${totalBatches} (${batch.length} lessons)`);
        
        // Process batch lessons in parallel for efficiency
        const batchPromises = batch.map(lesson => this.migrateLessonVideo(lesson));
        await Promise.all(batchPromises);
        
        // Add delay between batches to prevent overwhelming the database
        if (currentBatch < totalBatches) {
          console.log(`⏳ Waiting ${this.batchDelay}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, this.batchDelay));
        }
      }

      // Calculate and display comprehensive migration summary
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      console.log('\n' + '='.repeat(50));
      console.log('📊 MIGRATION SUMMARY');
      console.log('='.repeat(50));
      console.log(`✅ Successfully migrated: ${this.processedCount} lessons`);
      console.log(`⏭️  Skipped (already migrated): ${this.skippedCount} lessons`);
      console.log(`❌ Failed migrations: ${this.errorCount} lessons`);
      console.log(`📝 Total lessons processed: ${lessons.length}`);
      console.log(`⏱️  Total duration: ${duration} seconds`);
      
      if (this.errorCount > 0) {
        console.log('\n⚠️  WARNING: Some lessons failed to migrate.');
        console.log('   Please review the error messages above and fix any issues.');
        console.log('   You can safely re-run this migration to process failed lessons.');
      } else {
        console.log('\n🎉 Migration completed successfully!');
        console.log('   All video URLs have been converted to the new videoRef structure.');
      }

    } catch (error) {
      console.error('\n❌ MIGRATION FAILED');
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * Rollback migration by restoring videoUrl from videoRef structure
   * 
   * Reverses the migration process by converting videoRef objects back to direct URLs.
   * This provides a safety mechanism in case the migration needs to be undone.
   * 
   * @returns {Promise<void>} Resolves when rollback is complete
   */
  async rollbackMigration() {
    const startTime = Date.now();
    let rollbackCount = 0;
    let rollbackErrors = 0;

    try {
      console.log('🔄 Starting migration rollback...');
      console.log('⚠️  WARNING: This will convert videoRef structures back to direct URLs\n');
      
      // Find all lessons with videoRef structure
      const lessons = await Lesson.find({
        'videoRef.publicId': { $exists: true }
      }).select('_id title videoRef');

      console.log(`📊 Found ${lessons.length} lessons to rollback`);

      if (lessons.length === 0) {
        console.log('✅ No lessons need rollback - no videoRef structures found');
        return;
      }

      // Validate environment configuration
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        throw new Error('CLOUDINARY_CLOUD_NAME environment variable is required for rollback');
      }

      // Process each lesson for rollback
      for (const lesson of lessons) {
        try {
          if (!lesson.videoRef?.publicId) {
            console.warn(`⚠️  Skipping lesson "${lesson.title}": Invalid videoRef structure`);
            continue;
          }

          // Reconstruct Cloudinary URL from videoRef
          const { publicId, format = 'mp4' } = lesson.videoRef;
          const videoUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/${publicId}.${format}`;
          
          // Update lesson with restored videoUrl and remove videoRef
          const updateResult = await Lesson.findByIdAndUpdate(
            lesson._id,
            {
              videoUrl,
              $unset: { videoRef: 1 }
            },
            { new: true, runValidators: true }
          );

          if (updateResult) {
            rollbackCount++;
            console.log(`✅ Rolled back lesson: "${lesson.title}" -> ${videoUrl}`);
          } else {
            rollbackErrors++;
            console.error(`❌ Failed to rollback lesson: "${lesson.title}"`);
          }

        } catch (lessonError) {
          rollbackErrors++;
          console.error(`❌ Error rolling back lesson "${lesson.title}":`, lessonError.message);
        }
      }

      // Display rollback summary
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log('\n' + '='.repeat(50));
      console.log('📊 ROLLBACK SUMMARY');
      console.log('='.repeat(50));
      console.log(`✅ Successfully rolled back: ${rollbackCount} lessons`);
      console.log(`❌ Rollback errors: ${rollbackErrors} lessons`);
      console.log(`📝 Total lessons processed: ${lessons.length}`);
      console.log(`⏱️  Total duration: ${duration} seconds`);

      if (rollbackErrors > 0) {
        console.log('\n⚠️  WARNING: Some lessons failed to rollback.');
        console.log('   Please review the error messages above.');
      } else {
        console.log('\n🎉 Rollback completed successfully!');
        console.log('   All videoRef structures have been converted back to direct URLs.');
      }

    } catch (error) {
      console.error('\n❌ ROLLBACK FAILED');
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }
}

/**
 * Command Line Interface (CLI) for Video Migration
 * 
 * Provides a simple command-line interface to run the migration script.
 * Handles database connection, command parsing, and graceful error handling.
 * 
 * Usage:
 *   node videoMigration.js          - Run forward migration
 *   node videoMigration.js rollback - Run rollback migration
 */
if (require.main === module) {
  const mongoose = require('mongoose');
  const connectDB = require('../config/db');
  
  /**
   * Main execution function for CLI
   * Handles database connection and command routing
   */
  const executeCliCommand = async () => {
    let isConnected = false;
    
    try {
      // Connect to database
      console.log('🔌 Connecting to database...');
      await connectDB();
      isConnected = true;
      console.log('✅ Database connected successfully\n');
      
      // Parse command line arguments
      const command = process.argv[2];
      const validCommands = ['rollback'];
      
      // Initialize migration instance
      const migration = new VideoMigration();
      
      // Execute appropriate command
      if (command === 'rollback') {
        console.log('📋 Command: Rollback migration\n');
        await migration.rollbackMigration();
      } else if (command && !validCommands.includes(command)) {
        console.error(`❌ Invalid command: "${command}"`);
        console.log('Valid commands:');
        console.log('  node videoMigration.js          - Run forward migration');
        console.log('  node videoMigration.js rollback - Run rollback migration');
        process.exit(1);
      } else {
        console.log('📋 Command: Forward migration\n');
        await migration.runMigration();
      }
      
      // Graceful shutdown
      console.log('\n🔌 Closing database connection...');
      await mongoose.connection.close();
      console.log('✅ Migration script completed successfully');
      process.exit(0);
      
    } catch (error) {
      console.error('\n❌ MIGRATION SCRIPT FAILED');
      console.error('Error:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Stack trace:', error.stack);
      }
      
      // Ensure database connection is closed on error
      if (isConnected) {
        try {
          await mongoose.connection.close();
          console.log('🔌 Database connection closed');
        } catch (closeError) {
          console.error('Error closing database connection:', closeError.message);
        }
      }
      
      process.exit(1);
    }
  };
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
  
  // Execute the CLI command
  executeCliCommand();
}

module.exports = VideoMigration;
