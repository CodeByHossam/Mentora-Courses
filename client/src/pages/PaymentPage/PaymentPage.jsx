import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-toastify";

// Redux
import {
  useGetCourseQuery,
  useInitiatePaymentMutation,
  useGetCsrfTokenQuery,
} from "../../store/services/courseApi";
import {
  useGetGiftCardBalanceQuery,
  useGetCourseGiftCardQuery,
  usePayWithGiftCardMutation,
} from "../../store/services/billingApi";

// Components
import CourseSummary from "./components/CourseSummary";
import PaymentMethodSelector from "./components/PaymentMethodSelector";
import StripePaymentForm from "./components/StripePaymentForm";
import PayPalPaymentForm from "./components/PayPalPaymentForm";
import DirectBankTransfer from "./components/DirectBankTransfer";
import PaymentMethodUnavailable from "./components/PaymentMethodUnavailable";

// Initialize Stripe conditionally
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

const PaymentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [paymentData, setPaymentData] = useState(null);

  // Redux queries
  const {
    data: courseResponse,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useGetCourseQuery(courseId);
  const { data: csrfResponse } = useGetCsrfTokenQuery();
  const { data: giftCardBalanceResponse } = useGetGiftCardBalanceQuery();
  const { data: courseGiftCardResponse, isLoading: isLoadingGiftCard } = useGetCourseGiftCardQuery(courseId);
  
  // Extract gift card data properly
  const giftCardBalance = typeof giftCardBalanceResponse === 'number' ? giftCardBalanceResponse : 0;
  const courseGiftCard = courseGiftCardResponse;
  
  console.log('Gift Card Balance Response:', giftCardBalanceResponse);
  console.log('Course Gift Card Response:', courseGiftCardResponse);
  console.log('Course Gift Card:', courseGiftCard);
  const [initiatePayment, { isLoading: isInitiatingPayment }] =
    useInitiatePaymentMutation();
  const [payWithGiftCard, { isLoading: isPayingWithGiftCard }] =
    usePayWithGiftCardMutation();

  // getCourse transformResponse already returns response.data, so use directly
  const course = courseResponse;

  // Check available payment methods
  const getAvailableMethods = () => {
    const available = [];
    console.log('Stripe Promise:', stripePromise);
    console.log('Stripe Key:', stripePublishableKey);
    
    // Always include basic payment methods
    if (stripePromise) available.push("stripe");
    available.push("paypal");
    available.push("direct_transfer");
    
    console.log('Gift Card Balance:', giftCardBalance);
    console.log('Course Gift Card:', courseGiftCard);
    
    // Show course-specific gift card if available
    if (courseGiftCard) available.push("course_gift_card");
    // Show general gift card balance if available
    else if (typeof giftCardBalance === 'number' && giftCardBalance > 0) {
      available.push("gift_card");
    }
    
    console.log('Available Methods in PaymentPage:', available);
    
    // Fallback: ensure at least one method is available
    if (available.length === 0) {
      console.warn('No payment methods available! Adding fallback methods.');
      available.push("paypal", "direct_transfer");
    }
    
    return available;
  };

  const availableMethods = getAvailableMethods();

  // Auto-select course gift card if available and sufficient
  useEffect(() => {
    if (courseGiftCard && !isLoadingGiftCard && course) {
      const coursePrice = course?.finalPrice || course?.price || 0;
      if (courseGiftCard.amount >= coursePrice) {
        console.log('Auto-selecting course gift card payment method');
        setPaymentMethod("course_gift_card");
      }
    }
  }, [courseGiftCard, isLoadingGiftCard, course]);

  useEffect(() => {
    if (courseError) {
      toast.error("Course not found");
      navigate("/courses");
    }
  }, [courseError, navigate]);

  const handleInitiatePayment = async (method) => {
    try {
      const result = await initiatePayment({
        courseId,
        method,
      }).unwrap();

      if (result.success) {
        setPaymentData(result.data);
        // If Stripe Checkout is used, redirect to the hosted checkout page
        if (method === "stripe" && result.data?.url) {
          window.location.assign(result.data.url);
          return;
        }

        if (method === "free" && result.data.enrolled) {
          toast.success("Successfully enrolled in free course!");
          navigate(`/courses/${courseId}`);
        }
      } else {
        toast.error(result.message || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast.error("Failed to initiate payment");
    }
  };

  const handleGiftCardPayment = async (paymentData) => {
    try {
      console.log('🎁 Sending gift card payment request:', paymentData);
      const result = await payWithGiftCard(paymentData).unwrap();
      
      console.log('🎁 Gift card payment result:', result);
      
      if (result.success) {
        toast.success(result.data?.message || 'Course purchased successfully with gift card! 🎉');
        
        // Show navigation options
        setTimeout(() => {
          const goToCourse = window.confirm(
            'Course purchased successfully! 🎉\n\n' +
            'Click OK to go to the course page, or Cancel to view all your courses.'
          );
          
          if (goToCourse) {
            navigate(`/courses/${courseId}`);
          } else {
            navigate('/my-courses');
          }
        }, 500);
      } else {
        toast.error(result.message || 'Failed to process gift card payment');
      }
    } catch (error) {
      console.error('❌ Gift card payment error:', error);
      toast.error(error?.data?.message || error?.message || 'Failed to process gift card payment');
    }
  };

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Course Not Found
          </h2>
          <button
            onClick={() => navigate("/courses")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Course Summary */}
        <CourseSummary course={course} />

        {/* Course-Specific Gift Card Alert */}
        {courseGiftCard && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎁</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  🎉 You Have a Gift Card for This Course!
                </h3>
                <p className="text-green-700 mb-3">
                  You have a gift card worth <span className="font-bold text-2xl">${courseGiftCard.amount?.toFixed(2)}</span> that can be used for this course.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600 font-medium">Card Number:</span>
                    <p className="text-gray-700 font-mono">{courseGiftCard.cardNumber}</p>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Expires:</span>
                    <p className="text-gray-700">{new Date(courseGiftCard.expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>
                {courseGiftCard.description && (
                  <p className="text-sm text-green-600 mt-2 italic">{courseGiftCard.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            💳 Choose Payment Method
          </h2>

          {/* Payment Method Selection */}
          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            availableMethods={availableMethods}
            giftCardBalance={giftCardBalance}
            coursePrice={course?.finalPrice || course?.price || 0}
            courseGiftCard={courseGiftCard}
          />

          {/* Payment Forms */}
          {paymentMethod === "stripe" && (
            <button
              onClick={() => handleInitiatePayment("stripe")}
              disabled={isInitiatingPayment}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isInitiatingPayment
                ? "Redirecting…"
                : `Pay $${course.finalPrice} with Card`}
            </button>
          )}

          {paymentMethod === "paypal" && (
            <PayPalPaymentForm
              course={course}
              onInitiate={() => handleInitiatePayment("paypal")}
              paymentData={paymentData}
              loading={isInitiatingPayment}
            />
          )}

          {paymentMethod === "direct_transfer" && (
            <DirectBankTransfer course={course} />
          )}

          {paymentMethod === "course_gift_card" && courseGiftCard && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">🎁 Pay with Course Gift Card</h3>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-green-700">Gift Card Amount:</span>
                    <span className="text-2xl font-bold text-green-900">${courseGiftCard.amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Course Price:</span>
                    <span className="text-lg font-semibold text-gray-900">${(course?.finalPrice || course?.price || 0).toFixed(2)}</span>
                  </div>
                  <hr className="border-green-200 my-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700">
                      {courseGiftCard.amount >= (course?.finalPrice || course?.price || 0) ? 'Remaining Balance:' : 'Amount Needed:'}
                    </span>
                    <span className={`text-lg font-bold ${courseGiftCard.amount >= (course?.finalPrice || course?.price || 0) ? 'text-green-900' : 'text-red-600'}`}>
                      ${Math.abs(courseGiftCard.amount - (course?.finalPrice || course?.price || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    console.log('🎁 Gift Card Payment Button Clicked!');
                    console.log('Payment Data:', {
                      courseId,
                      amount: course?.finalPrice || course?.price || 0,
                      giftCardId: courseGiftCard._id,
                      giftCardBalance: courseGiftCard.amount,
                      useCourseGiftCard: true
                    });
                    handleGiftCardPayment({
                      courseId,
                      amount: course?.finalPrice || course?.price || 0,
                      giftCardId: courseGiftCard._id,
                      giftCardBalance: courseGiftCard.amount,
                      useCourseGiftCard: true
                    });
                  }}
                  disabled={isPayingWithGiftCard || (courseGiftCard.amount < (course?.finalPrice || course?.price || 0))}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  {isPayingWithGiftCard ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </span>
                  ) : courseGiftCard.amount >= (course?.finalPrice || course?.price || 0) ? (
                    `🎉 Redeem Gift Card - Pay $${(course?.finalPrice || course?.price || 0).toFixed(2)}`
                  ) : (
                    `Insufficient Gift Card Balance`
                  )}
                </button>
                
                {courseGiftCard.amount < (course?.finalPrice || course?.price || 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 text-center">
                      ⚠️ Your gift card balance is insufficient. You need ${((course?.finalPrice || course?.price || 0) - courseGiftCard.amount).toFixed(2)} more.
                    </p>
                    <p className="text-xs text-yellow-700 text-center mt-1">
                      Please choose another payment method to complete your purchase.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {paymentMethod === "gift_card" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Pay with Gift Card Balance</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Available Balance:</span>
                  <span className="text-lg font-bold text-green-900">${(typeof giftCardBalance === 'number' ? giftCardBalance : 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Course Price:</span>
                  <span className="text-lg font-semibold text-gray-900">${(course?.finalPrice || course?.price || 0).toFixed(2)}</span>
                </div>
                
                <hr className="border-green-200" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Remaining Balance:</span>
                  <span className="text-lg font-bold text-green-900">
                    ${((typeof giftCardBalance === 'number' ? giftCardBalance : 0) - (course?.finalPrice || course?.price || 0)).toFixed(2)}
                  </span>
                </div>
                
                <button
                  onClick={() => handleGiftCardPayment({
                    courseId,
                    amount: course?.finalPrice || course?.price || 0,
                    giftCardBalance: typeof giftCardBalance === 'number' ? giftCardBalance : 0,
                    remainingBalance: (typeof giftCardBalance === 'number' ? giftCardBalance : 0) - (course?.finalPrice || course?.price || 0)
                  })}
                  disabled={isPayingWithGiftCard || (typeof giftCardBalance === 'number' ? giftCardBalance : 0) < (course?.finalPrice || course?.price || 0)}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {isPayingWithGiftCard ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    `Pay $${(course?.finalPrice || course?.price || 0).toFixed(2)} with Gift Card`
                  )}
                </button>
                
                {(typeof giftCardBalance === 'number' ? giftCardBalance : 0) < (course?.finalPrice || course?.price || 0) && (
                  <p className="text-sm text-red-600 text-center">
                    Insufficient balance. You need ${((course?.finalPrice || course?.price || 0) - (typeof giftCardBalance === 'number' ? giftCardBalance : 0)).toFixed(2)} more.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Wrap with Stripe Elements
const PaymentPageWrapper = () => {
  // If Stripe is not configured, show payment page without Stripe Elements
  if (!stripePromise) {
    return <PaymentPage />;
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentPage />
    </Elements>
  );
};

export default PaymentPageWrapper;
