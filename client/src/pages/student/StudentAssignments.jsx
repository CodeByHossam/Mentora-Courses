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

  return null;
};

export default StudentAssignments;
