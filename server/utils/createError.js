// utils/createError.js
const createError = (first, second = 500, details = {}) => {
  let message;
  let statusCode;
  if (typeof first === "number" && typeof second === "string") {
    statusCode = first;
    message = second;
  } else {
    message = first;
    statusCode = typeof second === "number" ? second : 500;
  }
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

module.exports = createError;
// This function creates an error object with a message, a status code, and optional details. It is used to standardize error handling in the application.