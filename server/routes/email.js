const express = require('express');
const router = express.Router();
const {sendContactForm}=require('../controllers/emailController')

// Import specific rate limiters
const {
  messagingLimiter
} = require('../middleware/advancedRateLimit');

router.post('/contact', messagingLimiter, sendContactForm);

module.exports = router;
