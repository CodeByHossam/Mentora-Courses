const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Cart = require("../models/Cart");
const Course = require("../models/Course");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.course").lean();
  return sendSuccess(res, cart || { user: req.user._id, items: [] }, "Cart retrieved");
});

const addToCart = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  if (!mongoose.isValidObjectId(courseId)) return sendError(res, "Invalid course ID", 400);
  const course = await Course.findById(courseId);
  if (!course) return sendError(res, "Course not found", 404);

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { items: { course: courseId } } },
    { new: true, upsert: true }
  ).populate("items.course");
  logger.info("Cart item added", { userId: req.user._id, courseId });
  return sendSuccess(res, cart, "Added to cart", 201);
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) return sendError(res, "Invalid course ID", 400);
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { items: { course: courseId } } },
    { new: true }
  ).populate("items.course");
  return sendSuccess(res, cart || { user: req.user._id, items: [] }, "Removed from cart");
});

const clearCart = asyncHandler(async (req, res) => {
  await Cart.deleteOne({ user: req.user._id });
  return sendSuccess(res, { items: [] }, "Cart cleared");
});

module.exports = { getCart, addToCart, removeFromCart, clearCart };