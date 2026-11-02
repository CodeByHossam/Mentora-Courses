const logger = require('../../utils/logger');
const User = require("../../models/User");
const Course = require("../../models/Course");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { uploadToCloudinary } = require("../../utils/cloudinary");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../utils/emailSender");

// ======================
// CREATE NEW USER (ADMIN)
// ======================

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("All fields are required");
  }

  const userExists = await User.findOne({ email }).lean().exec();
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  let avatar = "";
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, "users");
      avatar = result.secure_url;
    } catch (err) {
      res.status(500);
      throw new Error("Failed to upload user photo");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    avatar,
    isVerified: false,
    isActive: false,
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid user data");
  }

  // === SEND VERIFICATION EMAIL ===
  try {
    const secret = process.env.JWT_SECRET + user.email;
    const token = jwt.sign({ id: user._id, email: user.email }, secret, {
      expiresIn: "30m",
    });

    const verificationLink = `${process.env.SERVER_URL}/api/auth/verify/${user._id}/${token}`;

    await sendEmail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Verify Your Email",
      text: `Hello ${user.name},\n\nWelcome! Please verify your email by clicking the link below:\n\n${verificationLink}\n\nThis link is valid for 30 minutes.`,
    });
  } catch (err) {
    logger.error("Error sending verification email:", err);
  }

  res.status(201).json({
    success: true,
    message: "User created successfully. Verification email sent.",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
  });
});

// ======================
// GET ALL USERS (ADMIN)
// ======================

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select("-password")
    .populate(
      "enrolledCourses",
      "title description price duration level imageUrl"
    )
    .populate(
      "createdCourses",
      "title description price duration level imageUrl"
    );

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: users,
  });
});

// ======================
// GET USER BY ID (ADMIN)
// ======================

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate({
      path: "enrolledCourses",
      select: "title description price duration level imageUrl category",
      populate: { path: "category", select: "name" },
    })
    .populate({
      path: "createdCourses",
      select: "title description price duration level imageUrl category",
      populate: { path: "category", select: "name" },
    });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});

// ======================
// UPDATE USER (ADMIN)
// ======================

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const name = req.body.name?.trim() || user.name;
  const role = req.body.role || user.role;
  const bio = req.body.bio || user.bio;
  const isVerified = req.body.isVerified === "true";
  const isActive = req.body.isActive === "true";

  user.name = name;
  user.role = role;
  user.bio = bio;
  user.isVerified = isVerified;
  user.isActive = isActive;

  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, "users");
      user.avatar = result.secure_url;
    } catch (err) {
      res.status(500);
      throw new Error("Failed to upload user photo");
    }
  }

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
      isActive: updatedUser.isActive,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
    },
  });
});

// ======================
// DELETE USER (ADMIN)
// ======================

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Delete user profile picture from Cloudinary
  if (user.profilePicture) {
    try {
      const { deleteFromCloudinary } = require("../../utils/cloudinary");
      const imageMatch = user.profilePicture.match(/\/upload\/(?:v\d+\/)?(.+?)\.([a-z0-9]+)/i);
      if (imageMatch && imageMatch[1]) {
        await deleteFromCloudinary(imageMatch[1], 'image');
        logger.info(`✅ Deleted profile picture for user: ${user.name}`);
      }
    } catch (error) {
      logger.error(`Failed to delete user profile picture: ${error.message}`);
    }
  }

  if (user.role === "instructor" && user.createdCourses.length > 0) {
    await Course.deleteMany({ _id: { $in: user.createdCourses } });
  }

  await Course.updateMany(
    { enrolledStudents: user._id },
    { $pull: { enrolledStudents: user._id } }
  );

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User removed successfully",
    data: null,
  });
});

// ======================
// USER STATISTICS (ADMIN)
// ======================

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
