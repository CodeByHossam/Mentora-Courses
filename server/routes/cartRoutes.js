const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const Joi = require("joi");
const { getCart, addToCart, removeFromCart, clearCart } = require("../controllers/cartController");

const addSchema = Joi.object({ courseId: Joi.string().required() });

router.get("/", protect, getCart);
router.post("/", protect, validate(addSchema), addToCart);
router.delete("/:courseId", protect, removeFromCart);
router.delete("/", protect, clearCart);

module.exports = router;