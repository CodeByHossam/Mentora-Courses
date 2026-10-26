const logger = require('../utils/logger');
/**
 * Security Configuration
 * 
 * Centralized security settings and configuration for Mentora application.
 * Includes payment security, CORS, helmet, and other security middleware settings.
 * 
 * @author Mentora Team
 * @version 1.0.0
 */


/**
 * Security configuration object
 * Centralized security settings for the entire application
 */
const securityConfig = {
  // CORS configuration
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.CLIENT_URL,"http://localhost:5173"
      ].filter(Boolean);

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'x-csrf-token',
      'X-API-Test'
    ],
    exposedHeaders: ['X-CSRF-Token']
  },

  // Helmet security headers configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.stripe.com", "https://api.paypal.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://www.paypal.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for payment iframe compatibility
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  // MongoDB sanitization options
  mongoSanitize: {
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      logger.warn(`Sanitized key: ${key} in request to ${req.originalUrl}`);
    }
  },


  // File upload security
  fileUpload: {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1
    },
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']
  },

  // Payment security settings
  payment: {
    // Stripe webhook IPs (update regularly)
    stripeWebhookIPs: [
      '3.18.12.63',
      '3.130.192.231',
      '13.235.14.237',
      '13.235.122.149',
      '18.211.135.69',
      '35.154.171.200',
      '52.15.183.38',
      '54.187.174.169',
      '54.187.205.235',
      '54.187.216.72'
    ],
    
    // PayPal webhook validation
    paypalWebhookValidation: {
      requireSignature: true,
      requireCertId: true,
      requireTransmissionId: true
    },

    // CSRF protection settings
    csrf: {
      cookieName: 'csrf-token',
      headerName: 'x-csrf-token',
      cookieOptions: {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }
  },

  // Input validation settings
  validation: {
    // Maximum string lengths
    maxLengths: {
      name: 100,
      email: 254,
      description: 1000,
      note: 500,
      bankName: 100,
      accountNumber: 30,
      referenceNumber: 50
    },
    
    // Numeric limits
    numericLimits: {
      amount: { min: 0.01, max: 999999.99 },
      percentage: { min: 0, max: 100 },
      page: { min: 1, max: 1000 },
      limit: { min: 1, max: 100 }
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined',
    
    // Security events to log
    securityEvents: [
      'failed_authentication',
      'rate_limit_exceeded',
      'csrf_token_invalid',
      'invalid_file_upload',
      'suspicious_activity',
      'payment_fraud_attempt'
    ]
  }
};

/**
 * Validate security configuration on startup
 */
const validateSecurityConfig = () => {
  const requiredEnvVars = ['JWT_SECRET'];
  const optionalEnvVars = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];

  const missingRequired = requiredEnvVars.filter(varName => !process.env[varName]);
  const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);
  
  if (missingRequired.length > 0) {
    logger.error('Missing required environment variables for security:', missingRequired);
    process.exit(1);
  }

  if (missingOptional.length > 0) {
    logger.warn('⚠️  Missing optional environment variables (payment features may not work):', missingOptional);
    logger.warn('   Add these to .env file for full payment functionality');
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET should be at least 32 characters long for security');
  }

  logger.info('✅ Security configuration validated successfully');
};



module.exports = {
  securityConfig,
  validateSecurityConfig
};
