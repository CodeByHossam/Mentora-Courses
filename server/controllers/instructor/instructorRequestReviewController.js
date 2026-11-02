const InstructorRequest = require("../../models/InstructorRequestModel");
const User = require("../../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { uploadToCloudinary } = require("../../utils/cloudinary");

const updateRequest = asyncHandler(async (req, res) => {
  const { status, adminNote: note } = req.body;
  const request = await InstructorRequest.findById(req.params.id);

  if (!request) {
    return res
      .status(404)
      .json({ isSuccess: false, message: "Request not found" });
  }
  if (request.status !== "pending") {
    return res
      .status(400)
      .json({ isSuccess: false, message: "Request already processed" });
  }

  // ✅ add note if provided
  if (note) {
    request.adminNotes.push({ note, admin: req.user._id });
  }

  if (status === "rejected") {
    request.status = "rejected";
    await request.save();
    return res.json({
      isSuccess: true,
      message: "Instructor request rejected",
      data: request,
    });
  }

  if (status === "approved") {
    const userExists = await User.findOne({ email: request.email })
      .lean()
      .exec();
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    // create instructor user
    const user = await User.create({
      name: request.name,
      email: request.email,
      password: request.password, // already hashed
      role: "instructor",
      avatar: request.avatar || null,
      bio: request.bio || "",
      isActive: true,
      instructorProfile: {
        field: request.field || "",
        universityCertificate: request.universityCertificate || "",
        experienceCertificates: request.experienceCertificates || [],
        bankAccountNumber: request.bankAccountNumber || "",
        bankName: request.bankName || "",
        iban: request.iban || "",
        termsAccepted: request.termsAccepted || false,
      },
    });

    request.status = "approved";
    request.user = user._id;
    await request.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
    };

    return res.json({
      isSuccess: true,
      message: "Instructor request approved",
      data: { request, userData },
    });
  }

  return res.status(400).json({ isSuccess: false, message: "Invalid status" });
});

// @desc    Delete instructor request
// @route   DELETE /api/instructor-requests/:id
// @access  Admin
const deleteRequest = asyncHandler(async (req, res) => {
  const request = await InstructorRequest.findById(req.params.id);
  if (!request) {
    return res
      .status(404)
      .json({ isSuccess: false, message: "Request not found" });
  }

  await request.deleteOne();
  res.json({ isSuccess: true, message: "Request deleted successfully" });
});

// @desc    Add admin note without changing status
// @route   POST /api/instructor-requests/:id/notes
// @access  Admin

const addNote = asyncHandler(async (req, res) => {
  const { adminNote: note } = req.body;

  if (!note) {
    return res
      .status(400)
      .json({ isSuccess: false, message: "Note is required", body: req.body });
  }

  const request = await InstructorRequest.findById(req.params.id);
  if (!request) {
    return res
      .status(404)
      .json({ isSuccess: false, message: "Request not found" });
  }

  request.adminNotes.push({ note, admin: req.user._id });
  await request.save();

  res.json({
    isSuccess: true,
    message: "Note added successfully",
    data: request,
  });
});

// @desc    Edit admin note
// @route   PUT /api/instructor-requests/:id/notes/:noteId
// @access  Admin
const editNote = asyncHandler(async (req, res) => {
  const { id, noteId } = req.params;
  const { note } = req.body;

  if (!note || !note.trim()) {
    return res
      .status(400)
      .json({ isSuccess: false, message: "Note content is required" });
  }

  if (note.trim().length > 1000) {
    return res
      .status(400)
      .json({
        isSuccess: false,
        message: "Note content cannot exceed 1000 characters",
      });
  }

  const request = await InstructorRequest.findById(id);
  if (!request) {
    return res
      .status(404)
      .json({ isSuccess: false, message: "Request not found" });
  }

  // Find the note to edit
  const noteIndex = request.adminNotes.findIndex(
    (n) => n._id.toString() === noteId
  );

  if (noteIndex === -1) {
    return res
      .status(404)
      .json({ isSuccess: false, message: "Admin note not found" });
  }

  // Check if the current admin is the one who created the note
  const existingNote = request.adminNotes[noteIndex];
  if (existingNote.admin.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json({ isSuccess: false, message: "You can only edit your own notes" });
  }

  // Update the note
  request.adminNotes[noteIndex].note = note.trim();
  request.adminNotes[noteIndex].updatedAt = new Date();

  await request.save();

  // Return updated request with populated data
  const updatedRequest = await InstructorRequest.findById(id).populate(
    "adminNotes.admin",
    "name email"
  );

  res.json({
    isSuccess: true,
    message: "Admin note updated successfully",
    data: updatedRequest,
  });
});

// @desc    Delete admin note
// @route   DELETE /api/instructor-requests/:id/notes/:noteId
// @access  Admin
const deleteNote = asyncHandler(async (req, res) => {
  const { id, noteId } = req.params;

  const request = await InstructorRequest.findById(id);
  if (!request) {
    return res
      .status(404)
      .json({ isSuccess: false, message: "Request not found" });
  }

  // Find and remove the note
  const noteIndex = request.adminNotes.findIndex(
    (note) => note._id.toString() === noteId
  );

  if (noteIndex === -1) {
    return res
      .status(404)
      .json({ isSuccess: false, message: "Admin note not found" });
  }

  // Check if the current admin is the one who created the note
  const note = request.adminNotes[noteIndex];
  if (note.admin.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json({
        isSuccess: false,
        message: "You can only delete your own notes",
      });
  }

  // Remove the note
  request.adminNotes.splice(noteIndex, 1);
  await request.save();

  // Return updated request
  const updatedRequest = await InstructorRequest.findById(id).populate(
    "adminNotes.admin",
    "name email"
  );

  res.json({
    isSuccess: true,
    message: "Admin note deleted successfully",
    data: updatedRequest,
  });
});


module.exports = {
  updateRequest,
  deleteRequest,
  addNote,
  editNote,
  deleteNote
};
