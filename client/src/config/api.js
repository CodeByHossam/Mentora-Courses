import axios from 'axios';
import { toast } from 'react-toastify';
import { API_CONFIG, ERROR_MESSAGES, STORAGE_KEYS } from '../utils/constants';

/**
 * Enhanced API configuration with interceptors, retry logic, and error handling
 */
class ApiClient {
  constructor() {
    console.log('🔧 API Client initialized with baseURL:', API_CONFIG.BASE_URL);
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    this.setupInterceptors();
    this.retryCount = 0;
  }

  /**
   * Setup request and response interceptors
   */
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Only log video requests for debugging
        if (config.url.includes('/videos/')) {
          const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
          console.log('📤 Video API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            fullURL: `${config.baseURL}${config.url}`,
            hasToken: !!token,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
          });
        }
        
        // Add auth token if available
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() };
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response time in development
        // Performance logging removed for production

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle network errors
        if (!error.response) {
          console.error('Network error:', error);
          toast.error(ERROR_MESSAGES.NETWORK_ERROR);
          return Promise.reject(error);
        }

        // Handle specific HTTP status codes
        switch (error.response.status) {
          case 401:
            // Only handle unauthorized for auth-related endpoints
            if (originalRequest.url.includes('/auth/') || originalRequest.url.includes('/users/')) {
              await this.handleUnauthorized(error, originalRequest);
            } else {
              // For other endpoints, just log the error without auto-logout
              console.warn('⚠️ 401 on non-auth endpoint:', originalRequest.url);
            }
            break;
          case 403:
            console.warn('⚠️ 403 Forbidden:', originalRequest.url);
            // Don't show toast for video endpoints as they might be expected
            if (!originalRequest.url.includes('/videos/')) {
              toast.error(ERROR_MESSAGES.FORBIDDEN);
            }
            break;
          case 404:
            console.warn('⚠️ 404 Not Found:', originalRequest.url);
            // Don't show toast for video endpoints as they have their own error handling
            if (!originalRequest.url.includes('/videos/')) {
              toast.error(ERROR_MESSAGES.NOT_FOUND);
            }
            break;
          case 429:
            await this.handleRateLimit(error, originalRequest);
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            await this.handleServerError(error, originalRequest);
            break;
          default:
            this.handleGenericError(error);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle 401 Unauthorized - attempt token refresh
   */
  async handleUnauthorized(error, originalRequest) {
    if (!originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const response = await this.client.post('/auth/refresh', {
            refreshToken
          });

          const { accessToken } = response.data.data;
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return this.client(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      // If refresh fails, redirect to login
      this.logout();
      toast.error(ERROR_MESSAGES.UNAUTHORIZED);
    }
  }

  /**
   * Handle 429 Rate Limit - implement exponential backoff
   */
  async handleRateLimit(error, originalRequest) {
    if (this.retryCount < API_CONFIG.RETRY_ATTEMPTS) {
      this.retryCount++;
      const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
      
      console.warn(`Rate limited. Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.client(originalRequest);
    }
    
    toast.error('Too many requests. Please try again later.');
  }

  /**
   * Handle server errors with retry logic
   */
  async handleServerError(error, originalRequest) {
    if (this.retryCount < API_CONFIG.RETRY_ATTEMPTS && !originalRequest._retry) {
      originalRequest._retry = true;
      this.retryCount++;
      
      const delay = API_CONFIG.RETRY_DELAY * this.retryCount;
      console.warn(`Server error. Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.client(originalRequest);
    }
    
    toast.error(ERROR_MESSAGES.SERVER_ERROR);
  }

  /**
   * Handle generic errors
   */
  handleGenericError(error) {
    const message = error.response?.data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
    toast.error(message);
  }

  /**
   * Logout user and clear tokens
   */
  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    window.location.href = '/login';
  }

  /**
   * GET request with error handling
   */
  async get(url, config = {}) {
    try {
      this.retryCount = 0;
      const response = await this.client.get(url, config);
      return response;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * POST request with error handling
   */
  async post(url, data = {}, config = {}) {
    try {
      this.retryCount = 0;
      const response = await this.client.post(url, data, config);
      return response;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * PUT request with error handling
   */
  async put(url, data = {}, config = {}) {
    try {
      this.retryCount = 0;
      const response = await this.client.put(url, data, config);
      return response;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * DELETE request with error handling
   */
  async delete(url, config = {}) {
    try {
      this.retryCount = 0;
      const response = await this.client.delete(url, config);
      return response;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(url, formData, onProgress = null) {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      };

      const response = await this.client.post(url, formData, config);
      return response;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Format error for consistent handling
   */
  formatError(error) {
    return {
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data,
      originalError: error
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Get current auth token
   */
  getAuthToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }
}

// Create and export singleton instance
const api = new ApiClient();
export default api;
