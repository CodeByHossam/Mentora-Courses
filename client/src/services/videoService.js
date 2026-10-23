import api from '../config/api';

/**
 * Frontend video service for handling temporary video URLs
 */
class VideoService {
  constructor() {
    this.activeTokens = new Map();
    this.tokenRefreshThreshold = 300; // 5 minutes before expiry
  }

  /**
   * Generate temporary streaming URL for a lesson
   * @param {string} lessonId - Lesson ID
   * @param {string} quality - Video quality (auto, low, medium, high, adaptive)
   * @returns {Promise<Object>} - Streaming data with URL and token
   */
  async generateStreamingUrl(lessonId, quality = 'auto') {
    try {
      console.log('📹 Requesting video stream for lesson:', lessonId, 'quality:', quality);
      const response = await api.post(`/videos/stream/${lessonId}`, { quality });
      
      if (response.data.success) {
        const streamingData = response.data.data;
        console.log('✅ Video stream response received:', streamingData);
        
        // Store token for automatic refresh
        this.activeTokens.set(lessonId, {
          token: streamingData.token,
          expiresAt: new Date(streamingData.expiresAt),
          lessonId
        });

        return streamingData;
      }
      
      throw new Error(response.data.message || 'Failed to generate streaming URL');
    } catch (error) {
      console.error('❌ Video streaming URL generation failed:', error);
      console.error('Error details:', {
        lessonId,
        quality,
        errorMessage: error.message,
        responseData: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Get video metadata without URL
   * @param {string} lessonId - Lesson ID
   * @returns {Promise<Object>} - Video metadata
   */
  async getVideoMetadata(lessonId) {
    try {
      const response = await api.get(`/videos/metadata/${lessonId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to get video metadata');
    } catch (error) {
      console.error('Video metadata fetch failed:', error);
      throw error;
    }
  }

  /**
   * Verify video access token
   * @param {string} token - JWT token
   * @param {string} lessonId - Lesson ID
   * @returns {Promise<boolean>} - Token validity
   */
  async verifyVideoAccess(token, lessonId) {
    try {
      const response = await api.post('/videos/verify', { token, lessonId });
      return response.data.success && response.data.data.valid;
    } catch (error) {
      console.error('Video access verification failed:', error);
      return false;
    }
  }

  /**
   * Check if token needs refresh
   * @param {string} lessonId - Lesson ID
   * @returns {boolean} - Whether token needs refresh
   */
  needsTokenRefresh(lessonId) {
    const tokenData = this.activeTokens.get(lessonId);
    if (!tokenData) return true;

    const now = new Date();
    const timeUntilExpiry = tokenData.expiresAt.getTime() - now.getTime();
    
    return timeUntilExpiry < (this.tokenRefreshThreshold * 1000);
  }

  /**
   * Refresh token if needed
   * @param {string} lessonId - Lesson ID
   * @param {string} quality - Video quality
   * @returns {Promise<Object|null>} - New streaming data or null if not needed
   */
  async refreshTokenIfNeeded(lessonId, quality = 'auto') {
    if (this.needsTokenRefresh(lessonId)) {
      return await this.generateStreamingUrl(lessonId, quality);
    }
    return null;
  }

  /**
   * Clear stored token
   * @param {string} lessonId - Lesson ID
   */
  clearToken(lessonId) {
    this.activeTokens.delete(lessonId);
  }

  /**
   * Clear all stored tokens
   */
  clearAllTokens() {
    this.activeTokens.clear();
  }

  /**
   * Get cached token data
   * @param {string} lessonId - Lesson ID
   * @returns {Object|null} - Token data or null
   */
  getCachedToken(lessonId) {
    return this.activeTokens.get(lessonId) || null;
  }

  /**
   * Format video duration for display
   * @param {number} seconds - Duration in seconds
   * @returns {string} - Formatted duration (HH:MM:SS or MM:SS)
   */
  formatDuration(seconds) {
    if (!seconds || seconds < 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @returns {string} - Formatted size
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }
}

export default new VideoService();
