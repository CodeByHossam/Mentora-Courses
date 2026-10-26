const sendSuccess = (res, data = null, message = "Success", statusCode = 200, meta = null) => {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

const sendError = (res, message = "Request failed", statusCode = 500, error = null) => {
  const payload = { success: false, message, data: null };
  if (error && process.env.NODE_ENV === "development") {
    payload.error = error;
  }
  return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess, sendError };