import React from "react";
import { Clock, CheckCircle, XCircle, RotateCw, Upload, FileText, DollarSign } from "lucide-react";
import useStudentRefundRequest from "./useStudentRefundRequest";

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
    case 'processing': return <RotateCw className="h-5 w-5 text-blue-500 animate-spin" />;
    default: return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'processing': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const StudentRefundRequest = () => {
  const {
    showForm, setShowForm,
    formData, setFormData,
    selectedCourse, setSelectedCourse,
    supportingFiles, setSupportingFiles,
    isCreating,
    refunds, isLoadingRefunds,
    refundStats,
    availableCourses,
    handleInputChange,
    handleCourseSelect,
    handleFileChange,
    removeFile,
    handleSubmit,
    formatCurrency,
    formatDate,
  } = useStudentRefundRequest();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Requests</h1>
        <p className="text-gray-600">Submit and track your refund requests</p>
      </div>

      {refundStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center"><Clock className="h-8 w-8 text-yellow-500" /><div className="ml-3"><p className="text-sm font-medium text-gray-600">Pending</p><p className="text-2xl font-bold text-gray-900">{refundStats.pending || 0}</p></div></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center"><CheckCircle className="h-8 w-8 text-green-500" /><div className="ml-3"><p className="text-sm font-medium text-gray-600">Approved</p><p className="text-2xl font-bold text-gray-900">{refundStats.approved || 0}</p></div></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center"><XCircle className="h-8 w-8 text-red-500" /><div className="ml-3"><p className="text-sm font-medium text-gray-600">Rejected</p><p className="text-2xl font-bold text-gray-900">{refundStats.rejected || 0}</p></div></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center"><DollarSign className="h-8 w-8 text-blue-500" /><div className="ml-3"><p className="text-sm font-medium text-gray-600">Total Refunded</p><p className="text-2xl font-bold text-gray-900">{formatCurrency(refundStats.totalRefunded || 0)}</p></div></div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          {showForm ? 'Cancel Request' : 'New Refund Request'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit New Refund Request</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <select value={formData.courseId} onChange={handleCourseSelect} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                <option value="">Select a course</option>
                {availableCourses.map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.courseName} - {formatCurrency(course.purchaseAmount)}
                  </option>
                ))}
              </select>
            </div>

            {selectedCourse && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Course Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium text-gray-700">Course:</span><p className="text-gray-600">{selectedCourse.courseName}</p></div>
                  <div><span className="font-medium text-gray-700">Purchase Amount:</span><p className="text-gray-900 font-semibold">{formatCurrency(selectedCourse.purchaseAmount)}</p></div>
                  <div><span className="font-medium text-gray-700">Purchase Date:</span><p className="text-gray-600">{formatDate(selectedCourse.purchaseDate)}</p></div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Refund Reason</label>
              <select name="reason" value={formData.reason} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                <option value="">Select a reason</option>
                <option value="course_not_as_described">Course not as described</option>
                <option value="technical_issues">Technical issues</option>
                <option value="instructor_unavailable">Instructor unavailable</option>
                <option value="duplicate_purchase">Duplicate purchase</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Refund Amount</label>
              <input type="number" name="requestedAmount" value={formData.requestedAmount} onChange={handleInputChange} step="0.01" min="0" max={selectedCourse?.purchaseAmount || 0} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
              <p className="text-sm text-gray-500 mt-1">Maximum refund amount: {formatCurrency(selectedCourse?.purchaseAmount || 0)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Please provide additional details about your refund request..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Documents (Optional)</label>
              <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              {supportingFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {supportingFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button type="button" onClick={() => removeFile(index)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button type="submit" disabled={isCreating} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50">
                {isCreating ? (<><RotateCw className="h-5 w-5 mr-2 animate-spin" /> Submitting...</>) : (<><FileText className="h-5 w-5 mr-2" /> Submit Request</>)}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Refund Requests</h3>
        </div>
        <div className="p-6">
          {isLoadingRefunds ? (
            <div className="text-center py-8"><RotateCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" /><p className="text-gray-600">Loading refund requests...</p></div>
          ) : refunds?.refunds?.length > 0 ? (
            <div className="space-y-4">
              {refunds.refunds.map((refund) => (
                <div key={refund._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      {getStatusIcon(refund.status)}
                      <div className="ml-3">
                        <h4 className="font-medium text-gray-900">{refund.reason.replace(/_/g, ' ')}</h4>
                        <p className="text-sm text-gray-600">{refund.relatedCourse?.title || 'Course'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(refund.status)}`}>
                      {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium text-gray-700">Requested Amount:</span><p className="text-gray-900 font-semibold">{formatCurrency(refund.requestedAmount)}</p></div>
                    <div><span className="font-medium text-gray-700">Original Amount:</span><p className="text-gray-600">{formatCurrency(refund.originalAmount)}</p></div>
                    <div><span className="font-medium text-gray-700">Submitted:</span><p className="text-gray-600">{formatDate(refund.createdAt)}</p></div>
                    <div><span className="font-medium text-gray-700">Status:</span><p className="text-gray-600">{refund.status}</p></div>
                  </div>
                  {refund.description && (<div className="mt-3"><span className="font-medium text-gray-700">Description:</span><p className="text-gray-600 mt-1">{refund.description}</p></div>)}
                  {refund.adminNotes && (<div className="mt-3 p-3 bg-gray-50 rounded-lg"><span className="font-medium text-gray-700">Admin Notes:</span><p className="text-gray-600 mt-1">{refund.adminNotes}</p></div>)}
                  {refund.giftCard && (<div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200"><span className="font-medium text-green-700">Gift Card Created:</span><p className="text-green-600 mt-1">{refund.giftCard.cardNumber} - {formatCurrency(refund.giftCard.amount)}</p></div>)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No refund requests found</p>
              <p className="text-sm text-gray-500 mt-1">Submit your first refund request above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRefundRequest;
