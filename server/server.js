const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const colors = require("colors");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const path = require("path");
const cookieParser = require("cookie-parser");

// Import security middleware and configurations
const {applySecurityMiddlewares} = require('./middleware/securityMiddleware');
 
// Import rate limiters
const {
  generalReadLimiter,
  apiReadLimiter,
  passwordResetLimiter,
  courseCreationLimiter,
  fileUploadLimiter,
  adminLimiter,
  billingLimiter
} = require('./middleware/advancedRateLimit');

// Import security configuration
const { validateSecurityConfig } = require('./config/security');

// Load environment variables
dotenv.config();

// Validate security configuration
validateSecurityConfig();

// Connect to MongoDB
connectDB();

// Start reminder service for live sessions
const reminderService = require('./services/reminderService');
reminderService.start();

// Initialize billing cron jobs
const { initializeBillingCronJobs } = require('./utils/cronJobs');
initializeBillingCronJobs();

const app = express();


// Apply security middleware in correct order all of them are used publicly
// except the input sanitizer which is used for only routs that accept user input
applySecurityMiddlewares(app);
// Webhook routes MUST come before express.json() middleware to preserve raw body
const webhookRoutes = require("./routes/webhookRoutes");
app.use("/api/webhooks", webhookRoutes);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
// Serve static files with proper CORS headers
app.use('/images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, "public/images")));

app.use(express.static(path.join(__dirname, "public")));

// File upload security is already applied above

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Import Routes
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminBulkDeleteRoutes = require("./routes/adminBulkDeleteRoutes");
const enrollmentRequestRoutes = require("./routes/enrollmentRequestRoutes");
const courseInteractionRoutes = require("./routes/courseInteractionRoutes");
const lessonRoutes = require("./routes/lessonRouts");
const videoRoutes = require("./routes/videoRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminSettingsRoutes = require("./routes/adminSettingsRoutes");
const instructorRequestRoutes = require("./routes/instructorRequestRoutes");
const emailRoutes = require('./routes/email');
const passwordRoutes = require("./routes/passwordRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const liveSessionRoutes = require("./routes/liveSessionRoutes");
const zoomRoutes = require("./routes/zoomRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const billingRoutes = require("./routes/BillingRoutes");
const levelRoutes = require("./routes/levelRoutes");
// payoutRoutes removed - using direct payout system in billingRoutes now
const gradeRoutes = require("./routes/gradeRoutes");
const refundRoutes = require("./routes/refundRoutes");
const adminFeePaymentRoutes = require("./routes/adminFeePaymentRoutes");

// Import billing middleware
const { checkBillingStatus, addBillingWarning } = require('./middleware/billingMiddleware');

// Apply different rate limiting based on request type
app.use("/api/auth", authRoutes); // Rate limiting handled in individual routes
app.use("/api/password", passwordResetLimiter, passwordRoutes);

// Apply billing middleware to all protected routes
app.use(checkBillingStatus);
app.use(addBillingWarning);

// Read-heavy endpoints (GET requests mostly)
app.use("/api/courses", courseRoutes); // Rate limiting handled in individual routes

app.use("/api/categories", (req, res, next) => {
  if (req.method === 'GET') {
    return generalReadLimiter(req, res, next);
  }
  return courseCreationLimiter(req, res, next);
}, categoryRoutes);

// Write-heavy or mixed endpoints
app.use("/api/users", apiReadLimiter, userRoutes);
// Dedicated bulk delete admin endpoints (must come before general admin routes)
app.use("/api/admin/bulk-delete", (req, res, next) => {
  if (req.method === 'GET') {
    return adminLimiter(req, res, next);
  }
  return adminLimiter(req, res, next);
}, adminBulkDeleteRoutes);
app.use("/api/admin/settings", adminLimiter, adminSettingsRoutes);
app.use("/api/admin", adminRoutes); // Rate limiting handled in individual routes
app.use("/api/enrollment-requests", courseCreationLimiter, enrollmentRequestRoutes);
app.use("/api/course-interactions", apiReadLimiter, courseInteractionRoutes);
app.use("/api/lessons", courseCreationLimiter, lessonRoutes);
app.use("/api/videos", videoRoutes); // Rate limiting handled in individual routes
// Payment routes with enhanced security (no additional rate limiting here as it's handled in the route file)
app.use("/api/payments", paymentRoutes);
app.use("/api/instructor-requests", courseCreationLimiter, instructorRequestRoutes);
app.use('/api/email', emailRoutes); // Rate limiting handled in individual routes
app.use("/api/certificates", fileUploadLimiter, certificateRoutes);
app.use("/api/live-sessions", courseCreationLimiter, liveSessionRoutes);
app.use("/api/zoom", apiReadLimiter, zoomRoutes);
app.use("/api/messages", messageRoutes); // Rate limiting handled in individual routes
app.use("/api/notifications", notificationRoutes); // Rate limiting handled in individual routes
app.use("/api/billing", (req, res, next) => {
  if (req.method === 'GET') {
    return billingLimiter(req, res, next);
  }
  return billingLimiter(req, res, next);
}, billingRoutes);
app.use("/api/levels", generalReadLimiter, levelRoutes);
app.use("/api/payouts", (req, res, next) => {
  if (req.method === 'GET') {
    return billingLimiter(req, res, next);
  }
  return billingLimiter(req, res, next);
});
// payoutRoutes removed - payout functionality now in billingRoutes
app.use("/api/grades", (req, res, next) => {
  if (req.method === 'GET') {
    return apiReadLimiter(req, res, next);
  }
  return courseCreationLimiter(req, res, next);
}, gradeRoutes);
app.use("/api/refunds", (req, res, next) => {
  if (req.method === 'GET') {
    return billingLimiter(req, res, next);
  }
  return billingLimiter(req, res, next);
}, refundRoutes);
app.use("/api/admin-fee-payments", (req, res, next) => {
  if (req.method === 'GET') {
    return adminLimiter(req, res, next);
  }
  return fileUploadLimiter(req, res, next);
}, adminFeePaymentRoutes);

//view engin 
app.set("view engine", "ejs"); // or pug, hbs, etc.
app.set("views", path.join(__dirname, "views")); // specify the views directory


// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// API Documentation page
app.get("/api-docs", (req, res) => {
  res.render("apiDocs");
});

// Custom error pages
app.get("/error/404", (req, res) => {
  res.status(404).render("error404");
});

app.get("/error/500", (req, res) => {
  res.status(500).render("error500", { errorCode: "500" });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
      .bold +
      `\n You can Visit the main page on ` +
      `${process.env.SERVER_URL}`.cyan.underline
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Unhandled Promise Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
