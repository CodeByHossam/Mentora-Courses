const logger = require('../../utils/logger');
const Certificate = require("../../models/Certificate");
const Course = require("../../models/Course");
const User = require("../../models/User");

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
  getEnrolledStudentsForCertificates
};
