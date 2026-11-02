const InstructorRequest = require("../../models/InstructorRequestModel");
const User = require("../../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { uploadToCloudinary } = require("../../utils/cloudinary");


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

module.exports = {
  submitRequest
};
