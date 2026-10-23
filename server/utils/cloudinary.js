/**
 * Cloudinary Utility Module
 * 
 * Provides utilities for file upload, deletion, and management using Cloudinary service.
 * Handles various file types including images, videos, audio, and documents.
 * 
 * Features:
 * - Secure file upload with validation
 * - Resource type detection based on MIME types
 * - Comprehensive error handling and logging
 * - Support for both buffer and file path uploads
 * - Optimized upload configurations
 */

const cloudinary = require("cloudinary").v2;

// Validate required environment variables
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_API_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required Cloudinary environment variables: ${missingEnvVars.join(', ')}. ` +
    'Please ensure these are set in your .env file.'
  );
}

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Force HTTPS URLs
});

/**
 * Determine Cloudinary resource type based on file MIME type
 * 
 * Maps MIME types to appropriate Cloudinary resource types for proper handling
 * and optimization during upload and delivery.
 * 
 * @param {string} mimetype - The MIME type of the file
 * @returns {string} Cloudinary resource type ('image', 'video', or 'raw')
 * 
 * @example
 * getResourceType('image/jpeg') // returns 'image'
 * getResourceType('video/mp4')  // returns 'video'
 * getResourceType('application/pdf') // returns 'raw'
 */
const getResourceType = (mimetype) => {
  if (!mimetype || typeof mimetype !== 'string') {
    console.warn('Invalid MIME type provided, defaulting to raw resource type');
    return "raw";
  }

  const mimeTypeLower = mimetype.toLowerCase();

  // Image files
  if (mimeTypeLower.startsWith("image/")) {
    return "image";
  }
  
  // Video files
  if (mimeTypeLower.startsWith("video/")) {
    return "video";
  }
  
  // Audio files (Cloudinary treats audio as 'video' resource type)
  if (mimeTypeLower.startsWith("audio/")) {
    return "video";
  }
  
  // All other files (documents, archives, etc.)
  return "raw";
};

/**
 * Upload file to Cloudinary with comprehensive error handling
 * 
 * Supports both buffer uploads (from memory) and file path uploads (from disk).
 * Provides optimized upload configurations based on resource type.
 * 
 * @param {Buffer|string} fileInput - File buffer or file path to upload
 * @param {string} folder - Cloudinary folder path for organization
 * @param {string} resourceType - Cloudinary resource type ('auto', 'image', 'video', 'raw')
 * @returns {Promise<Object>} Cloudinary upload result with secure_url, public_id, etc.
 * 
 * @example
 * // Upload buffer
 * const result = await uploadToCloudinary(fileBuffer, 'courses/images', 'image');
 * 
 * // Upload file path
 * const result = await uploadToCloudinary('/tmp/video.mp4', 'lessons/videos', 'video');
 */
const uploadToCloudinary = async (fileInput, folder = 'uploads', resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    // Validate inputs
    if (!fileInput) {
      return reject(new Error('File input is required for upload'));
    }

    if (!folder || typeof folder !== 'string') {
      return reject(new Error('Valid folder path is required'));
    }

    try {
      // Base upload options with security and optimization settings
      const baseUploadOptions = {
        folder: folder.trim(),
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        // Security settings
        invalidate: true,
        // Optimization settings
        quality: 'auto:good',
        fetch_format: 'auto',
      };

      // Add resource-specific optimizations
      if (resourceType === 'image') {
        baseUploadOptions.transformation = [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ];
      } else if (resourceType === 'video') {
        baseUploadOptions.video_codec = 'auto';
        baseUploadOptions.quality = 'auto:good';
      }

      // Handle buffer upload (from memory storage)
      if (Buffer.isBuffer(fileInput)) {
        const uploadStream = cloudinary.uploader.upload_stream(
          baseUploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary buffer upload error:', {
                error: error.message,
                folder,
                resourceType,
              });
              return reject(new Error(`Upload failed: ${error.message}`));
            }


            resolve(result);
          }
        );

        uploadStream.end(fileInput);
        return;
      }

      // Handle file path upload (from disk storage)
      if (typeof fileInput === "string") {
        cloudinary.uploader.upload(
          fileInput,
          baseUploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary file upload error:', {
                error: error.message,
                filePath: fileInput,
                folder,
                resourceType,
              });
              return reject(new Error(`Upload failed: ${error.message}`));
            }


            resolve(result);
          }
        );
        return;
      }

      // Invalid input type
      reject(new Error('Invalid file input. Expected Buffer or file path string.'));

    } catch (error) {
      console.error('Cloudinary upload setup error:', error);
      reject(new Error(`Upload setup failed: ${error.message}`));
    }
  });
};

/**
 * Delete file from Cloudinary with enhanced error handling
 * 
 * Safely removes files from Cloudinary storage with proper validation
 * and comprehensive error reporting.
 * 
 * @param {string} publicId - The Cloudinary public ID of the file to delete
 * @param {string} resourceType - The resource type ('image', 'video', 'raw')
 * @returns {Promise<Object>} Cloudinary deletion result
 * 
 * @example
 * await deleteFromCloudinary('courses/sample-image', 'image');
 * await deleteFromCloudinary('lessons/video-123', 'video');
 */
const deleteFromCloudinary = async (publicId, resourceType = "raw") => {
  return new Promise((resolve, reject) => {
    // Validate inputs
    if (!publicId || typeof publicId !== 'string') {
      return reject(new Error('Valid public ID is required for deletion'));
    }

    if (!resourceType || typeof resourceType !== 'string') {
      return reject(new Error('Valid resource type is required for deletion'));
    }

    const validResourceTypes = ['image', 'video', 'raw'];
    if (!validResourceTypes.includes(resourceType)) {
      return reject(new Error(`Invalid resource type. Must be one of: ${validResourceTypes.join(', ')}`));
    }

    try {
      cloudinary.uploader.destroy(
        publicId.trim(),
        { 
          resource_type: resourceType,
          invalidate: true // Invalidate CDN cache
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary deletion error:', {
              error: error.message,
              publicId,
              resourceType,
            });
            return reject(new Error(`Failed to delete ${resourceType}: ${error.message}`));
          }

          // Check if deletion was successful
          if (result.result === 'ok') {
            resolve(result);
          } else if (result.result === 'not found') {
            console.warn('Cloudinary deletion - file not found:', {
              publicId,
              resourceType,
            });
            // Resolve anyway since the file doesn't exist (desired state achieved)
            resolve(result);
          } else {
            console.error('Cloudinary deletion failed:', {
              publicId,
              resourceType,
              result: result.result,
              timestamp: new Date().toISOString()
            });
            reject(new Error(`Deletion failed with result: ${result.result}`));
          }
        }
      );
    } catch (error) {
      console.error('Cloudinary deletion setup error:', error);
      reject(new Error(`Deletion setup failed: ${error.message}`));
    }
  });
};

/**
 * Validate file size and type before upload
 * 
 * @param {Buffer|string} fileInput - File to validate
 * @param {string} mimetype - File MIME type
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Object} Validation result with isValid and errors
 */
const validateFileForUpload = (fileInput, mimetype, maxSize = 50 * 1024 * 1024) => {
  const errors = [];

  // Check file input
  if (!fileInput) {
    errors.push('File input is required');
  }

  // Check file size for buffers
  if (Buffer.isBuffer(fileInput) && fileInput.length > maxSize) {
    errors.push(`File size (${fileInput.length} bytes) exceeds maximum allowed size (${maxSize} bytes)`);
  }

  // Check MIME type
  if (!mimetype) {
    errors.push('File MIME type is required');
  } else {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mp3', 'audio/wav', 'audio/ogg',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(mimetype.toLowerCase())) {
      errors.push(`File type ${mimetype} is not allowed`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getResourceType,
  validateFileForUpload,
};
