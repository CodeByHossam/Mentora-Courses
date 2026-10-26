const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const Joi = require("joi");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const addSchema = Joi.object({
  courseId: Joi.string().required(),
});

router.get("/", protect, getWishlist);
router.post("/", protect, validate(addSchema), addToWishlist);
router.delete("/:courseId", protect, removeFromWishlist);

module.exports = router;