import React, { useState, useRef } from "react";
import { 
  FileText, 
  Download, 
  Upload, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  BookOpen,
  User,
  Star,
  Eye,
  X,
  Plus
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";

const StudentAssignments = () => {
  const [selectedTest, setSelectedTest] = useState(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const fileInputRef = useRef(null);

  // TODO: Replace with your existing test/assignment API
  const tests = []; // This will be connected to your existing API
  const isLoading = false;
  const error = null;
  const isSubmitting = false;

  // Filter tests based on status
  const filteredTests = tests.filter(test => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return test.submissionStatus === "pending";
    if (filterStatus === "submitted") return test.submissionStatus === "submitted";
    if (filterStatus === "graded") return test.submissionStatus === "graded";
    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, text: "Pending" },
      submitted: { color: "bg-blue-100 text-blue-800", icon: CheckCircle, text: "Submitted" },
      graded: { color: "bg-green-100 text-green-800", icon: Star, text: "Graded" }
    };
    
    const badge = badges[status] || badges.pending;
    const IconComponent = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const handleDownloadTest = async (testId, testTitle) => {
    // TODO: Implement with your existing test API
    toast.info("Download functionality will be connected to your existing test API");
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    // TODO: Implement with your existing test API
    toast.info("Submission functionality will be connected to your existing test API");
    setIsSubmissionModalOpen(false);
    setSelectedFile(null);
    setSubmissionNotes("");
    setSelectedTest(null);
  };

  const openSubmissionModal = (test) => {
    setSelectedTest(test);
    setIsSubmissionModalOpen(true);
  };

  const closeSubmissionModal = () => {
    setIsSubmissionModalOpen(false);
    setSelectedTest(null);
    setSelectedFile(null);
    setSubmissionNotes("");
  };

  const isOverdue = (dueDate) => {
    return dueDate && new Date() > new Date(dueDate);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Assignments</h3>
            <p className="text-red-600 mb-4">{error?.data?.message || "Failed to load assignments"}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 ">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                📝 My Assignments
              </h1>
              <p className="text-secondary">
                View and submit your course assignments and tests
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{color: 'var(--info)'}}>{tests.length}</div>
              <div className="text-sm text-muted">Total Assignments</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 card rounded-lg p-1">
            {[
              { key: "all", label: "All", count: tests.length },
              { key: "pending", label: "Pending", count: tests.filter(t => t.submissionStatus === "pending").length },
              { key: "submitted", label: "Submitted", count: tests.filter(t => t.submissionStatus === "submitted").length },
              { key: "graded", label: "Graded", count: tests.filter(t => t.submissionStatus === "graded").length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  filterStatus === key
                    ? "text-white shadow-sm"
                    : "text-secondary hover:bg-accent"
                }`}
                style={filterStatus === key ? {backgroundColor: 'var(--info)'} : {}}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Assignments Grid */}
        {filteredTests.length === 0 ? (
          <div className="card rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary mb-2">
              {filterStatus === "all" ? "No Assignments Yet" : `No ${filterStatus} Assignments`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === "all" 
                ? "You don't have any assignments at the moment. Check back later or enroll in more courses!"
                : `You don't have any ${filterStatus} assignments right now.`
              }
            </p>
            <button
              onClick={() => setFilterStatus("all")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Assignments
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTests.map((test) => (
              <div
                key={test._id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {test.title}
                    </h3>
                    {getStatusBadge(test.submissionStatus)}
                  </div>
                  
                  {/* Course Info */}
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span className="font-medium">{test.course?.title}</span>
                  </div>
                  
                  {/* Instructor */}
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <User className="w-4 h-4 mr-2" />
                    <span>{test.instructor?.name}</span>
                  </div>

                  {/* Description */}
                  {test.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {test.description}
                    </p>
                  )}

                  {/* Due Date */}
                  {test.dueDate && (
                    <div className={`flex items-center text-sm mb-4 ${
                      isOverdue(test.dueDate) ? "text-red-600" : "text-gray-600"
                    }`}>
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        Due: {format(new Date(test.dueDate), "MMM dd, yyyy 'at' h:mm a")}
                      </span>
                      {isOverdue(test.dueDate) && (
                        <AlertCircle className="w-4 h-4 ml-2 text-red-500" />
                      )}
                    </div>
                  )}

                  {/* Submission Info */}
                  {test.submission && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-sm text-gray-600 mb-1">
                        Submitted: {format(new Date(test.submission.submittedAt), "MMM dd, yyyy")}
                      </div>
                      {test.submission.grade !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Grade:</span>
                          <span className="text-lg font-bold text-green-600">
                            {test.submission.grade}/100
                          </span>
                        </div>
                      )}
                      {test.submission.feedback && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-700">Feedback:</span>
                          <p className="text-sm text-gray-600 mt-1">{test.submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="px-6 pb-6">
                  <div className="flex space-x-2">
                    {/* Download Test Button */}
                    <button
                      onClick={() => handleDownloadTest(test._id, test.title)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Test
                    </button>

                    {/* Submit Answer Button */}
                    {test.submissionStatus === "pending" && !isOverdue(test.dueDate) && (
                      <button
                        onClick={() => openSubmissionModal(test)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm font-medium"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Answer
                      </button>
                    )}

                    {/* View Details Button */}
                    <button
                      onClick={() => setSelectedTest(test)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submission Modal */}
        {isSubmissionModalOpen && selectedTest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Submit Answer</h3>
                <button
                  onClick={closeSubmissionModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">{selectedTest.title}</h4>
                <p className="text-sm text-gray-600">{selectedTest.course?.title}</p>
              </div>

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Answer File *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                >
                  {selectedFile ? (
                    <div>
                      <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to select file</p>
                      <p className="text-xs text-gray-500">Max size: 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                />
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional comments about your submission..."
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {submissionNotes.length}/1000 characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={closeSubmissionModal}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedFile || isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Answer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignments;
