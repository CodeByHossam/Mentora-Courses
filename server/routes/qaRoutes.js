const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const Joi = require("joi");
const { getQuestions, createQuestion, answerQuestion, deleteQuestion } = require("../controllers/qaController");

const createSchema = Joi.object({
  lessonId: Joi.string().optional(),
  title: Joi.string().required(),
  content: Joi.string().required(),
});

const answerSchema = Joi.object({
  content: Joi.string().required(),
});

router.get("/course/:courseId", getQuestions);
router.post("/course/:courseId", protect, validate(createSchema), createQuestion);
router.post("/:questionId/answers", protect, validate(answerSchema), answerQuestion);
router.delete("/:questionId", protect, deleteQuestion);

module.exports = router;