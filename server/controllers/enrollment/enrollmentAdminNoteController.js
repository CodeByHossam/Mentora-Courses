const logger = require('../../utils/logger');
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const Course = require("../../models/Course");
const User = require("../../models/User");
const asyncHandler = require("express-async-handler");
const { notifyEnrollmentRequest } = require("../../utils/notificationUtils");

// @desc    Create enrollment request
// @route   POST /api/enrollment-requests
// @access  Private

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
    logger.error("Error adding admin note:", error);
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


module.exports = {
  addAdminNote,
  editAdminNote,
  deleteAdminNote
};
