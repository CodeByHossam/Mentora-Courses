const InstructorRequest = require("../models/InstructorRequestModel");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { uploadToCloudinary } = require("../utils/cloudinary");

// @desc    Submit new instructor request
// @route   POST /api/instructor-requests
// @access  Public
const submitRequest = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    field,
    bankAccountNumber,
    bankName,
    iban,
    bio,
    termsAccepted,
  } = req.body;

  if (!name || !email || !password || !field) {
    res.status(400);
    throw new Error("Name, email, password and field are required");
  }

  const userExists = await User.findOne({ email }).lean().exec();
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // check for existing request
  const existing = await InstructorRequest.findOne({ email });
  if (existing) {
    return res.status(400).json({
      isSuccess: false,
      message: "You already have a pending request",
    });
  }

  // Helper to pick buffer or path (supports memoryStorage or diskStorage)
  const getCloudinaryInput = (f) => (f?.buffer ? f.buffer : f?.path);

  // --- FILE UPLOADS ---
  // Expecting route to use:
  // upload.fields([
  //   { name: "photo", maxCount: 1 },
  //   { name: "universityCertificate", maxCount: 1 },
  //   { name: "experienceCertificates", maxCount: 5 },
  // ])

  let avatar = "";
  let universityCertificate = "";
  let experienceCertificates = [];

  // Backward compat: if route used single file (req.file), treat it as photo
  const singleFile = req.file ? [req.file] : null;

  // Photo (avatar)
  const photoFile =
    req.files?.photo?.[0] || (singleFile ? singleFile[0] : null);
  if (photoFile) {
    try {
      const uploaded = await uploadToCloudinary(
        getCloudinaryInput(photoFile),
        "users"
      );
      avatar = uploaded.secure_url;
    } catch (err) {
      res.status(500);
      throw new Error("Failed to upload user photo");
    }
  }

  // University certificate
  const uniFile = req.files?.universityCertificate?.[0] || null;
  if (uniFile) {
    try {
      const uploaded = await uploadToCloudinary(
        getCloudinaryInput(uniFile),
        "certificates"
      );
      universityCertificate = uploaded.secure_url;
    } catch (err) {
      res.status(500);
      throw new Error("Failed to upload university certificate");
    }
  }

  // Experience certificates (multiple)
  if (Array.isArray(req.files?.experienceCertificates)) {
    for (const f of req.files.experienceCertificates) {
      try {
        const uploaded = await uploadToCloudinary(
          getCloudinaryInput(f),
          "certificates"
        );
        experienceCertificates.push(uploaded.secure_url);
      } catch (err) {
        res.status(500);
        throw new Error("Failed to upload experience certificate(s)");
      }
    }
  } else if (req.body.experienceCertificates) {
    // Fallback if you sent URLs in body (kept from your original logic)
    // Accepts a JSON string or a single string
    try {
      const bodyExp = req.body.experienceCertificates;
      experienceCertificates = Array.isArray(bodyExp)
        ? bodyExp
        : typeof bodyExp === "string"
        ? JSON.parse(bodyExp)
        : [];
    } catch {
      // If not JSON, treat as single URL string
      if (typeof req.body.experienceCertificates === "string") {
        experienceCertificates = [req.body.experienceCertificates];
      }
    }
  }

  // If universityCertificate was provided as a URL in body (keep original behavior)
  if (!universityCertificate && req.body.universityCertificate) {
    universityCertificate = req.body.universityCertificate;
  }

  // --- HASH PASSWORD ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // --- CREATE REQUEST ---
  const request = await InstructorRequest.create({
    name,
    email,
    password: hashedPassword,
    role: "instructor",
    avatar,
    bio,
    field,
    bankAccountNumber: bankAccountNumber || "",
    bankName: bankName || "",
    iban: iban || "",
    universityCertificate: universityCertificate || "",
    experienceCertificates: experienceCertificates || [], // default []
    status: "pending",
    termsAccepted,
  });

  res.status(201).json({
    isSuccess: true,
    message: "Instructor request submitted successfully",
    data: request,
  });
});

// @desc    Get all instructor requests
// @route   GET /api/instructor-requests
// @access  Admin
const getRequests = asyncHandler(async (req, res) => {
  const requests = await InstructorRequest.find().populate(
    "user",
    "name email"
  );
  res.json({ isSuccess: true, data: requests });
});

// @desc    Update instructor request (approve or reject)
// @route   PUT /api/instructor-requests/:id
// @access  Admin
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
  submitRequest,
  getRequests,
  updateRequest,
  deleteRequest,
  addNote,
  editNote,
  deleteNote,
};
