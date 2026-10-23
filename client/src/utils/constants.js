/**
 * Application constants and configuration
 */

// API Configuration
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If environment variable is set, ensure it includes /api
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  
  // Default fallback
  return 'http://localhost:5000/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// File Upload Limits
export const FILE_LIMITS = {
  IMAGE: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DIMENSIONS: {
      MAX_WIDTH: 2048,
      MAX_HEIGHT: 2048
    }
  },
  VIDEO: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_TYPES: ['video/mp4', 'video/webm', 'video/mov'],
    DURATION: {
      MAX_MINUTES: 120
    }
  },
  DOCUMENT: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
  COURSE_PAGE_SIZE: 12,
  LESSON_PAGE_SIZE: 20
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student'
};

// Course Levels
export const COURSE_LEVELS = {
  GENERAL: 'General',
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced'
};

// Course Status
export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  COURSE_TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100
  },
  LESSON_TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 80
  }
};

// UI Constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 500,
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 5000,
  VIDEO_TOKEN_REFRESH_THRESHOLD: 300, // 5 minutes
  LAZY_LOADING_OFFSET: 100
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  COURSE_PROGRESS: 'course_progress'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'Invalid file type.',
  UPLOAD_FAILED: 'File upload failed. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  REGISTRATION_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  COURSE_CREATED: 'Course created successfully!',
  COURSE_UPDATED: 'Course updated successfully!',
  LESSON_CREATED: 'Lesson created successfully!',
  LESSON_UPDATED: 'Lesson updated successfully!',
  ENROLLMENT_SUCCESS: 'Successfully enrolled in course!',
  UPLOAD_SUCCESS: 'File uploaded successfully!'
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  COURSES: '/courses',
  COURSE_DETAIL: '/courses/:id',
  LESSON: '/courses/:courseId/lessons/:lessonId',
  CREATE_COURSE: '/create-course',
  EDIT_COURSE: '/courses/:id/edit',
  ADMIN: '/admin',
  INSTRUCTOR: '/instructor'
};

// Video Quality Options
export const VIDEO_QUALITY = {
  AUTO: 'auto',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  ADAPTIVE: 'adaptive'
};

// Theme Colors (matching CSS variables)
export const THEME_COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  },
  SECONDARY: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490'
  }
};

// ================================
// UTILITY FUNCTIONS FOR SAFE DATA HANDLING
// ================================

/**
 * Safe value getter with fallback
 * Prevents undefined/null errors
 */
export const safeValue = (value, fallback = 'N/A') => {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
};

/**
 * Safe number with fallback (prevents NaN)
 */
export const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

/**
 * Safe user name getter
 */
export const safeUserName = (user) => {
  return user?.name || user?.email || 'Unknown User';
};

/**
 * Safe image URL with fallback icon
 */
export const safeImageUrl = (url, type = 'user') => {
  if (!url) {
    const icons = {
      user: '/default-avatar.png',
      course: '/default-course.png',
      placeholder: '/placeholder.png'
    };
    return icons[type] || icons.placeholder;
  }
  return url;
};

/**
 * Safe array getter
 */
export const safeArray = (arr) => {
  return Array.isArray(arr) ? arr : [];
};

/**
 * Safe math division (prevents NaN and Infinity)
 */
export const safeDivide = (numerator, denominator, fallback = 0) => {
  if (!denominator || denominator === 0) return fallback;
  const result = numerator / denominator;
  return isNaN(result) || !isFinite(result) ? fallback : result;
};

/**
 * Safe percentage calculation
 */
export const safePercentage = (value, total, decimals = 0) => {
  const percentage = safeDivide(value, total, 0) * 100;
  return Number(percentage.toFixed(decimals));
};

/**
 * Format currency safely
 */
export const safeCurrency = (amount, currency = '$') => {
  const num = safeNumber(amount, 0);
  return `${currency}${num.toFixed(2)}`;
};

export default {
  API_CONFIG,
  FILE_LIMITS,
  PAGINATION,
  USER_ROLES,
  COURSE_LEVELS,
  COURSE_STATUS,
  VALIDATION_RULES,
  UI_CONSTANTS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  VIDEO_QUALITY,
  THEME_COLORS,
  // Utility functions
  safeValue,
  safeNumber,
  safeUserName,
  safeImageUrl,
  safeArray,
  safeDivide,
  safePercentage,
  safeCurrency
};
