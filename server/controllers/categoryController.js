const Category = require("../models/Category");
const Course = require("../models/Course");
const asyncHandler = require("express-async-handler");

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().populate({
    path: "courses",
    select: "title description price duration level imageUrl",
    options: { limit: 5 }, // Limit to 5 courses per category
  });
  res.status(200).json({
    success: true,
    message: "Categories retrieved successfully",
    data: categories,
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate({
    path: "courses",
    select: "title description price duration level imageUrl instructor",
    populate: {
      path: "instructor",
      select: "name email",
    },
  });

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.status(200).json({
    success: true,
    message: "Category retrieved successfully",
    data: category,
  });
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    icon = "book",
    imageUrl = "https://placehold.co/600x400?text=Category",
  } = req.body;

  // Check if category with same name exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    res.status(400);
    throw new Error("Category with this name already exists");
  }

  const category = await Category.create({
    name,
    description,
    icon,
    imageUrl,
    courses: [],
    courseCount: 0,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // If name is being updated, check for duplicates
  if (req.body.name && req.body.name !== category.name) {
    const existingCategory = await Category.findOne({ name: req.body.name });
    if (existingCategory) {
      res.status(400);
      throw new Error("Category with this name already exists");
    }
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate({
    path: "courses",
    select: "title description price duration level imageUrl",
    options: { limit: 5 },
  });

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: updatedCategory,
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Check if category has courses
  if (category.courses.length > 0) {
    res.status(400);
    throw new Error("Cannot delete category with existing courses");
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: "Category removed successfully",
    data: null,
  });
});

// @desc    Update category course count
// @route   PUT /api/categories/:id/count
// @access  Private/Admin
const updateCategoryCount = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Update course count from courses array length
  category.courseCount = category.courses.length;
  await category.save();

  res.status(200).json({
    success: true,
    message: "Category count updated successfully",
    data: category,
  });
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryCount,
};
