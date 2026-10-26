const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const Joi = require("joi");
const { validateCoupon, applyCoupon } = require("../controllers/couponController");

const applySchema = Joi.object({
  code: Joi.string().required(),
  amount: Joi.number().min(0).required(),
});

router.get("/:code", validateCoupon);
router.post("/apply", protect, validate(applySchema), applyCoupon);

module.exports = router;