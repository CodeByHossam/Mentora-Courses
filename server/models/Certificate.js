const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  certificateUrl: {
    type: String,
    required: false
  },
  certificateKey: {
    type: String,
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['issued', 'sent', 'viewed'],
    default: 'issued'
  },
  viewedDate: {
    type: Date
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
certificateSchema.index({ course: 1, student: 1 }, { unique: true });
certificateSchema.index({ student: 1 });
certificateSchema.index({ course: 1 });
certificateSchema.index({ instructor: 1 });

// Virtual for certificate ID display
certificateSchema.virtual('certificateId').get(function() {
  return `CERT-${this.course.toString().slice(-6)}-${this.student.toString().slice(-6)}`;
});

// Method to mark certificate as viewed
certificateSchema.methods.markAsViewed = function() {
  this.status = 'viewed';
  this.viewedDate = new Date();
  return this.save();
};

// Method to increment download count
certificateSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastDownloadDate = new Date();
  return this.save();
};

// Method to mark email as sent
certificateSchema.methods.markEmailSent = function() {
  this.emailSent = true;
  this.emailSentDate = new Date();
  this.status = 'sent';
  return this.save();
};

module.exports = mongoose.model('Certificate', certificateSchema);
