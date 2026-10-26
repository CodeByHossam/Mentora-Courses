const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Question = require("../models/Question");
const Course = require("../models/Course");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const getQuestions = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) return sendError(res, "Invalid course ID", 400);
  const filter = { course: courseId };
  if (req.query.lessonId && mongoose.isValidObjectId(req.query.lessonId)) {
    filter.lesson = req.query.lessonId;
  }
  const questions = await Question.find(filter)
    .populate("user", "name avatar")
    .populate("answers.user", "name avatar")
    .sort({ createdAt: -1 })
    .lean();
  return sendSuccess(res, questions, "Questions retrieved");
});

const createQuestion = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { lessonId, title, content } = req.body;
  if (!mongoose.isValidObjectId(courseId)) return sendError(res, "Invalid course ID", 400);
  const course = await Course.findById(courseId);
  if (!course) return sendError(res, "Course not found", 404);

  const question = await Question.create({
    course: courseId,
    lesson: lessonId && mongoose.isValidObjectId(lessonId) ? lessonId : undefined,
    user: req.user._id,
    title,
    content,
  });
  logger.info("Question created", { userId: req.user._id, courseId });
  return sendSuccess(res, question, "Question created", 201);
});

const answerQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const { content } = req.body;
  if (!mongoose.isValidObjectId(questionId)) return sendError(res, "Invalid question ID", 400);
  const question = await Question.findByIdAndUpdate(
    questionId,
    { $push: { answers: { user: req.user._id, content, createdAt: new Date() } } },
    { new: true }
  ).populate("answers.user", "name avatar");
  if (!question) return sendError(res, "Question not found", 404);
  logger.info("Question answered", { userId: req.user._id, questionId });
  return sendSuccess(res, question, "Answer added");
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  if (!mongoose.isValidObjectId(questionId)) return sendError(res, "Invalid question ID", 400);
  const question = await Question.findById(questionId);
  if (!question) return sendError(res, "Question not found", 404);
  const isOwner = question.user.toString() === req.user._id.toString();
  const isAdminOrInstructor = ["admin", "instructor"].includes(req.user.role);
  if (!isOwner && !isAdminOrInstructor) return sendError(res, "Not authorized", 403);
  await question.deleteOne();
  return sendSuccess(res, null, "Question deleted");
});

module.exports = { getQuestions, createQuestion, answerQuestion, deleteQuestion };