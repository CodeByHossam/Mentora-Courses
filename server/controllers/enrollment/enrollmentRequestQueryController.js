// Enrollment request queries. Split from enrollmentRequestCrudController.js; bodies unchanged.

const EnrollmentRequest = require("../../models/EnrollmentRequest");
const Course = require("../../models/Course");
const User = require("../../models/User");
const asyncHandler = require("express-async-handler");


const getEnrollmentRequests = asyncHandler(async (req, res) => {
  const requests = await EnrollmentRequest.findWithPopulatedData();

  res.status(200).json({
    success: true,
    message: "Enrollment requests retrieved successfully",
    data: requests,
  });
});

// @desc    Update enrollment request status by admin or instructor
// @route   PATCH /api/enrollment-requests/:id
// @access  Private/Admin/Instructor

const getUserEnrollmentRequests = asyncHandler(async (req, res) => {
  const requests = await EnrollmentRequest.find({ student: req.user._id })
    .populate({
      path: "course",
      select: "title description",
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "User enrollment requests retrieved successfully",
    data: requests,
  });
});

// @desc    Get instructor's enrollment requests
// @route   GET /api/enrollment-requests/instructor
// @access  Private/Instructor

const getInstructorEnrollmentRequests = asyncHandler(async (req, res) => {
  // Find courses taught by this instructor
  const instructorCourses = await Course.find({
    instructor: req.user._id,
  }).select("_id");
  const courseIds = instructorCourses.map((course) => course._id);

  // Find enrollment requests for instructor's courses
  const requests = await EnrollmentRequest.find({
    course: { $in: courseIds },
  })
    .populate("student", "name email")
    .populate("course", "title description price duration level")
    .populate("adminNotes.admin", "name email")
    .populate("approvedBy.user", "name email role")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Instructor enrollment requests retrieved successfully",
    data: requests,
  });
});

// @desc    Delete enrollment request by admin
// @route   DELETE /api/enrollment-requests/:id
// @access  Private/Admin

/**
 * Add admin note to enrollment request
 * @desc    Add a note to enrollment request (can be added regardless of status)
 * @route   POST /api/enrollment-requests/:id/notes
 * @access  Private/Admin/Instructor
 */

const getEnrollmentRequest = asyncHandler(async (req, res) => {
  const request = await EnrollmentRequest.findById(req.params.id)
    .populate("student", "name email avatar")
    .populate("course", "title description instructor")
    .populate("adminNotes.admin", "name email");

  if (!request) {
    res.status(404);
    throw new Error("Enrollment request not found");
  }

  res.status(200).json({
    success: true,
    message: "Enrollment request retrieved successfully",
    data: request,
  });

});

module.exports = {
  getEnrollmentRequests,
  getUserEnrollmentRequests,
  getInstructorEnrollmentRequests,
  getEnrollmentRequest
};
