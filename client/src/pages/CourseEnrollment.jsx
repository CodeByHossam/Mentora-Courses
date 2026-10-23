import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { selectCurrentUser } from "../store/slices/authSlice";
import { useGetCourseQuery } from "../store/services/courseApi";
import { useCreateEnrollmentRequestMutation } from "../store/services/enrollmentRequestApi";
import ProgressLoader from "../components/ProgressLoader";
import { ArrowLeft, BookOpen, Users, Clock, Star, CheckCircle, AlertCircle, Send, Sparkles } from "lucide-react";

const CourseEnrollment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("none");
  const [bankTransferData, setBankTransferData] = useState({
    transferredAmount: "",
    bankName: "",
    referenceNumber: "",
    transferDate: "",
  });
  const [bankTransferProof, setBankTransferProof] = useState(null);
  const [createEnrollmentRequest, { isLoading }] =
    useCreateEnrollmentRequestMutation();
  const {
    data: course,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useGetCourseQuery(courseId);

  // Redirect if user not logged in
  useEffect(() => {
    if (!user) {
      toast.info("Please login to enroll in this course");
      navigate("/login", { state: { from: `/courses/${courseId}` } });
    }
  }, [user, navigate, courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    if (!courseId) {
      toast.error("Course ID is missing. Please try again.");
      return;
    }
    
    // Validate bank transfer data if selected
    if (paymentMethod === "direct_transfer") {
      if (!bankTransferData.transferredAmount || !bankTransferData.bankName || 
          !bankTransferData.referenceNumber || !bankTransferData.transferDate) {
        toast.error("Please fill in all bank transfer details");
        return;
      }
      if (!bankTransferProof) {
        toast.error("Please upload bank transfer proof document");
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('courseId', courseId);
      formData.append('message', message);
      formData.append('paymentMethod', paymentMethod);
      
      
      if (paymentMethod === "direct_transfer") {
        formData.append('transferredAmount', bankTransferData.transferredAmount);
        formData.append('bankName', bankTransferData.bankName);
        formData.append('referenceNumber', bankTransferData.referenceNumber);
        formData.append('transferDate', bankTransferData.transferDate);
        formData.append('bankTransferProof', bankTransferProof);
      }

      await createEnrollmentRequest(formData).unwrap();
      toast.success("Enrollment request submitted successfully!");
      navigate(`/courses/${courseId}`);
    } catch (error) {
      console.error("Failed to submit enrollment request:", error);
      toast.error(
        error.data?.message ||
          "Failed to submit enrollment request. Please try again."
      );
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a valid image (JPG, PNG) or PDF file");
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      
      setBankTransferProof(file);
    }
  };

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ProgressLoader isVisible={true} message="Loading course..." />
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            Error loading course
          </h2>
          <p className="text-gray-700">
            {courseError.data?.message || "Something went wrong."}
          </p>
          <button
            onClick={() => navigate("/courses")}
            className="mt-4 px-4 py-2 bg-[rgb(48,146,85)] text-white rounded-lg hover:bg-[rgb(33,98,58)] transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Course not found
          </h2>
          <button
            onClick={() => navigate("/courses")}
            className="px-4 py-2 bg-[rgb(48,146,85)] text-white rounded-lg hover:bg-[rgb(33,98,58)] transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-r from-blue-400 to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mb-6 shadow-xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Join Your Learning Journey
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Take the next step towards mastering new skills with this expertly crafted course
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {/* Enhanced Course Preview */}
          <div className="relative bg-gradient-to-r from-blue-600 via-green-600 to-blue-700 px-8 py-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl ring-4 ring-white/30 shadow-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {course.imageUrl ? (
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full rounded-2xl object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`${course.imageUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                  <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-4 h-4 text-yellow-800" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {course.title}
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-2 text-blue-100 mb-2">
                  <Users className="w-4 h-4" />
                  <span>by {course.instructor?.name || 'Expert Instructor'}</span>
                </div>
                <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-sm text-white">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {course.category?.name || 'Professional Development'}
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-white/80 text-sm mb-1">Course Status</div>
                  <div className="flex items-center justify-center gap-2 text-white font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span className="capitalize">{course.status || 'Available'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Course Details */}
          <div className="p-8 md:p-12">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Course Overview
                </h3>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 border border-blue-100">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {course.description || 'Discover an expertly crafted learning experience designed to help you master new skills and advance your career.'}
                </p>
              </div>
            </div>

            {/* Enhanced Course Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border border-blue-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-medium text-blue-600 mb-1">Active Students</div>
                <div className="text-3xl font-bold text-gray-900">
                  {course.enrolledStudents?.length || 0}
                </div>
              </div>
              <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border border-green-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-medium text-green-600 mb-1">Total Lessons</div>
                <div className="text-3xl font-bold text-gray-900">
                  {course.lessons?.length || 0}
                </div>
              </div>
              <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border border-purple-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-medium text-purple-600 mb-1">Learning Time</div>
                <div className="text-3xl font-bold text-gray-900">
                  Self-paced
                </div>
              </div>
            </div>

            {/* Enhanced Enrollment Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-gradient-to-r from-blue-50 via-white to-green-50 rounded-2xl p-8 border border-blue-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Share Your Learning Goals
                  </h3>
                </div>
                <label
                  htmlFor="message"
                  className="block text-lg font-medium text-gray-700 mb-4"
                >
                  Tell us about your motivation and what you hope to achieve with this course
                </label>
                <div className="relative">
                  <textarea
                    id="message"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 resize-none text-lg bg-white/80 backdrop-blur-sm"
                    placeholder="I'm excited to join this course because...\n\nMy learning goals include...\n\nI hope to apply these skills to..."
                    required
                    maxLength={500}
                  />
                  <div className="absolute bottom-4 right-4 text-sm text-gray-400 bg-white/80 px-2 py-1 rounded-lg">
                    {message.length}/500
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-gradient-to-r from-green-50 via-white to-blue-50 rounded-2xl p-8 border border-green-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Payment Method
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="none"
                        checked={paymentMethod === "none"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-lg font-medium text-gray-700">
                        Request enrollment only (no payment)
                      </span>
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="direct_transfer"
                        checked={paymentMethod === "direct_transfer"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-lg font-medium text-gray-700">
                        I have already made a bank transfer
                      </span>
                    </label>
                  </div>
                </div>

                {/* Bank Transfer Details Form */}
                {paymentMethod === "direct_transfer" && (
                  <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="text-xl font-bold text-blue-800 mb-4">
                      Bank Transfer Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transfer Amount ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={bankTransferData.transferredAmount}
                          onChange={(e) => setBankTransferData(prev => ({
                            ...prev,
                            transferredAmount: e.target.value
                          }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={bankTransferData.bankName}
                          onChange={(e) => setBankTransferData(prev => ({
                            ...prev,
                            bankName: e.target.value
                          }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                          placeholder="Enter bank name"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reference Number
                        </label>
                        <input
                          type="text"
                          value={bankTransferData.referenceNumber}
                          onChange={(e) => setBankTransferData(prev => ({
                            ...prev,
                            referenceNumber: e.target.value
                          }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                          placeholder="Transaction reference"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transfer Date
                        </label>
                        <input
                          type="date"
                          value={bankTransferData.transferDate}
                          onChange={(e) => setBankTransferData(prev => ({
                            ...prev,
                            transferDate: e.target.value
                          }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* File Upload */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Transfer Proof (Image or PDF)
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          required
                        />
                        {bankTransferProof && (
                          <div className="mt-2 text-sm text-green-600">
                            ✓ File selected: {bankTransferProof.name}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Supported formats: JPG, PNG, PDF. Maximum size: 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 pt-8">
                <button
                  type="button"
                  onClick={() => navigate(`/courses/${courseId}`)}
                  className="group flex-1 px-8 py-4 text-gray-700 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-lg transition-all duration-300 font-semibold text-lg"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back to Course
                  </div>
                </button>
                <button
                  type="submit"
                  disabled={isLoading || message.trim() === ""}
                  className="group flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl hover:from-blue-700 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Submitting Request...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Submit Enrollment Request</span>
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Enhanced Help Section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-blue-800 mb-2">
                      What happens next?
                    </h4>
                    <p className="text-blue-700 leading-relaxed">
                      Your enrollment request will be carefully reviewed by the instructor. You'll receive a notification once approved!
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-green-800 mb-2">
                      Why choose this course?
                    </h4>
                    <p className="text-green-700 leading-relaxed">
                      Expert instruction, practical projects, and a supportive learning community await you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEnrollment;
