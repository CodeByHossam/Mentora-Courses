const Certificate = require("../models/Certificate");
const Course = require("../models/Course");
const User = require("../models/User");
const { uploadFile, getFile, deleteFile } = require("../utils/aws");
const sendEmail = require("../utils/emailSender");
 
// @desc    Get all certificates for a course
// @route   GET /api/certificates/course/:courseId
// @access  Private (Instructor/Admin)
const getCertificatesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if course exists and user has permission
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only course instructor or admin can view certificates",
      });
    }

    const certificates = await Certificate.find({ course: courseId })
      .populate("student", "name email avatar")
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Certificate.countDocuments({ course: courseId });

    res.status(200).json({
      success: true,
      data: {
        certificates,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCertificates: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
     res.status(500).json({
      success: false,
      message: "Server error while fetching certificates",
    });
  }
};

// @desc    Get student's certificates
// @route   GET /api/certificates/student
// @access  Private (Student)
const getStudentCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const certificates = await Certificate.find({ student: req.user.id })
      .populate("course", "title description thumbnail")
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Certificate.countDocuments({ student: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        certificates,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCertificates: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
     res.status(500).json({
      success: false,
      message: "Server error while fetching certificates",
    });
  }
};

// @desc    Upload certificate for student
// @route   POST /api/certificates/upload
// @access  Private (Instructor/Admin)
const uploadCertificate = async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF certificate file",
      });
    }

    // Validate file type
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Only PDF files are allowed for certificates",
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only course instructor or admin can upload certificates",
      });
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      course: courseId,
      student: studentId,
    });

    if (existingCertificate) {
      // Delete old certificate from S3
      await deleteFile(existingCertificate.certificateKey);
    }

    // Upload to S3
    const { key } = await uploadFile(req.file, "certificates");

    // Create or update certificate record
    let certificate;
    if (existingCertificate) {
      certificate = await Certificate.findByIdAndUpdate(
        existingCertificate._id,
        {
          certificateUrl: null, // S3 uses signed URLs, not direct URLs
          certificateKey: key,
          instructor: req.user._id,
          issuedDate: new Date(),
          emailSent: false,
          status: "issued",
        },
        { new: true }
      )
        .populate("student", "name email")
        .populate("course", "title");
    } else {
      certificate = await Certificate.create({
        course: courseId,
        student: studentId,
        instructor: req.user._id,
        certificateUrl: null, // S3 uses signed URLs, not direct URLs
        certificateKey: key,
      });

      certificate = await Certificate.findById(certificate._id)
        .populate("student", "name email")
        .populate("course", "title");
    }

    // Send email notification
    try {
      const emailSubject = `🎓 Certificate of Completion - ${course.title}`;
      const emailText = `
Dear ${student.name},

Congratulations! You have successfully completed the course: ${course.title}

Your certificate is now ready for download. You can access it from your student dashboard.

This certificate validates your successful completion of the course and can be used for professional development, portfolio building, or career advancement.

Thank you for choosing Mentora for your learning journey. We hope this course has provided you with valuable knowledge and skills.

Keep learning and growing!

Best regards,
The Mentora Team
      `;

      await sendEmail({
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: emailSubject,
        text: emailText,
      });

      await certificate.markEmailSent();

     } catch (emailError) {
       // Don't fail the request if email fails
       console.error("Error sending email:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Certificate uploaded and sent successfully",
      data: certificate,
    });
  } catch (error) {
     res.status(500).json({
      success: false,
      message: "Server error while uploading certificate",
    });
  }
};

// @desc    Download certificate
// @route   GET /api/certificates/:certificateId/download
// @access  Private (Student - own certificates, Instructor/Admin - course certificates)
const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { token } = req.query;

    // If token is provided in query params, verify it manually
    let user = req.user;
    if (token && !user) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require("../models/User");
        user = await User.findById(decoded.id);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const certificate = await Certificate.findById(certificateId)
      .populate("course", "title instructor")
      .populate("student", "name email");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    // Check permissions
    const isStudent =
      user.role === "student" &&
      certificate.student._id.toString() === user._id.toString();
    const isInstructor =
      user.role === "instructor" &&
      certificate.course.instructor.toString() === user._id.toString();
    const isAdmin = user.role === "admin";

    if (!isStudent && !isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Mark as viewed if student is downloading
    if (isStudent && certificate.status === "sent") {
      await certificate.markAsViewed();
    }

    // Increment download count
    await certificate.incrementDownload();

    // Generate signed URL for S3 download and redirect
    const signedUrl = await getFile(certificate.certificateKey, 300); // 5 minutes expiry

    // Set response headers for file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate-${certificate.course.title}-${certificate.student.name}.pdf"`
    );

    // Redirect to signed URL for download
    res.redirect(signedUrl);
  } catch (error) {
     res.status(500).json({
      success: false,
      message: "Server error while downloading certificate",
    });
  }
};

// @desc    Delete certificate
// @route   DELETE /api/certificates/:certificateId
// @access  Private (Instructor/Admin)
const deleteCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId).populate(
      "course",
      "instructor"
    );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      certificate.course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only course instructor or admin can delete certificates",
      });
    }

    // Delete from S3
    await deleteFile(certificate.certificateKey);

    // Delete from database
    await Certificate.findByIdAndDelete(certificateId);

    res.status(200).json({
      success: true,
      message: "Certificate deleted successfully",
    });
  } catch (error) {
     res.status(500).json({
      success: false,
      message: "Server error while deleting certificate",
    });
  }
};

// @desc    Get enrolled students for certificate management
// @route   GET /api/certificates/course/:courseId/students
// @access  Private (Instructor/Admin)
const getEnrolledStudentsForCertificates = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId).populate(
      "enrolledStudents",
      "name email avatar"
    );
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get existing certificates for this course
    const existingCertificates = await Certificate.find({
      course: courseId,
    }).populate("student", "_id");

    const certificateStudentIds = existingCertificates.map((cert) =>
      cert.student._id.toString()
    );

    // Map students with certificate status
    const studentsWithCertificates = course.enrolledStudents.map((student) => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      avatar: student.avatar,
      hasCertificate: certificateStudentIds.includes(student._id.toString()),
      certificate:
        existingCertificates.find(
          (cert) => cert.student._id.toString() === student._id.toString()
        ) || null,
    }));

    res.status(200).json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
        },
        students: studentsWithCertificates,
        totalStudents: studentsWithCertificates.length,
        studentsWithCertificates: certificateStudentIds.length,
      },
    });
  } catch (error) {
     res.status(500).json({
      success: false,
      message: "Server error while fetching students",
    });
  }
};

module.exports = {
  getCertificatesByCourse,
  getStudentCertificates,
  uploadCertificate,
  downloadCertificate,
  deleteCertificate,
  getEnrolledStudentsForCertificates,
};
