const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");
const Course = require("../models/Course");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const getCourseReviews = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) {
    return sendError(res, "Invalid course ID", 400);
  }
  const reviews = await Review.find({ course: courseId })
    .populate("user", "name avatar")
    .sort({ createdAt: -1 })
    .lean();
  const average =
    reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);
  return sendSuccess(res, { reviews, average: Number(average.toFixed(2)), total: reviews.length }, "Reviews retrieved");
});

const createReview = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { rating, comment } = req.body;
  if (!mongoose.isValidObjectId(courseId)) {
    return sendError(res, "Invalid course ID", 400);
  }
  const course = await Course.findById(courseId);
  if (!course) return sendError(res, "Course not found", 404);

  const review = await Review.findOneAndUpdate(
    { user: req.user._id, course: courseId },
    { rating, comment },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  logger.info("Review saved", { userId: req.user._id, courseId });
  return sendSuccess(res, review, "Review saved", 201);
});

const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  if (!mongoose.isValidObjectId(reviewId)) {
    return sendError(res, "Invalid review ID", 400);
  }
  const review = await Review.findById(reviewId);
  if (!review) return sendError(res, "Review not found", 404);
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return sendError(res, "Not authorized", 403);
  }
  await review.deleteOne();
  return sendSuccess(res, null, "Review deleted");
});

module.exports = { getCourseReviews, createReview, deleteReview };