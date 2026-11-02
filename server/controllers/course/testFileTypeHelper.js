// Dead helper preserved verbatim from testController.js (was never exported or called).

// ----------------------
// ATTACHMENTS CRUD
// ----------------------
// Helper function to determine file type from filename and mimetype
function getFileTypeFromName(filename, mimetype) {
  if (!filename || !mimetype) return "unknown";

  // Get file extension
  const ext = filename.split(".").pop().toLowerCase();

  // Common file types mapping
  const typeMap = {
    // Images
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    svg: "image",
    // Documents
    pdf: "document",
    doc: "document",
    docx: "document",
    txt: "document",
    // Videos
    mp4: "video",
    avi: "video",
    mov: "video",
    wmv: "video",
    // Audio
    mp3: "audio",
    wav: "audio",
    ogg: "audio",
    // Archives
    zip: "archive",
    rar: "archive",
    "7z": "archive",
    // Spreadsheets
    xls: "spreadsheet",
    xlsx: "spreadsheet",
    csv: "spreadsheet",
    // Presentations
    ppt: "presentation",
    pptx: "presentation",
  };

  // First try to get type from extension
  if (typeMap[ext]) {
    return typeMap[ext];
  }

  // If extension not found, try to determine from mimetype
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype.includes("pdf")) return "document";
  if (mimetype.includes("document")) return "document";
  if (mimetype.includes("sheet")) return "spreadsheet";
  if (mimetype.includes("presentation")) return "presentation";

  return "unknown";
}

module.exports = {
  getFileTypeFromName
};
