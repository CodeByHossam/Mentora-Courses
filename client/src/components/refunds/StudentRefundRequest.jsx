import React, { useState, useEffect } from 'react';
import { 
  useCreateStudentRefundMutation, 
  useGetStudentRefundsQuery,
  useGetRefundStatsQuery 
} from '../../store/services/refundApi';
import { useGetBillingAccountQuery } from '../../store/services/billingApi';
import { toast } from 'react-toastify';
import { 
  DollarSign, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RotateCw,
  Gift,
  User,
  GraduationCap,
  Upload
} from 'lucide-react';

const StudentRefundRequest = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    courseId: '',
    paymentId: '',
    reason: '',
    description: '',
    requestedAmount: ''
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [supportingFiles, setSupportingFiles] = useState([]);

  // API hooks
  const [createRefund, { isLoading: isCreating }] = useCreateStudentRefundMutation();
  const { data: refunds, isLoading: isLoadingRefunds, refetch: refetchRefunds } = useGetStudentRefundsQuery();
  const { data: refundStats } = useGetRefundStatsQuery({ period: '30d' });
  const { data: billingData } = useGetBillingAccountQuery();

  // Extract course purchases from billing data
  const coursePurchases = billingData?.data?.coursePurchases || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCourseSelect = (e) => {
    const courseId = e.target.value;
    
    if (courseId === 'test-course') {
      // Handle test course selection
      const testCourse = {
        courseId: 'test-course',
        courseName: 'Test Course',
        purchaseAmount: 50,
        paymentId: 'test-payment',
        purchaseDate: new Date().toISOString()
      };
      setSelectedCourse(testCourse);
      setFormData(prev => ({
        ...prev,
        courseId: courseId,
        paymentId: 'test-payment',
        requestedAmount: '50'
      }));
    } else {
      const course = availableCourses.find(c => c.courseId === courseId);
      setSelectedCourse(course);
      setFormData(prev => ({
        ...prev,
        courseId: courseId,
        paymentId: course?.paymentId || '',
        requestedAmount: course?.purchaseAmount || ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSupportingFiles(files);
  };

  const removeFile = (index) => {
    setSupportingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form Data:', formData);
    console.log('Supporting Files:', supportingFiles);
    
    if (!formData.courseId || !formData.reason || !formData.requestedAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const submitData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
          console.log(`Added to FormData: ${key} = ${formData[key]}`);
        }
      });
      
      // Add supporting documents
      supportingFiles.forEach(file => {
        submitData.append('supportingDocuments', file);
        console.log(`Added file: ${file.name}`);
      });
      
      console.log('Submitting refund request...');
      await createRefund(submitData).unwrap();
      toast.success('Refund request submitted successfully!');
      
      // Reset form
      setFormData({
        courseId: '',
        paymentId: '',
        reason: '',
        description: '',
        requestedAmount: ''
      });
      setSelectedCourse(null);
      setSupportingFiles([]);
      setShowForm(false);
      refetchRefunds();
    } catch (error) {
      console.error('Refund submission error:', error);
      toast.error(error?.data?.message || 'Failed to submit refund request');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <RotateCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter out courses that already have pending/approved refund requests
  const existingRefundCourses = refunds?.refunds?.map(r => r.relatedCourse) || [];
  const availableCourses = coursePurchases.filter(course => 
    !existingRefundCourses.includes(course.courseId)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
              Course Refund Requests
            </h2>
            <p className="text-gray-600 mt-1">
              Request refunds for course purchases that don't meet your expectations
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {showForm ? 'Cancel' : 'Request Refund'}
            </button>
            
            {/* Debug Info */}
            <div className="text-sm text-gray-500">
              <span>Courses: {coursePurchases.length}</span>
              <span className="ml-2">Available: {availableCourses.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-6 w-6 text-blue-600 mr-2" />
          Your Refund Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Pending Requests</div>
            <div className="text-2xl font-bold text-yellow-900">
              {refunds?.refunds?.filter(r => r.status === 'pending').length || 0}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Approved Requests</div>
            <div className="text-2xl font-bold text-green-900">
              {refunds?.refunds?.filter(r => r.status === 'approved').length || 0}
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Rejected Requests</div>
            <div className="text-2xl font-bold text-red-900">
              {refunds?.refunds?.filter(r => r.status === 'rejected').length || 0}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Approved Amount</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(
                refunds?.refunds
                  ?.filter(r => r.status === 'approved')
                  ?.reduce((sum, r) => sum + (r.requestedAmount || 0), 0) || 0
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Refund Request Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Submit Refund Request
          </h3>
          
          {/* Gift Card Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Gift className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  Refund Processing Information
                </h4>
                <p className="text-sm text-blue-800">
                  All approved refunds will be processed as <strong>gift cards</strong> that can be used for future course purchases. 
                  Gift cards are valid for 1 year from the issue date and will be added to your account upon approval.
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Course Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course *
              </label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleCourseSelect}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a course...</option>
                {availableCourses.length > 0 ? (
                  availableCourses.map((course) => (
                    <option key={course.courseId} value={course.courseId}>
                      {course.courseName || `Course ${course.courseId}`} - {formatCurrency(course.purchaseAmount)}
                    </option>
                  ))
                ) : (
                  <option value="test-course">Test Course - $50.00 (For Testing)</option>
                )}
              </select>
              
              {availableCourses.length === 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  ⚠️ No courses found. Using test data for demonstration.
                </p>
              )}
            </div>

            {/* Course Details */}
            {selectedCourse && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Course Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Purchase Amount:</span>
                    <span className="ml-2 font-medium">{formatCurrency(selectedCourse.purchaseAmount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Purchase Date:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedCourse.purchaseDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="ml-2 font-medium capitalize">{selectedCourse.paymentMethod?.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium capitalize">{selectedCourse.status}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Refund Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="requestedAmount"
                  value={formData.requestedAmount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max={selectedCourse?.purchaseAmount || 0}
                  required
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              {selectedCourse && (
                <p className="text-sm text-gray-600 mt-1">
                  Maximum refundable: {formatCurrency(selectedCourse.purchaseAmount)}
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Refund *
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a reason...</option>
                <option value="course_not_as_described">Course not as described</option>
                <option value="technical_issues">Technical issues</option>
                <option value="instructor_unavailable">Instructor unavailable</option>
                <option value="content_quality_poor">Poor content quality</option>
                <option value="duplicate_purchase">Duplicate purchase</option>
                <option value="changed_mind">Changed my mind</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please provide additional details about your refund request..."
              />
            </div>

            {/* Supporting Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Documents (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">
                    <label htmlFor="supporting-docs" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500 font-medium">
                        Upload supporting documents
                      </span>
                      <input
                        id="supporting-docs"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Images, PDFs, or documents (max 5 files, 10MB each)
                    </p>
                  </div>
                </div>
                
                {/* File List */}
                {supportingFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                    {supportingFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center"
              >
                {isCreating ? (
                  <>
                    <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* No Courses Available */}
      {availableCourses.length === 0 && !showForm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800">No Courses Available for Refund</h3>
              <p className="text-yellow-700 mt-1">
                You either haven't purchased any courses yet, or all your courses already have refund requests.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Existing Refund Requests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 text-gray-600 mr-2" />
            Your Refund Requests
          </h3>
        </div>

        {isLoadingRefunds ? (
          <div className="p-6 text-center">
            <RotateCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading refund requests...</p>
          </div>
        ) : refunds?.refunds?.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {refunds.refunds.map((refund) => (
              <div key={refund._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getStatusIcon(refund.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(refund.status)}`}>
                        {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1">
                      {refund.relatedCourse?.title || `Course ${refund.relatedCourse}`}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Requested Amount:</span> {formatCurrency(refund.requestedAmount)}
                      </div>
                      <div>
                        <span className="font-medium">Original Amount:</span> {formatCurrency(refund.originalAmount)}
                      </div>
                      <div>
                        <span className="font-medium">Reason:</span> {refund.reason.replace(/_/g, ' ')}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span> {formatDate(refund.createdAt)}
                      </div>
                    </div>

                    {refund.description && (
                      <p className="text-sm text-gray-700 mb-3">
                        <span className="font-medium">Details:</span> {refund.description}
                      </p>
                    )}

                    {refund.adminNotes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium text-gray-900">Admin Notes:</span>
                          <span className="text-gray-700 ml-2">{refund.adminNotes}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>No refund requests found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRefundRequest;
