const { getCertificatesByCourse, getStudentCertificates, getEnrolledStudentsForCertificates } = require('./certificateQueryController');
const { uploadCertificate, downloadCertificate, deleteCertificate } = require('./certificateFileController');

module.exports = {
  getCertificatesByCourse,
  getStudentCertificates,
  uploadCertificate,
  downloadCertificate,
  deleteCertificate,
  getEnrolledStudentsForCertificates,
};
