const express = require("express");
const router = express.Router();
const {
  submitRequest,
  getRequests,
  updateRequest,
  deleteRequest,
  addNote,
  editNote,
  deleteNote,
} = require("../controllers/instructorRequestController");

const { protect, admin, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // multer for docs upload

// Instructor  submits request (PUBLIC)  (with multiple docs)
router.post(
  "/",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "universityCertificate", maxCount: 1 },
    { name: "experienceCertificates", maxCount: 5 },
  ]),
  submitRequest
);

// Admin views all requests
router.get("/", protect, admin, getRequests);

// Admin approves/Reject
router.patch("/:id", protect, admin, updateRequest);
// delete request by admin
router.delete("/:id", protect, admin, deleteRequest);
// adding notes by admin
router.post("/:id/note", protect, admin, addNote);
// edit admin note
router.put("/:id/notes/:noteId", protect, admin, editNote);
// delete admin note
router.delete("/:id/notes/:noteId", protect, admin, deleteNote);

module.exports = router;
