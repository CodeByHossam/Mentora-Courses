const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const Joi = require("joi");
const {
  getCourseReviews,
  createReview,
  deleteReview,
} = require("../controllers/reviewController");

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow(""),
});

router.get("/course/:courseId", getCourseReviews);
router.post("/course/:courseId", protect, validate(reviewSchema), createReview);
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;