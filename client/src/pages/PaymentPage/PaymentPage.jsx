import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Redux
import {
  useGetCourseQuery,
  useInitiatePaymentMutation,
  useGetCsrfTokenQuery,
} from "../../store/services/courseApi";

// Components
import CourseSummary from "./components/CourseSummary";
import PaymentMethodSelector from "./components/PaymentMethodSelector";
import DirectBankTransfer from "./components/DirectBankTransfer";
import PaymentMethodUnavailable from "./components/PaymentMethodUnavailable";

const PaymentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("direct_transfer");
  const [paymentData, setPaymentData] = useState(null);

  // Redux queries
  const {
    data: courseResponse,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useGetCourseQuery(courseId);
  const { data: csrfResponse } = useGetCsrfTokenQuery();

  const [initiatePayment, { isLoading: isInitiatingPayment }] =
    useInitiatePaymentMutation();

  // getCourse transformResponse already returns response.data, so use directly
  const course = courseResponse;

  // Check available payment methods (card shown but unavailable for guidance)
  const getAvailableMethods = () => {
    return ["stripe", "direct_transfer"];
  };

  const availableMethods = getAvailableMethods();

  // Handle payment initiation
  const handleInitiatePayment = async (method) => {
    if (method !== "direct_transfer") {
      toast.info("card payment is not available please contact your instructor");
      return;
    }
    try {
      const response = await initiatePayment({
        courseId,
        method: "direct_transfer",
      }).unwrap();

      if (response.success) {
        setPaymentData(response.data);
        toast.success("Direct transfer payment initiated");
      } else {
        toast.error(response.message || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast.error(
        error?.data?.message || "Failed to initiate payment. Please try again."
      );
    }
  };

  // Handle direct transfer
  const handleDirectTransfer = (paymentId, transferDetails) => {
    console.log("Direct transfer initiated:", paymentId, transferDetails);
  };

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Course Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The course you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/courses")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-gray-600 mt-2">
            Secure payment for {course.title}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Summary */}
          <div className="lg:col-span-1">
            <CourseSummary course={course} />
          </div>

          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Choose Payment Method
              </h2>

              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                availableMethods={availableMethods}
              />

              {/* Payment Method Content */}
              <div className="mt-6">
                {paymentMethod === "direct_transfer" && (
                  <DirectBankTransfer
                    course={course}
                    paymentData={paymentData}
                    onInitiate={() => handleInitiatePayment("direct_transfer")}
                    onDirectTransfer={handleDirectTransfer}
                    isInitiating={isInitiatingPayment}
                  />
                )}

                {paymentMethod === "stripe" && (
                  <PaymentMethodUnavailable
                    method="card"
                    message="card payment is not available please contact your instructor"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;