const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const { sanitizeInput } = require("../middleware/sanitizeMiddleware");
const categoryValidation = require("../validations/categoryValidation");

// Public routes
router.get("/", getCategories);
router.get("/:id", getCategory);

// Admin routes
router.post(
  "/",
  protect,
  authorize(["admin"]),
  
  sanitizeInput({ allowHtmlFields: ["description"] }),
  validate(categoryValidation.create),
  createCategory
);

router.put(
  "/:id",
  protect,
  authorize(["admin"]),
   sanitizeInput({ allowHtmlFields: ["description"] }),
  validate(categoryValidation.update),
  updateCategory
);

router.delete("/:id", protect, authorize(["admin"]), deleteCategory);

module.exports = router;
