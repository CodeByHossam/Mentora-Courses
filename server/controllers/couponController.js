const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Coupon = require("../models/Coupon");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const validateCoupon = asyncHandler(async (req, res) => {
  const code = String(req.params.code || req.body.code || "").toUpperCase();
  const coupon = await Coupon.findOne({ code, active: true }).lean();
  if (!coupon) return sendError(res, "Invalid coupon", 404);
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return sendError(res, "Coupon expired", 400);
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return sendError(res, "Coupon usage limit reached", 400);
  }
  return sendSuccess(res, coupon, "Coupon valid");
});

const calculateDiscount = (coupon, amount) => {
  if (!coupon) return 0;
  if (coupon.discountType === "percent") {
    return Math.min(amount, (amount * coupon.discountValue) / 100);
  }
  return Math.min(amount, coupon.discountValue);
};

const applyCoupon = asyncHandler(async (req, res) => {
  const { code, amount } = req.body;
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase(), active: true });
  if (!coupon) return sendError(res, "Invalid coupon", 404);
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return sendError(res, "Coupon expired", 400);
  }
  const numericAmount = Number(amount) || 0;
  const discount = calculateDiscount(coupon, numericAmount);
  coupon.usedCount += 1;
  await coupon.save();
  logger.info("Coupon applied", { code: coupon.code, discount });
  return sendSuccess(res, { coupon, discount, finalAmount: Math.max(0, numericAmount - discount) }, "Coupon applied");
});

module.exports = { validateCoupon, applyCoupon, calculateDiscount };