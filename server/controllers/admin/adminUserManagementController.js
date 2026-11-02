const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const User = require("../../models/User");
const Course = require("../../models/Course");
const Category = require("../../models/Category");
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const Payment = require("../../models/Payment");

// Additional models for bulk deletion
const Comment = require("../../models/Comment");
const Test = require("../../models/Test");
const Grade = require("../../models/Grade");
const Certificate = require("../../models/Certificate");
const LiveSession = require("../../models/LiveSession");
const Message = require("../../models/Message");
const Notification = require("../../models/Notification");
const Attachment = require("../../models/Attachment");
const InstructorRequest = require("../../models/InstructorRequestModel");
// PayoutRequest removed - using direct payout system now
const RefundRequest = require("../../models/RefundRequest");
const AdminFeePayment = require("../../models/AdminFeePayment");
const GiftCard = require("../../models/GiftCard");

// Protected models (cannot be bulk deleted)
const BillingTransaction = require("../../models/BillingTransaction");
const InstructorBillingAccount = require("../../models/InstructorBillingAccount");
const StudentBillingAccount = require("../../models/StudentBillingAccount");
const AdminBillingAccount = require("../../models/AdminBillingAccount");

// @desc    Create a new user (admin or instructor) - Admin only
// @route   POST /api/admin/users
// @access  Private/Admin

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  // Check if creator is admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error(
      "Only administrators can create admin or instructor accounts"
    );
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Create user with specified role
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  if (user) {
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Update user active state
// @route   PATCH /api/admin/users/:id/active-state
// @access  Private/Admin

const updateUserActiveState = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Don't allow deactivating admin users
  if (user.role === "admin") {
    res.status(400);
    throw new Error("Cannot deactivate admin users");
  }

  user.isActive = isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User active state updated successfully",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

// @desc    Update user verification state
// @route   PATCH /api/admin/users/:id/verification-state
// @access  Private/Admin

const updateUserVerificationState = asyncHandler(async (req, res) => {
  const { isVerified } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.isVerified = isVerified;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User verification state updated successfully",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
    },
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: users,
  });
});

// Define getReports as a named function

module.exports = {
  createUser,
  updateUserActiveState,
  updateUserVerificationState,
  getUsers
};
