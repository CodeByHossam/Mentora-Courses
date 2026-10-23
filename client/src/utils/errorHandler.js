import { toast } from 'react-toastify';

/**
 * Centralized error handling utility for consistent error management
 */

// Error types
export const ERROR_TYPES = {
  VALIDATION: 'VALIDATION',
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  SERVER: 'SERVER',
  FILE_UPLOAD: 'FILE_UPLOAD',
  PERMISSION: 'PERMISSION',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT'
};

// Default error messages
const DEFAULT_MESSAGES = {
  [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
  [ERROR_TYPES.NETWORK]: 'Network error. Please check your connection.',
  [ERROR_TYPES.AUTH]: 'Authentication failed. Please log in again.',
  [ERROR_TYPES.SERVER]: 'Server error. Please try again later.',
  [ERROR_TYPES.FILE_UPLOAD]: 'File upload failed. Please try again.',
  [ERROR_TYPES.PERMISSION]: 'You do not have permission to perform this action.',
  [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_TYPES.RATE_LIMIT]: 'Too many requests. Please wait before trying again.'
};

/**
 * Parse API error response and extract meaningful error information
 */
export const parseApiError = (error) => {
  // Handle RTK Query errors
  if (error?.data) {
    return {
      message: error.data.message || 'An error occurred',
      errors: error.data.errors || {},
      status: error.status,
      type: getErrorType(error.status, error.data)
    };
  }

  // Handle network errors
  if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
    return {
      message: 'Network connection failed',
      type: ERROR_TYPES.NETWORK,
      status: 0
    };
  }

  // Handle generic errors
  return {
    message: error?.message || 'An unexpected error occurred',
    type: ERROR_TYPES.SERVER,
    status: error?.status || 500
  };
};

/**
 * Determine error type based on status code and response data
 */
const getErrorType = (status, data) => {
  if (status === 400 && data?.errors) return ERROR_TYPES.VALIDATION;
  if (status === 401) return ERROR_TYPES.AUTH;
  if (status === 403) return ERROR_TYPES.PERMISSION;
  if (status === 404) return ERROR_TYPES.NOT_FOUND;
  if (status === 429) return ERROR_TYPES.RATE_LIMIT;
  if (status >= 500) return ERROR_TYPES.SERVER;
  return ERROR_TYPES.SERVER;
};

/**
 * Handle API errors with appropriate user feedback
 */
export const handleApiError = (error, options = {}) => {
  const { 
    showToast = true, 
    customMessage, 
    onError,
    silent = false 
  } = options;

  const parsedError = parseApiError(error);
  const message = customMessage || parsedError.message;

  // Call custom error handler if provided
  if (onError) {
    onError(parsedError);
  }

  // Show toast notification unless silent
  if (showToast && !silent) {
    switch (parsedError.type) {
      case ERROR_TYPES.VALIDATION:
        toast.error(message, { toastId: 'validation-error' });
        break;
      case ERROR_TYPES.AUTH:
        toast.error(message, { toastId: 'auth-error' });
        break;
      case ERROR_TYPES.NETWORK:
        toast.error(message, { toastId: 'network-error' });
        break;
      case ERROR_TYPES.RATE_LIMIT:
        toast.warning(message, { toastId: 'rate-limit-error' });
        break;
      default:
        toast.error(message, { toastId: 'general-error' });
    }
  }

  return parsedError;
};

/**
 * Handle successful API responses with user feedback
 */
export const handleApiSuccess = (response, options = {}) => {
  const { 
    showToast = true, 
    message = 'Operation completed successfully',
    onSuccess 
  } = options;

  if (onSuccess) {
    onSuccess(response);
  }

  if (showToast) {
    toast.success(message, { toastId: 'success' });
  }

  return response;
};

/**
 * Retry mechanism for failed API calls
 */
export const withRetry = async (apiCall, options = {}) => {
  const { 
    maxRetries = 3, 
    delay = 1000, 
    backoff = true,
    retryCondition = (error) => error?.status >= 500 
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry if condition not met or max retries reached
      if (!retryCondition(error) || attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

/**
 * Validation error formatter for form fields
 */
export const formatValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return {};
  
  const formatted = {};
  
  Object.entries(errors).forEach(([field, error]) => {
    if (typeof error === 'string') {
      formatted[field] = error;
    } else if (error?.message) {
      formatted[field] = error.message;
    } else if (Array.isArray(error) && error.length > 0) {
      formatted[field] = error[0];
    }
  });
  
  return formatted;
};

/**
 * Global error boundary handler
 */
export const handleGlobalError = (error, errorInfo) => {
  console.error('Global error caught:', error, errorInfo);
  
  // Log to external service in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  }
  
  toast.error('An unexpected error occurred. Please refresh the page.', {
    toastId: 'global-error',
    autoClose: false
  });
};

/**
 * File upload error handler
 */
export const handleFileUploadError = (error, file) => {
  const parsedError = parseApiError(error);
  
  let message = parsedError.message;
  
  // Customize message based on common file upload errors
  if (parsedError.message?.includes('size')) {
    message = `File "${file?.name}" is too large. Please choose a smaller file.`;
  } else if (parsedError.message?.includes('type')) {
    message = `File type not supported for "${file?.name}". Please choose a different file.`;
  } else if (parsedError.message?.includes('upload')) {
    message = `Failed to upload "${file?.name}". Please try again.`;
  }
  
  toast.error(message, { toastId: 'file-upload-error' });
  return parsedError;
};

/**
 * Form submission error handler
 */
export const handleFormError = (error, formName = 'form') => {
  const parsedError = parseApiError(error);
  
  // Handle validation errors specially
  if (parsedError.type === ERROR_TYPES.VALIDATION && parsedError.errors) {
    const formattedErrors = formatValidationErrors(parsedError.errors);
    toast.error(`Please fix the errors in the ${formName} and try again.`);
    return { ...parsedError, formattedErrors };
  }
  
  handleApiError(error, { customMessage: `Failed to submit ${formName}. ${parsedError.message}` });
  return parsedError;
};

export default {
  handleApiError,
  handleApiSuccess,
  parseApiError,
  withRetry,
  formatValidationErrors,
  handleGlobalError,
  handleFileUploadError,
  handleFormError,
  ERROR_TYPES
};
