// Not Found Middleware
const notFound = (req, res, next) => {
  // Create an Error object for missing routes
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404; // HTTP 404
  error.details = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  };
  next(error); // Forward to errorHandler middleware
};

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500; // Use error code or fallback to 500
  const message = err.message || "Internal Server Error";

  // Logging (development + production)
  console.error("[Error Handler]", {
    timestamp: new Date().toISOString(),
    statusCode,
    message,
    name: err.name,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    params: req.params,
    query: req.query,
    user: req.user ? req.user._id : "unauthenticated",
    ip: req.ip,
    headers: {
      "user-agent": req.get("user-agent"),
      referer: req.get("referer"),
    },
    details: err.details,
  });

  // Determine client-preferred response type
  const type = req.accepts(["html", "json", "text"]);

  // -------- HTML Response (optional, for server-rendered templates) --------
  if (type === "html" && process.env.NODE_ENV !== "production") {
    // 404 Page
    if (statusCode === 404) {
      return res.status(404).render("error404", { message });
    }
    // Generic Error Page
    return res.status(statusCode).render("error500", {
      errorCode: statusCode,
      message: process.env.NODE_ENV === "development" ? message : "Internal Server Error",
    });
  }

  // -------- JSON Response (React SPA / API clients) --------
  if (type === "json" || !type || process.env.NODE_ENV === "production") {
    const response = {
      success: false,
      message,
      data: null,
    };

    // Add debug info in development only
    if (process.env.NODE_ENV === "development") {
      response._debug = {
        stack: err.stack,
        details: err.details,
        errors: err.errors,
        field: err.keyValue,
      };
    }

    return res.status(statusCode).json(response);
  }

  // -------- Plain text fallback --------
  return res.status(statusCode).type("text").send(message);
};

module.exports = { notFound, errorHandler };
// Error Handler Middleware