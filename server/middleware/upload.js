const multer = require("multer");

// Use memoryStorage to keep uploaded files in RAM as buffers
const storage = multer.memoryStorage();

// Create multer instance with this storage
const upload = multer({ storage });

module.exports = upload;
