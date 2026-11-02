import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { selectCurrentUser } from "../../store/slices/authSlice";
import { useGetCourseQuery } from "../../store/services/courseApi";
import { useCreateEnrollmentRequestMutation } from "../../store/services/enrollmentRequestApi";
import { ProgressLoader } from "../../components/common";
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

  return null;
};

export default CourseEnrollment;
