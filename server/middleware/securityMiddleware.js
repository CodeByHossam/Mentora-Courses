const helmet = require('helmet');
const { securityConfig } = require('../config/security');
const { sanitizeInput } = require('./sanitizeMiddleware');
const mongoSanitize = require('express-mongo-sanitize');
const mongoSanitizeMiddleware = mongoSanitize(securityConfig.mongoSanitize);
const { setCSRFToken } = require('./csrfProtection');
const { logMessage } = require('./Logger'); // our logger helper
const cors = require('cors');
 

/**
 * Comprehensive security middleware configuration
 * Implements the centralized security configuration
 */

// Trust proxy for accurate IP addresses
const trustProxyMiddleware = (req, res, next) => {
  req.app.set('trust proxy', 1);
  next();
};

// ================================
// HELMET SECURITY HEADERS
// ================================
const helmetConfig = helmet(securityConfig.helmet || {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://via.placeholder.com"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
});

// ================================
// CORS CONFIGURATION
// ================================
const corsOptions = securityConfig.cors || {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.SERVER_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5000'
    ].filter(Boolean);

    if (!origin || origin === 'null') return callback(null, true);
    return allowedOrigins.includes(origin)
      ? callback(null, true)
      : callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count']
};

// ================================
// REQUEST LOGGER / MONITORING
// ================================
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  const suspiciousPatterns = [
    /script/i, /javascript/i, /vbscript/i, /onload/i, /onerror/i,
    /eval\(/i, /union.*select/i, /drop.*table/i, /insert.*into/i, /delete.*from/i
  ];

  const requestData = JSON.stringify({ body: req.body, query: req.query, params: req.params });
  if (suspiciousPatterns.some(pattern => pattern.test(requestData))) {
    console.warn(`Suspicious request detected from IP ${req.ip}:`, { method: req.method, path: req.path, body: req.body });
    logMessage('Suspicious request detected', { method: req.method, path: req.path, body: req.body });
  }

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 5000) console.warn(`Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
  });

  next();
};

// ================================
// IP FILTER / BLACKLIST
// ================================
const ipFilter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const blacklistedIPs = process.env.BLACKLISTED_IPS ? process.env.BLACKLISTED_IPS.split(',') : [];
  if (blacklistedIPs.includes(clientIP)) return res.status(403).json({ success: false, message: 'Access denied' });
  next();
};

// ================================
// FILE UPLOAD SECURITY
// ================================
const fileUploadSecurity = (req, res, next) => {
  if (!req.file && !req.files) return next();

  const files = req.files || [req.file];
  for (const file of files) {
    if (!file) continue;

    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.sh'];
    const fileExtension = file.originalname?.toLowerCase().substring(file.originalname.lastIndexOf('.')) || '';

    if (dangerousExtensions.includes(fileExtension)) {
      logMessage(`File upload security: Attempt to upload dangerous file type ${fileExtension} from IP ${req.ip}`, 'security.log');
      return res.status(400).json({ success: false, message: 'File type not allowed for security reasons' });
    }

    const expectedMimeTypes = {
      '.jpg': ['image/jpeg'], '.jpeg': ['image/jpeg'], '.png': ['image/png'], '.gif': ['image/gif'], '.webp': ['image/webp'],
      '.mp4': ['video/mp4'], '.webm': ['video/webm'], '.pdf': ['application/pdf']
    };

    if (expectedMimeTypes[fileExtension] && !expectedMimeTypes[fileExtension].includes(file.mimetype)) {
      return res.status(400).json({ success: false, message: 'File content does not match extension' });
    }
  }

  next();
};

// Additional security headers
const additionalSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

// CSRF protection for authenticated routes
const csrfProtection = (req, res, next) => {
  if (req.user && req.method === 'GET' && !req.originalUrl.includes('/webhooks/')) {
    setCSRFToken(req, res, next);
  } else {
    next();
  }
};



/**
 * Apply all security middlewares in order and log any security issues.
 * Logs only one success message after all middlewares are applied.
 * @param {Express.Application} app
 * @param {string} securityFile - Name of the log file, default 'security.log'
 */
const applySecurityMiddlewares = (app, securityFile = 'security.log') => {
  try {
    // Trust proxy
    app.use((req, res, next) => {
      try { trustProxyMiddleware(req, res, next); } 
      catch (err) { logMessage(`Trust proxy middleware error: ${err.message}`, securityFile); next(err); }
    });

    // CORS must be first because it sets the Access-Control-Allow-Origin header
    app.use((req, res, next) => {
      try { cors(corsOptions)(req, res, next); } 
      catch (err) { logMessage(`CORS middleware error: ${err.message}`, securityFile); next(err); }
    });

    // Helmet
    app.use((req, res, next) => {
      try { helmetConfig(req, res, next); } 
      catch (err) { logMessage(`Helmet middleware error: ${err.message}`, securityFile); next(err); }
    });

    // Mongo sanitize
    app.use((req, res, next) => {
      try { mongoSanitizeMiddleware(req, res, next); } 
      catch (err) { logMessage(`Mongo sanitize error: ${err.message}`, securityFile); next(err); }
    });

    // Security logger
    app.use((req, res, next) => {
      try { securityLogger(req, res, next); } 
      catch (err) { logMessage(`Security logger error: ${err.message}`, securityFile); next(err); }
    });

    // IP filter
    app.use((req, res, next) => {
      try { ipFilter(req, res, next); } 
      catch (err) { logMessage(`IP filter error: ${err.message}`, securityFile); next(err); }
    });

    // File upload security
    app.use((req, res, next) => {
      try { fileUploadSecurity(req, res, next); } 
      catch (err) { logMessage(`File upload security error: ${err.message}`, securityFile); next(err); }
    });

    // Additional headers
    app.use((req, res, next) => {
      try { additionalSecurityHeaders(req, res, next); } 
      catch (err) { logMessage(`Additional security headers error: ${err.message}`, securityFile); next(err); }
    });

    // CSRF protection (only on /api routes)
    app.use('/api', (req, res, next) => {
      try { csrfProtection(req, res, next); } 
      catch (err) { logMessage(`CSRF protection error: ${err.message}`, securityFile); next(err); }
    });

    // Only one success log for all middlewares
    logMessage('All security middlewares applied successfully', securityFile);

  } catch (err) {
    logMessage(`Failed to apply security middlewares: ${err.message}`, securityFile);
  }
};

 

module.exports = {
  sanitizeInput,
  fileUploadSecurity,
  applySecurityMiddlewares
};
