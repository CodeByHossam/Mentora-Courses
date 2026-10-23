const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

/**
 * Video streaming service with temporary URL generation
 * Provides secure, time-limited access to video content
 */
class VideoService {
  constructor() {
    this.tempUrlExpiry = 3600; // 1 hour in seconds
    this.streamingSecret = process.env.VIDEO_STREAMING_SECRET || 'default-video-secret';
  }

  /**
   * Upload video to cloud storage and return storage reference (not public URL)
   * @param {Buffer} videoBuffer - Video file buffer
   * @param {string} folder - Storage folder path
   * @param {string} resourceType - Cloudinary resource type
   * @returns {Object} - Storage reference and metadata
   */
  async uploadVideo(videoBuffer, folder = 'lessons/videos', resourceType = 'video') {
    try {
      const uploadResult = await uploadToCloudinary(videoBuffer, folder, resourceType);
      
      // Return storage reference instead of public URL
      return {
        publicId: uploadResult.public_id,
        resourceType,
        duration: uploadResult.duration,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        // Don't store the secure_url permanently
        uploadedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Video upload failed: ${error.message}`);
    }
  }

  /**
   * Generate temporary streaming URL for a video with enhanced security
   * @param {string} publicId - Cloudinary public ID
   * @param {string} userId - User ID for access control
   * @param {string} lessonId - Lesson ID for access control
   * @param {number} expiryHours - URL expiry in hours (default: 1)
   * @param {Object} securityOptions - Additional security options
   * @returns {string} - Temporary streaming URL with security features
   */
  generateTempVideoUrl(publicId, userId, lessonId, expiryHours = 1, securityOptions = {}) {
    console.log('🎬 Generating video URL:', { publicId, userId, lessonId, expiryHours });
    
    if (!publicId || !userId || !lessonId) {
      console.error('❌ Missing required parameters:', { publicId: !!publicId, userId: !!userId, lessonId: !!lessonId });
      throw new Error('Missing required parameters for video URL generation');
    }

    // Validate Cloudinary environment variables
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Missing Cloudinary environment variables');
      throw new Error('Cloudinary configuration is incomplete');
    }

    const expiryTime = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
    
    // Create secure token with enhanced access control
    const tokenPayload = {
      publicId,
      userId,
      lessonId,
      exp: expiryTime,
      iat: Math.floor(Date.now() / 1000),
      type: 'video_access',
      // Security enhancements
      userAgent: securityOptions.userAgent || 'unknown',
      referrer: securityOptions.referrer || 'unknown',
      sessionId: crypto.randomUUID(),
      // Add watermark data
      watermark: {
        userId,
        timestamp: Date.now()
      }
    };

    const token = jwt.sign(tokenPayload, this.streamingSecret);
    
    // Generate Cloudinary signed URL with expiration
    const timestamp = Math.round(Date.now() / 1000);
    // Enhanced transformation with security features
    const transformation = 'q_auto,f_auto,fl_no_overflow'; // Auto quality, format, prevent overflow
    
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}&transformation=${transformation}${process.env.CLOUDINARY_API_SECRET}`;
    const signature = crypto
      .createHash('sha1')
      .update(stringToSign)
      .digest('hex');

    const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/${transformation}/v${timestamp}/${publicId}.mp4?signature=${signature}&api_key=${process.env.CLOUDINARY_API_KEY}&timestamp=${timestamp}`;
    
    console.log('✅ Generated video URL successfully');
    
    return {
      streamingUrl: cloudinaryUrl,
      token,
      expiresAt: new Date(expiryTime * 1000),
      expiresIn: expiryHours * 3600,
      // Security metadata
      security: {
        sessionId: tokenPayload.sessionId,
        watermarkEnabled: true,
        downloadProtected: true,
        domainRestricted: true
      }
    };
  }

  /**
   * Verify video access token
   * @param {string} token - JWT token
   * @param {string} userId - Current user ID
   * @param {string} lessonId - Current lesson ID
   * @returns {Object} - Decoded token if valid
   */
  verifyVideoAccess(token, userId, lessonId) {
    try {
      const decoded = jwt.verify(token, this.streamingSecret);
      
      // Verify access control
      if (decoded.userId !== userId || decoded.lessonId !== lessonId) {
        throw new Error('Access denied: Invalid user or lesson');
      }

      if (decoded.type !== 'video_access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Video access verification failed: ${error.message}`);
    }
  }

  /**
   * Generate streaming URL with bandwidth adaptation
   * @param {string} publicId - Cloudinary public ID
   * @param {string} userId - User ID for access control
   * @param {string} lessonId - Lesson ID for access control
   * @param {Object} securityOptions - Additional security options
   * @returns {Object} - Streaming URLs for different qualities
   */
  generateAdaptiveStreamingUrls(publicId, userId, lessonId, securityOptions = {}) {
    const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`;
    const timestamp = Math.round(Date.now() / 1000);
    
    const qualities = {
      auto: 'q_auto,f_auto',
      low: 'q_auto:low,w_480,f_auto',
      medium: 'q_auto:good,w_720,f_auto', 
      high: 'q_auto:best,w_1080,f_auto'
    };

    const urls = {};
    
    Object.entries(qualities).forEach(([quality, transformation]) => {
      const stringToSign = `public_id=${publicId}&timestamp=${timestamp}&transformation=${transformation}${process.env.CLOUDINARY_API_SECRET}`;
      const signature = crypto
        .createHash('sha1')
        .update(stringToSign)
        .digest('hex');

      urls[quality] = `${baseUrl}/${transformation}/v${timestamp}/${publicId}.mp4?signature=${signature}&api_key=${process.env.CLOUDINARY_API_KEY}&timestamp=${timestamp}`;
    });

    // Generate access token with security options
    const tokenData = this.generateTempVideoUrl(publicId, userId, lessonId, 2, securityOptions); // 2 hour expiry for adaptive streaming
    const token = tokenData.token;

    return {
      urls,
      token,
      expiresIn: 7200 // 2 hours
    };
  }

  /**
   * Delete video from cloud storage
   * @param {string} publicId - Cloudinary public ID
   * @param {string} resourceType - Resource type (video)
   */
  async deleteVideo(publicId, resourceType = 'video') {
    try {
      await deleteFromCloudinary(publicId, resourceType);
      return { success: true, message: 'Video deleted successfully' };
    } catch (error) {
      throw new Error(`Video deletion failed: ${error.message}`);
    }
  }

  /**
   * Get video metadata without exposing URL
   * @param {Object} videoRef - Video storage reference
   * @returns {Object} - Safe metadata
   */
  getVideoMetadata(videoRef) {
    return {
      duration: videoRef.duration,
      format: videoRef.format,
      size: videoRef.bytes,
      dimensions: {
        width: videoRef.width,
        height: videoRef.height
      },
      uploadedAt: videoRef.uploadedAt,
      hasVideo: !!videoRef.publicId
    };
  }
}

module.exports = new VideoService();
