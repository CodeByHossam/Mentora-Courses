const rateLimit = require('express-rate-limit');

// ================================
// READ OPERATIONS (GET Requests)
// ================================

// General content browsing - most permissive
const generalReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    retryAfter: 15 * 60 // 15 minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `user_${req.user._id}` : req.ip;
  }
});

// API data fetching - moderate limits
const apiReadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300, // 300 requests per window
  message: {
    success: false,
    message: 'API rate limit exceeded. Please wait before making more requests.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `api_read_${req.user._id}` : `api_read_${req.ip}`;
  }
});

// Video streaming - special limits for bandwidth management
const videoStreamLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 video requests per window
  message: {
    success: false,
    message: 'Video streaming rate limit exceeded. Please wait before requesting more videos.',
    retryAfter: 10 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `video_${req.user._id}` : `video_${req.ip}`;
  }
});


// ================================
// SEARCH & FILTERING
// ================================

// Search operations - moderate limits
const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 search requests per window
  message: {
    success: false,
    message: 'Search rate limit exceeded. Please wait before making more searches.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `search_${req.user._id}` : `search_${req.ip}`;
  }
});


module.exports = {
  generalReadLimiter,
  apiReadLimiter,
  videoStreamLimiter,
  searchLimiter
};
