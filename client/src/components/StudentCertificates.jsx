import React, { useState } from 'react';
import { Download, Award, Loader2, Calendar, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import {
  useGetStudentCertificatesQuery,
  useDownloadCertificateMutation
} from '../store/services/certificateApi';
import Card from './Card';
import Button from './Button';

const StudentCertificates = () => {
  const { user, token } = useAuth();
  const [downloading, setDownloading] = useState(null);

  // RTK Query hooks
  const {
    data: certificatesData,
    isLoading: loading,
    error: certificatesError
  } = useGetStudentCertificatesQuery(undefined, {
    skip: user?.role !== 'student'
  });

  const [downloadCertificate] = useDownloadCertificateMutation();

  const certificates = certificatesData?.certificates || [];


  const handleDownloadCertificate = async (certificateId, courseName) => {
    try {
      setDownloading(certificateId);
      
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }
      
      // Create download URL with proper backend server URL
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const downloadUrl = `${baseUrl}/certificates/${certificateId}/download?token=${encodeURIComponent(token)}`;
      
      // Open the download URL in a new tab/window
      window.open(downloadUrl, '_blank');
      toast.success(`Certificate for ${courseName} download started`);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error(error.message || 'Error downloading certificate');
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = (certificate) => {
    switch (certificate.status) {
      case 'issued':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Award className="w-3 h-3 mr-1" />
            Issued
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Sent
          </span>
        );
      case 'viewed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            👁️ Viewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            ⏳ Processing
          </span>
        );
    }
  };

  if (user?.role !== 'student') {
    return null;
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading certificates...</span>
        </div>
      </Card>
    );
  }

  if (certificatesError) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Error Loading Certificates</h4>
          <p className="text-gray-600 mb-4">
            {certificatesError?.data?.message || 'Failed to load certificates'}
          </p>
          <Button onClick={() => window.location.reload()} variant="primary">
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
              🏆 My Certificates
            </h3>
            <p className="text-gray-600 mt-1">
              View and download your course completion certificates
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">{certificates.length}</span> certificates
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎓</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Certificates Yet</h4>
            <p className="text-gray-600">
              Complete courses to earn certificates. Your achievements will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => (
              <Card key={certificate._id} className="p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
                <div className="flex flex-col h-full">
                  {/* Course thumbnail and title */}
                  <div className="flex items-start space-x-4 mb-4">
                    {certificate.course.thumbnail ? (
                      <img
                        src={certificate.course.thumbnail}
                        alt={certificate.course.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xl font-bold">
                          {certificate.course.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight mb-2">
                        {certificate.course.title}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {certificate.course.description || 'No description available'}
                      </p>
                    </div>
                  </div>

                  {/* Certificate details - flexible content area */}
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      {getStatusBadge(certificate)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Issued:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(certificate.issuedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Instructor:</span>
                      <span className="text-sm font-medium text-gray-900 truncate ml-2">
                        {certificate.instructor.name}
                      </span>
                    </div>

                    {certificate.downloadCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Downloads:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {certificate.downloadCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Certificate ID */}
                  <div className="text-xs text-gray-400 text-center mt-4 mb-3">
                    Certificate ID: CERT-{certificate._id.slice(-8)}
                  </div>

                  {/* Action buttons - always at bottom */}
                  <div className="pt-3 border-t border-gray-200 mt-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDownloadCertificate(certificate._id, certificate.course.title)}
                      disabled={downloading === certificate._id}
                      className="w-full"
                    >
                      {downloading === certificate._id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download Certificate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Achievement summary */}
      {certificates.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1">
              Congratulations on Your Achievements!
            </h4>
            <p className="text-gray-600">
              You have earned {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} so far. 
              Keep learning and growing!
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentCertificates;
