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

const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalStudents: {
          $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] },
        },
        totalInstructors: {
          $sum: { $cond: [{ $eq: ["$role", "instructor"] }, 1, 0] },
        },
        totalAdmins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
        verifiedUsers: { $sum: { $cond: ["$isVerified", 1, 0] } },
        totalEnrolledCourses: { $sum: { $size: "$enrolledCourses" } },
        totalCreatedCourses: { $sum: { $size: "$createdCourses" } },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: "Statistics retrieved successfully",
    data: stats[0] || {},
  });
});

// ======================
// GET INSTRUCTOR STUDENTS
// ======================

const getInstructorStudents = asyncHandler(async (req, res) => {
  const instructorId = req.params.instructorId;

  const courses = await Course.find({ instructor: instructorId }).select(
    "enrolledStudents"
  );

  const studentIds = [
    ...new Set(
      courses.flatMap((course) =>
        course.enrolledStudents.map((id) => id.toString())
      )
    ),
  ];

  const students = await User.find({
    _id: { $in: studentIds },
    role: "student",
  }).select("-password");

  res.status(200).json({
    success: true,
    message: "Instructor students retrieved successfully",
    data: students,
  });
});

// ======================
// GET INSTRUCTOR REPORTS
// ======================

const getInstructorReports = asyncHandler(async (req, res) => {
  const instructorId = req.params.instructorId;

  const instructor = await User.findById(instructorId);
  if (!instructor) {
    res.status(404);
    throw new Error("Instructor not found");
  }
  if (instructor.role !== "instructor") {
    res.status(403);
    throw new Error("User is not an instructor");
  }

  const stats = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(instructorId) } },
    {
      $lookup: {
        from: "courses",
        localField: "createdCourses",
        foreignField: "_id",
        as: "courses",
      },
    },
    { $unwind: { path: "$courses", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "payments",
        localField: "courses._id",
        foreignField: "course",
        as: "payments",
      },
    },
    { $unwind: { path: "$payments", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$_id",
        totalStudents: {
          $sum: { $size: { $ifNull: ["$courses.enrolledStudents", []] } },
        },
        totalCourses: {
          $sum: { $cond: [{ $ifNull: ["$courses._id", false] }, 1, 0] },
        },
        totalRevenue: { $sum: { $ifNull: ["$payments.amount", 0] } },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: "Statistics retrieved successfully",
    data: stats[0] || {},
  });
});

// ======================
// RESEND VERIFICATION EMAIL
// ======================

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error("User is already verified");
  }

  try {
    const secret = process.env.JWT_SECRET + user.email;
    const token = jwt.sign({ id: user._id, email: user.email }, secret, {
      expiresIn: "30m",
    });

    const verificationLink = `${process.env.SERVER_URL}/api/users/verify/${user._id}/${token}`;

    await sendEmail({
      from: process.env.EMAIL_USER,
      subject: "Verify Your Email",
      text: `Hello ${user.name},\n\nPlease verify your email by clicking the link below:\n\n${verificationLink}\n\nThis link is valid for 30 minutes.`,
    });

    res.status(200).json({
      success: true,
      message: "Verification link resent to your email",
    });
  } catch (err) {
    logger.error("Error resending verification email:", err);
    res.status(500);
    throw new Error("Failed to resend verification email");
  }
});

/**
 * 📦 SIMPLIFIED: Get Admin Bank Details for Direct Transfers
 * Students transfer money to admin, admin pays instructor directly
 */

const getAdminBankDetails = asyncHandler(async (req, res) => {
  try {
    // Find the first admin user
    const admin = await User.findOne({ role: "admin" });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: admin.name,
        email: admin.email,
        paymentDetails: admin.paymentDetails || {
          bankDetails: {
            bankName: "Not configured",
            accountNumber: "Not configured",
            swift: "Not configured",
            iban: "Not configured",
          },
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching admin bank details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin bank details",
      error: error.message,
    });
  }
});

module.exports = {
  getUserStats,
  getInstructorStudents,
  getInstructorReports,
  resendVerificationEmail,
  getAdminBankDetails
};
