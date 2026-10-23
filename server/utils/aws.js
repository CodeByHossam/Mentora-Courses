// utils/s3Pdf.js
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a PDF file to S3 (private by default)
 * @param {Object} file - File object from multer (memoryStorage)
 * @returns {Promise<{ key: string }>} - The file key
 */
const sanitizeFolder = (folder = "") => folder.replace(/^\/+|\/+$/g, ""); 

const uploadFile = async (file, folder) => {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "video/mp4", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

  // For certificates folder, only allow PDFs
  if (folder === 'certificates' && file.mimetype !== 'application/pdf') {
    throw new Error("Only PDF files are allowed for certificates");
  }

  // For payout receipts and admin fee receipts, allow documents and images
  if (folder === 'payout-receipts' || folder === 'admin-fee-receipts') {
    const receiptTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!receiptTypes.includes(file.mimetype)) {
      throw new Error("Only PDF, JPG, PNG, DOC, and DOCX files are allowed for receipts");
    }
  } else if (!allowedTypes.includes(file.mimetype)) {
    throw new Error("Only PDF, JPG, PNG, DOC, DOCX, and MP4 files are allowed");
  }

  const safeFolder = sanitizeFolder(folder); // remove leading/trailing slashes
  const key = safeFolder
    ? `${safeFolder}/${uuidv4()}-${file.originalname}`
    : `general/${uuidv4()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);
  return { key };
};

/**
 * Generate signed URL for a private PDF
 * @param {string} key - File key in the bucket
 * @param {number} expiresIn - Expiration in seconds (default: 60)
 * @returns {Promise<string>} - Signed URL
 */
const getFile = async (key, expiresIn = 60) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3, command, {
    expiresIn,
    BucketKeyEnabled: true,
  });
};

/**
 * Delete a PDF from S3
 * @param {string} key - File key in the bucket
 * @returns {Promise<void>}
 */
const deleteFile = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  await s3.send(command);
};

module.exports = { uploadFile, getFile, deleteFile };
