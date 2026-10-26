const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Wishlist = require("../models/Wishlist");
const Course = require("../models/Course");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const getWishlist = asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id })
    .populate("course")
    .sort({ createdAt: -1 })
    .lean();
  return sendSuccess(res, items, "Wishlist retrieved");
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  if (!mongoose.isValidObjectId(courseId)) return sendError(res, "Invalid course ID", 400);
  const course = await Course.findById(courseId);
  if (!course) return sendError(res, "Course not found", 404);

  const item = await Wishlist.findOneAndUpdate(
    { user: req.user._id, course: courseId },
    { user: req.user._id, course: courseId },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  logger.info("Wishlist item added", { userId: req.user._id, courseId });
  return sendSuccess(res, item, "Added to wishlist", 201);
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) return sendError(res, "Invalid course ID", 400);
  await Wishlist.deleteOne({ user: req.user._id, course: courseId });
  return sendSuccess(res, null, "Removed from wishlist");
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };