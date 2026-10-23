/**
 * Enrollment Request Controller
 *
 * Handles student enrollment requests with admin notes functionality.
 * Provides CRUD operations and admin management features.
 *
 * Features:
 * - Create enrollment requests
 * - Admin approval/rejection with notes
 * - Multiple admin notes support
 * - Request status management
 *
 * @author Mentora Team
 * @version 2.0.0
 */

const EnrollmentRequest = require("../models/EnrollmentRequest");
const Course = require("../models/Course");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

// Import billing utilities for commission tracking
const {
  createBillingTransactionForCoursePayment,
} = require("../utils/billingUtils");

// Import simple notification utility
const { notifyEnrollmentRequest } = require("../utils/notificationUtils");

// @desc    Create enrollment request
// @route   POST /api/enrollment-requests
// @access  Private
const createEnrollmentRequest = asyncHandler(async (req, res) => {
  const {
    courseId,
    paymentMethod,
    transferredAmount,
    bankName,
    referenceNumber,
    transferDate,
  } = req.body;

  if (!courseId) {
    res.status(400);
    throw new Error("Course ID is required");
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  // Check if user already has a pending request
  const existingRequest = await EnrollmentRequest.findOne({
    student: req.user._id,
    course: courseId,
    status: "pending",
  });

  if (existingRequest) {
    res.status(400);
    throw new Error("You already have a pending request for this course");
  }

  // Check if user is already enrolled
  if (course.enrolledStudents.includes(req.user._id)) {
    res.status(400);
    throw new Error("You are already enrolled in this course");
  }

  // Only allow enrollment requests for direct transfer payments
  if (paymentMethod !== "direct_transfer") {
    res.status(400);
    throw new Error(
      "Enrollment requests are only allowed for direct transfer payments. Please use the payment page for other payment methods."
    );
  }

  // Validate direct transfer data
  if (!transferredAmount || !bankName || !referenceNumber || !transferDate) {
    res.status(400);
    throw new Error(
      "Bank transfer details are required for direct transfer payment"
    );
  }

  if (!req.file) {
    res.status(400);
    throw new Error("Bank transfer proof document is required");
  }

  try {
    // Prepare enrollment request data
    const requestData = {
      student: req.user._id,
      course: courseId,
      paymentMethod: paymentMethod || "none",
    };

    // Add bank transfer data if provided
    if (paymentMethod === "direct_transfer") {
      requestData.transferredAmount = parseFloat(transferredAmount);
      requestData.transferDetails = {
        bankName,
        referenceNumber,
        transferDate: new Date(transferDate),
      };

      // Handle file upload to S3 if needed
      if (req.file) {
        // Use your AWS utility for S3 upload
        try {
          const { uploadFile, getFile } = require("../utils/aws");

          // Upload to direct-transfer-receipts folder
          const uploadResult = await uploadFile(
            req.file,
            "direct-transfer-receipts"
          );

          // Generate signed URL for immediate access
          const signedUrl = await getFile(uploadResult.key, 3600); // 1 hour expiry

          requestData.bankTransferProof = {
            url: signedUrl,
            s3Key: uploadResult.key,
            fileName: req.file.originalname,
            uploadedAt: new Date(),
          };
        } catch (s3Error) {
          console.error("S3 upload error:", s3Error);
          throw new Error(`File upload failed: ${s3Error.message}`);
        }
      }
    }

    const request = await EnrollmentRequest.create(requestData);

    // 🔗 UPDATE RELATIONSHIPS - Add enrollment request to course
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { enrollmentRequests: request._id },
    });

    const populatedRequest = await EnrollmentRequest.findById(request._id)
      .populate("student", "name email")
      .populate("course", "title description price duration level instructor");

    // 📧 SIMPLE NOTIFICATION: Notify instructor about new enrollment request
    if (
      populatedRequest.course &&
      populatedRequest.course.instructor &&
      populatedRequest.student
    ) {
      await notifyEnrollmentRequest(
        populatedRequest.student._id,
        populatedRequest.course.instructor,
        populatedRequest.course.title,
        populatedRequest.student.name
      );
    }

    res.status(201).json({
      success: true,
      message: "Enrollment request submitted successfully",
      data: populatedRequest,
    });
  } catch (error) {
    console.error("Error creating enrollment request:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
    });
    res.status(400);
    throw new Error(`Failed to create enrollment request: ${error.message}`);
  }
});

// @desc    Get all enrollment requests
// @route   GET /api/enrollment-requests
// @access  Private/Admin
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
const updateEnrollmentRequest = asyncHandler(async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!status) {
      res.status(400);
      throw new Error("Status can not be empty");
    }

    const request = await EnrollmentRequest.findById(req.params.id)
      .populate("student", "name email")
      .populate("course", "title description price duration level instructor");

    if (!request) {
      res.status(404);
      throw new Error("Enrollment request not found");
    }

    // Authorization check: Instructors can only update requests for their own courses
    if (req.user.role === "instructor") {
      if (
        !request.course.instructor ||
        request.course.instructor.toString() !== req.user._id.toString()
      ) {
        res.status(403);
        throw new Error(
          "You can only update enrollment requests for your own courses"
        );
      }
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      res.status(400);
      throw new Error("Unaccepted request status");
    }

    request.status = status;

    // Set approvedBy information when status is approved
    if (status === "approved") {
      request.approvedBy = {
        user: req.user._id,
        role: req.user.role,
        approvedAt: new Date(),
      };
      //add student to the grade list
      const student = await User.findById(req.user._id);
      const course = await Course.findById(request.course._id);
      if (!student || !course) {
        res.status(404);
        throw new Error("User or course not found");
      }
    }

    // If adminNote is provided, add it to adminNotes array instead of legacy field
    if (adminNote && adminNote.trim()) {
      request.addAdminNote(adminNote.trim(), req.user.id);
    }

    // Save request first to avoid parallel save issues
    await request.save();

    if (status === "approved") {
      // Create payment record if this is a direct transfer request
      if (
        request.paymentMethod === "direct_transfer" &&
        request.transferredAmount
      ) {
        const Payment = require("../models/Payment");

        // Create payment record
        const payment = await Payment.create({
          userId: request.student._id, // FIXED: Use userId instead of student
          course: request.course._id,
          enrollmentRequest: request._id,
          amount: request.transferredAmount,
          finalAmount: request.transferredAmount, // FIXED: Use finalAmount as required by model
          originalAmount: request.transferredAmount,
          instructorAmount: request.transferredAmount, // Will be calculated based on admin settings later
          method: "direct_transfer",
          status: "paid",
          paidAt: new Date(),
          admin: req.user._id,
          receiptUrl: request.bankTransferProof?.url,
          receiptS3Key: request.bankTransferProof?.s3Key,
          transferDetails: {
            bankName: request.transferDetails?.bankName,
            accountNumber: null, // Not stored for security
            transferAmount: request.transferredAmount,
            transferDate: request.transferDetails?.transferDate,
            referenceNumber: request.transferDetails?.referenceNumber,
          },
        });

        // Create billing transaction for instructor commission tracking
        try {
          const course = await Course.findById(request.course._id);
          if (course && course.instructor) {
            // Get admin settings for profit calculation
            const AdminSettings = require("../models/AdminSettings");
            let adminSettings = await AdminSettings.findOne();
            if (!adminSettings) {
              // Create default settings if none exist
              adminSettings = await AdminSettings.create({
                paymentSettings: {
                  globalDeductionPercentage: 10, // 10% default
                  studentAdminFee: 2, // $2 default admin fee
                },
              });
            }

            const originalAmount = request.transferredAmount;
            const finalAmount = request.transferredAmount;
            const adminFee = adminSettings.paymentSettings.studentAdminFee || 2;
            const adminPercentage =
              adminSettings.paymentSettings.globalDeductionPercentage || 10;
            const totalAdminProfit =
              adminFee + (originalAmount * adminPercentage) / 100;
            const instructorAmount = originalAmount - totalAdminProfit;

            await createBillingTransactionForCoursePayment({
              studentId: request.student._id,
              courseId: request.course._id,
              instructorId: course.instructor,
              originalAmount: originalAmount,
              finalAmount: finalAmount,
              adminFee: adminFee,
              adminPercentage: adminPercentage,
              instructorAmount: instructorAmount,
              paymentId: payment._id,
              method: "direct_transfer",
            });
            console.log(
              `✅ Billing transaction created for course payment: ${payment._id}`
            );
            console.log(
              `💰 Payment breakdown: Total: $${originalAmount}, Admin: $${totalAdminProfit.toFixed(
                2
              )}, Instructor: $${instructorAmount.toFixed(2)}`
            );
          }
        } catch (billingError) {
          console.error("❌ Error creating billing transaction:", billingError);
          // Don't fail the enrollment approval if billing fails, but log it
        }
      }

      // update the status of this request in related model

      // 1- update the course by adding the student to the enrolledStudents array
      const course = await Course.findById(request.course._id);
      if (!course) {
        res.status(404);
        throw new Error("Course not found");
      }

      // Check if student is already enrolled to prevent duplicates
      if (!course.enrolledStudents.includes(request.student._id)) {
        course.enrolledStudents.push(request.student._id);
        course.students += 1;
        await course.save();
      }

      // 2- update the user by adding the course to the enrolledCourses array
      const user = await User.findById(request.student._id);
      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }

      // Check if course is already in user's enrolled courses to prevent duplicates
      if (!user.enrolledCourses.includes(request.course._id)) {
        user.enrolledCourses.push(request.course._id);
        await user.save();
      }
    }

    // Return updated request with populated adminNotes
    const updatedRequest = await EnrollmentRequest.findByIdWithNotes(
      request._id
    );

    res.status(200).json({
      success: true,
      message: `Enrollment request ${status} successfully`,
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating enrollment request:", error);
    res.status(500);
    throw new Error(`Failed to update enrollment request: ${error.message}`);
  }
});

