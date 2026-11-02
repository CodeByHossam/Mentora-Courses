const logger = require('../../utils/logger');
const Comment = require("../../models/Comment");
const Test = require("../../models/Test");
const TestAnswer = require("../../models/TestAnswer");
const Attachment = require("../../models/Attachment");
const validateCourseAccess = require("../../middleware/validateCourseAccess");
const { uploadFile, getFile, deleteFile } = require("../../utils/aws");

const {
  NotFoundError,
  AuthorizationError,
  ValidationError,
} = require("../../utils/errors");

// ----------------------
// GET all interactions (Comment, tests+submissions, attachments)
// ----------------------
// ----------------------

exports.addAttachment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, lessonId } = req.body;
    const user = req.user;

    if (!req.file) throw new ValidationError("File is required");
    await validateCourseAccess(courseId, user);

    let fileKey;
    try {
      const { key } = await uploadFile(req.file, "attachments");
      fileKey = key;
    } catch (err) {
      logger.error("S3 upload failed:", err);
      throw new ValidationError("Failed to upload file");
    }

    const attachmentData = {
      title: title || req.file.originalname,
      description: description?.trim(),
      lesson: lessonId || null,
      fileUrl: fileKey,
      fileSize: req.file.size,
      uploadedBy: user._id,
      course: courseId,
    };

    const newAttachment = await Attachment.create(attachmentData);
    await newAttachment.populate("uploadedBy", "name profilePicture");

    res.status(201).json({
      success: true,
      message: "Attachment added successfully.",
      data: newAttachment,
    });
  } catch (error) {
    next(error);
  }
};

exports.editAttachment = async (req, res, next) => {
  try {
    const { courseId, attachmentId } = req.params;
    const { title, description, lessonId } = req.body;
    const user = req.user;

    await validateCourseAccess(courseId, user);

    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) throw new NotFoundError("Attachment not found");
    if (attachment.course.toString() !== courseId)
      throw new ValidationError("Attachment does not belong to this course");

    if (
      attachment.uploadedBy.toString() !== user._id.toString() &&
      user.role !== "admin"
    )
      throw new AuthorizationError("Not authorized to edit this attachment");

    let fileUrl = attachment.fileUrl;
    let fileType = attachment.fileType;
    let fileSize = attachment.fileSize;

    if (req.file) {
      try {
        const uploadResult = await uploadFile(req.file, "attachments");

        if (attachment.fileUrl) {
          try {
            await deleteFile(attachment.fileUrl);
          } catch (err) {
            logger.error("Failed to delete old attachment:", err);
          }
        }

        fileUrl = uploadResult.key;
        fileType = getFileTypeFromName(
          req.file.originalname,
          req.file.mimetype
        );
        fileSize = req.file.size;
      } catch (err) {
        throw new ValidationError("Failed to upload file");
      }
    }

    attachment.title = title || attachment.title;
    attachment.description = description?.trim();
    attachment.lesson = lessonId || null;
    attachment.fileUrl = fileUrl;
    attachment.fileType = fileType;
    attachment.fileSize = fileSize;

    await attachment.save();
    await attachment.populate("uploadedBy", "name profilePicture");

    res.status(200).json({
      success: true,
      message: "Attachment updated successfully.",
      data: attachment,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeAttachment = async (req, res, next) => {
  try {
    const { courseId, attachmentId } = req.params;
    const user = req.user;
    const isAdmin = user.role === "admin";

    await validateCourseAccess(courseId, user);

    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) throw new NotFoundError("Attachment not found");
    if (attachment.course.toString() !== courseId)
      throw new ValidationError("Attachment does not belong to this course");

    if (!isAdmin && attachment.uploadedBy.toString() !== user._id.toString())
      throw new AuthorizationError("Not authorized to delete this attachment");

    if (attachment.fileUrl) {
      try {
        await deleteFile(attachment.fileUrl);
      } catch (err) {
        logger.error("Failed to delete attachment:", err);
      }
    }

    await attachment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Attachment removed successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllAttachments = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    await validateCourseAccess(courseId, req.user);

    const attachments = await Attachment.find({ course: courseId }).populate(
      "uploadedBy",
      "name profilePicture"
    );

    const attachmentsWithSignedUrls = await Promise.all(
      attachments.map(async (attachment) => {
        let signedUrl = null;
        if (attachment.fileUrl) {
          try {
            signedUrl = await getFile(attachment.fileUrl, 300);
          } catch (err) {
            logger.error("Failed to generate signed URL:", err);
          }
        }
        return { ...attachment.toObject(), signedUrl };
      })
    );

    res.status(200).json({
      success: true,
      message: "Attachments fetched successfully.",
      data: attachmentsWithSignedUrls,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAttachment = async (req, res, next) => {
  try {
    const { courseId, attachmentId } = req.params;
    await validateCourseAccess(courseId, req.user);

    const attachment = await Attachment.findById(attachmentId).populate(
      "uploadedBy",
      "name profilePicture"
    );

    if (!attachment) throw new NotFoundError("Attachment not found");

    let signedUrl = null;
    if (attachment.fileUrl) {
      try {
        signedUrl = await getFile(attachment.fileUrl, 300);
      } catch (err) {
        logger.error("Failed to generate signed URL:", err);
      }
    }

    res.status(200).json({
      success: true,
      message: "Attachment fetched successfully.",
      data: { ...attachment.toObject(), signedUrl },
    });
  } catch (error) {
    next(error);
  }
};

