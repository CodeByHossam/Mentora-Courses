// utils/createError.js
const createError = (message, statusCode = 500, details = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

module.exports = createError;
// This function creates an error object with a message, a status code, and optional details. It is used to standardize error handling in the application.