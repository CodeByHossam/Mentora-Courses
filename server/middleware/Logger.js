const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Helper function to log any message to a file in the logs folder.
 * Adds timestamp and UUID, appends the message to the file.
 * @param {string} message - The message to log
 * @param {string} fileName - Name of the log file (e.g., 'app.log')
 */
const logMessage = (message, fileName = 'app.log') => {
  try {
    const logsDir = path.join(__dirname, '../logs');

    // Create logs folder if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const filePath = path.join(logsDir, fileName);

    const timestamp = new Date().toISOString();
    const id = uuidv4();

    // Format: TIMESTAMP <tab> UUID <tab> MESSAGE
    const logEntry = `${timestamp}\t${id}\t${message}\n`;

    fs.appendFileSync(filePath, logEntry, 'utf8');
  } catch (err) {
    logger.error('Failed to write log:', err);
  }
};

/**
 * Express middleware to log errors using the helper function
 * @param {string} fileName - Name of the error log file
 */
const errorLogger = (fileName = 'error.log') => {
  return (err, req, res, next) => {
    const message = `${req.method} ${req.originalUrl} - ${err.message}`;
    logMessage(message, fileName);
    next(err); // pass error to next handler
  };
};

module.exports = {
  logMessage,
  errorLogger
};
