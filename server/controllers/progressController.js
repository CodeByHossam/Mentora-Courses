const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Progress = require("../models/Progress");
const Course = require("../models/Course");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) return sendError(res, "Invalid course ID", 400);
  const items = await Progress.find({ user: req.user._id, course: courseId }).lean();
  return sendSuccess(res, items, "Progress retrieved");
});

const markLessonComplete = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  if (!mongoose.isValidObjectId(courseId) || !mongoose.isValidObjectId(lessonId)) {
    return sendError(res, "Invalid ID", 400);
  }
  const progress = await Progress.findOneAndUpdate(
    { user: req.user._id, course: courseId, lesson: lessonId },
    { completed: true, completedAt: new Date() },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  logger.info("Lesson completed", { userId: req.user._id, courseId, lessonId });
  return sendSuccess(res, progress, "Progress updated", 201);
});

const updatePosition = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { position } = req.body;
  if (!mongoose.isValidObjectId(courseId) || !mongoose.isValidObjectId(lessonId)) {
    return sendError(res, "Invalid ID", 400);
  }
  const progress = await Progress.findOneAndUpdate(
    { user: req.user._id, course: courseId, lesson: lessonId },
    { lastPosition: position || 0 },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return sendSuccess(res, progress, "Position updated");
});

module.exports = { getCourseProgress, markLessonComplete, updatePosition };