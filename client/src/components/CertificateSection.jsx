import React, { useState } from 'react';
import { Upload, Download, Trash2, Eye, Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import {
  useGetEnrolledStudentsForCertificatesQuery,
  useUploadCertificateMutation,
  useDeleteCertificateMutation,
  useDownloadCertificateMutation
} from '../store/services/certificateApi';
import Card from './Card';
import Button from './Button';

const CertificateSection = ({ courseId }) => {
  const { user } = useAuth();
  const [uploadingFor, setUploadingFor] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Check if user can manage certificates (instructor or admin)
  const canManageCertificates = user?.role === 'instructor' || user?.role === 'admin';

  // RTK Query hooks
  const {
    data: studentsData,
    isLoading: loading,
    error: studentsError,
    refetch: refetchStudents
  } = useGetEnrolledStudentsForCertificatesQuery(courseId, {
    skip: !canManageCertificates
  });

  const [uploadCertificate] = useUploadCertificateMutation();
  const [deleteCertificate] = useDeleteCertificateMutation();
  const [downloadCertificate] = useDownloadCertificateMutation();

  const students = studentsData?.students || [];


  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file only.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadCertificate = async () => {
    if (!selectedFile || !selectedStudent) {
      toast.error('Please select a file and student');
      return;
    }

    try {
      setUploadingFor(selectedStudent._id);

      const formData = new FormData();
      formData.append('certificate', selectedFile);
      formData.append('courseId', courseId);
      formData.append('studentId', selectedStudent._id);

      const result = await uploadCertificate({ formData, courseId }).unwrap();
      
      toast.success(`Certificate uploaded successfully for ${selectedStudent.name}! Email notification sent.`);
      setShowUploadModal(false);
      setSelectedFile(null);
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error uploading certificate:', error);
      toast.error(error.data?.message || 'Error uploading certificate');
    } finally {
      setUploadingFor(null);
    }
  };

  const handleDeleteCertificate = async (certificateId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete the certificate for ${studentName}?`)) {
      return;
    }

    try {
      await deleteCertificate(certificateId).unwrap();
      toast.success('Certificate deleted successfully');
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast.error(error.data?.message || 'Error deleting certificate');
    }
  };

  const handleDownloadCertificate = async (certificateId) => {
    try {
      await downloadCertificate(certificateId).unwrap();
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error(error.data?.message || 'Error downloading certificate');
    }
  };

  const openUploadModal = (student) => {
    setSelectedStudent(student);
    setShowUploadModal(true);
    setSelectedFile(null);
  };

  if (!canManageCertificates) {
    return null; // Don't show certificate section for students
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading certificates...</span>
        </div>
      </Card>
    );
  }

  if (studentsError) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Error Loading Students</h4>
          <p className="text-gray-600 mb-4">
            {studentsError?.data?.message || 'Failed to load enrolled students'}
          </p>
          <Button onClick={() => refetchStudents()} variant="primary">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              🏆 Certificate Management
            </h3>
            <p className="text-gray-600 mt-1">
              Upload and manage completion certificates for enrolled students
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">{students.length}</span> enrolled students
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Students Enrolled</h4>
            <p className="text-gray-600">
              Students need to enroll in this course before certificates can be issued.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={student.avatar}
                              alt={student.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.hasCertificate ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Issued
                          </span>
                          {student.certificate && (
                            <span className="ml-2 text-xs text-gray-500">
                              {new Date(student.certificate.issuedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          ⏳ Not Issued
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {student.hasCertificate ? (
                        <div className="flex space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openUploadModal(student)}
                            disabled={uploadingFor === student._id}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Replace
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteCertificate(student.certificate._id, student.name)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openUploadModal(student)}
                          disabled={uploadingFor === student._id}
                        >
                          {uploadingFor === student._id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-1" />
                              Upload Certificate
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Certificate
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Uploading certificate for: <strong>{selectedStudent?.name}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Only PDF files are allowed (max 10MB)
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Certificate File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-green-600">
                  ✅ Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowUploadModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUploadCertificate}
                disabled={!selectedFile || uploadingFor}
                className="flex-1"
              >
                {uploadingFor ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload & Send'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateSection;