// @desc    Get user's enrollment requests
// @route   GET /api/enrollment-requests/user
// @access  Private
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
const deleteEnrollmentRequest = asyncHandler(async (req, res) => {
  const request = await EnrollmentRequest.findByIdAndDelete(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error("Enrollment request not found");
  }

  res.status(200).json({
    success: true,
    message: "Enrollment request deleted successfully",
    data: null,
  });
});

/**
 * Add admin note to enrollment request
 * @desc    Add a note to enrollment request (can be added regardless of status)
 * @route   POST /api/enrollment-requests/:id/notes
 * @access  Private/Admin/Instructor
 */
const addAdminNote = asyncHandler(async (req, res) => {
  const { note } = req.body;

  // Validate note content
  if (!note || note.trim().length === 0) {
    res.status(400);
    throw new Error("Note content is required");
  }

  if (note.length > 1000) {
    res.status(400);
    throw new Error("Note content cannot exceed 1000 characters");
  }

  // Find the enrollment request with course populated
  const request = await EnrollmentRequest.findById(req.params.id).populate(
    "course",
    "instructor"
  );
  if (!request) {
    res.status(404);
    throw new Error("Enrollment request not found");
  }

  // Authorization check: Instructors can only add notes to their own course requests
  if (req.user.role === "instructor") {
    if (
      !request.course.instructor ||
      request.course.instructor.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error(
        "You can only add notes to enrollment requests for your own courses"
      );
    }
  }

  try {
    // Add the note using the model method
    await request.addAdminNote(note.trim(), req.user._id);

    // Return updated request with populated data
    const updatedRequest = await EnrollmentRequest.findById(request._id)
      .populate("student", "name email avatar")
      .populate("course", "title description instructor")
      .populate("adminNotes.admin", "name email");

    res.status(200).json({
      success: true,
      message: "Admin note added successfully",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error adding admin note:", error);
    res.status(500);
    throw new Error("Failed to add admin note");
  }
});

/**
 * Get enrollment request with notes
 * @desc    Get single enrollment request with all notes
 * @route   GET /api/enrollment-requests/:id
 * @access  Private/Admin
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

/**
 * Edit admin note in enrollment request
 * @desc    Edit a specific admin note
 * @route   PUT /api/enrollment-requests/:id/notes/:noteId
 * @access  Private/Admin/Instructor
 */
const editAdminNote = asyncHandler(async (req, res) => {
  const { id, noteId } = req.params;
  const { note } = req.body;

  if (!note || !note.trim()) {
    res.status(400);
    throw new Error("Note content is required");
  }

  if (note.trim().length > 1000) {
    res.status(400);
    throw new Error("Note content cannot exceed 1000 characters");
  }

  const request = await EnrollmentRequest.findById(id).populate(
    "course",
    "instructor"
  );
  if (!request) {
    res.status(404);
    throw new Error("Enrollment request not found");
  }

  // Authorization check: Instructors can only edit notes on their own course requests
  if (req.user.role === "instructor") {
    if (
      !request.course.instructor ||
      request.course.instructor.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error(
        "You can only edit notes on enrollment requests for your own courses"
      );
    }
  }

  // Find the note to edit
  const noteIndex = request.adminNotes.findIndex(
    (n) => n._id.toString() === noteId
  );

  if (noteIndex === -1) {
    res.status(404);
    throw new Error("Admin note not found");
  }

  // Check if the current admin is the one who created the note
  const existingNote = request.adminNotes[noteIndex];
  if (existingNote.admin.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only edit your own notes");
  }

  // Update the note
  request.adminNotes[noteIndex].note = note.trim();
  request.adminNotes[noteIndex].updatedAt = new Date();

  await request.save();

  // Return updated request with populated data
  const updatedRequest = await EnrollmentRequest.findByIdWithNotes(id);

  res.status(200).json({
    success: true,
    message: "Admin note updated successfully",
    data: updatedRequest,
  });
});

/**
 * Delete admin note from enrollment request
 * @desc    Delete a specific admin note
 * @route   DELETE /api/enrollment-requests/:id/notes/:noteId
 * @access  Private/Admin/Instructor
 */
const deleteAdminNote = asyncHandler(async (req, res) => {
  const { id, noteId } = req.params;

  const request = await EnrollmentRequest.findById(id).populate(
    "course",
    "instructor"
  );
  if (!request) {
    res.status(404);
    throw new Error("Enrollment request not found");
  }

  // Authorization check: Instructors can only delete notes on their own course requests
  if (req.user.role === "instructor") {
    if (
      !request.course.instructor ||
      request.course.instructor.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error(
        "You can only delete notes on enrollment requests for your own courses"
      );
    }
  }

  // Find and remove the note
  const noteIndex = request.adminNotes.findIndex(
    (note) => note._id.toString() === noteId
  );

  if (noteIndex === -1) {
    res.status(404);
    throw new Error("Admin note not found");
  }

  // Check if the current admin is the one who created the note
  const note = request.adminNotes[noteIndex];
  if (note.admin.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only delete your own notes");
  }

  // Remove the note
  request.adminNotes.splice(noteIndex, 1);
  await request.save();

  // Return updated request
  const updatedRequest = await EnrollmentRequest.findById(id)
    .populate("student", "name email avatar")
    .populate("course", "title description instructor")
    .populate("adminNotes.admin", "name email");

  res.status(200).json({
    success: true,
    message: "Admin note deleted successfully",
    data: updatedRequest,
  });
});

/**
 * Generate fresh signed URL for bank transfer receipt
 * @desc    Generate a fresh signed URL for viewing bank transfer proof
 * @route   GET /api/enrollment-requests/:id/receipt
 * @access  Private/Admin/Instructor
 */
const getReceiptUrl = asyncHandler(async (req, res) => {
  const request = await EnrollmentRequest.findById(req.params.id).populate(
    "course",
    "instructor"
  );

  if (!request) {
    res.status(404);
    throw new Error("Enrollment request not found");
  }

  // Authorization check: Instructors can only access receipts for their own course requests
  if (req.user.role === "instructor") {
    if (
      !request.course.instructor ||
      request.course.instructor.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error(
        "You can only access receipts for enrollment requests for your own courses"
      );
    }
  }

  // Check if request has bank transfer proof
  if (!request.bankTransferProof || !request.bankTransferProof.s3Key) {
    res.status(404);
    throw new Error("No bank transfer receipt found for this request");
  }

  try {
    const { getFile } = require("../utils/aws");

    // Generate fresh signed URL with 1 hour expiry
    const signedUrl = await getFile(request.bankTransferProof.s3Key, 3600);

    res.status(200).json({
      success: true,
      message: "Receipt URL generated successfully",
      data: {
        url: signedUrl,
        fileName: request.bankTransferProof.fileName,
        expiresIn: 3600, // 1 hour
      },
    });
  } catch (error) {
    console.error("Failed to generate signed URL for receipt:", error);
    res.status(500);
    throw new Error("Failed to generate receipt URL");
  }
});

module.exports = {
  createEnrollmentRequest,
  getEnrollmentRequests,
  getEnrollmentRequest,
  updateEnrollmentRequest,
  getUserEnrollmentRequests,
  getInstructorEnrollmentRequests,
  deleteEnrollmentRequest,
  addAdminNote,
  editAdminNote,
  deleteAdminNote,
  getReceiptUrl,
};
