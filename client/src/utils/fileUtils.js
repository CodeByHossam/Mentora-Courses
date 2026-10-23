// Utility functions for file handling

/**
 * ONE UNIFIED DOWNLOAD FUNCTION FOR ALL FILE TYPES
 * @param {string} fileUrl - The Cloudinary file URL
 * @param {string} fileName - The desired filename for download
 * @param {string} fileType - The file type (e.g., 'pdf', 'docx')
 * @returns {string} - The formatted download URL
 */
export const getDownloadUrl = (fileUrl, fileName, fileType) => {
  if (!fileUrl) return "";

  // ONE UNIFIED LOGIC: Use original URL for all file types
  
  return fileUrl;
};


/**
 * Ensures a filename has the correct extension for download
 * @param {string} fileName - The filename
 * @param {string} fileType - The file type (e.g., 'pdf', 'docx')
 * @returns {string} - The filename with correct extension
 */
export const ensureFileExtension = (fileName, fileType) => {
  if (!fileName || !fileType) return fileName;

  const extension = fileType.toLowerCase();
  const fileNameLower = fileName.toLowerCase();

  // If filename already has the correct extension, return as is
  if (fileNameLower.endsWith(`.${extension}`)) {
    return fileName;
  }

  // Add the extension
  return `${fileName}.${extension}`;
};

/**
 * Gets the appropriate MIME type for a file extension
 * @param {string} extension - The file extension
 * @returns {string} - The MIME type
 */
export const getMimeType = (extension) => {
  const mimeTypes = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    zip: "application/zip",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mp3: "audio/mpeg",
    wav: "audio/wav",
  };

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
};

/**
 * Creates a proper download link for files
 * @param {string} fileUrl - The file URL
 * @param {string} fileName - The filename
 * @param {string} fileType - The file type
 * @returns {Object} - Object with href and download attributes
 */
export const createDownloadLink = (fileUrl, fileName, fileType) => {
  const downloadUrl = getDownloadUrl(fileUrl, fileName, fileType);
  const downloadFileName = ensureFileExtension(fileName, fileType);

  return {
    href: downloadUrl,
    download: downloadFileName,
    target: "_blank",
    rel: "noopener noreferrer",
  };
};
