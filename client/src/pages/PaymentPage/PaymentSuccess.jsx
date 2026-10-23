import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useConfirmPayPalPaymentMutation } from "../../store/services/paymentApi";
import { toast } from "react-toastify";

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  // For PayPal, order id is sent as token query param by PayPal
  const orderId = params.get("orderId") || params.get("token");
  const paymentId = params.get("paymentId");

  const [confirmPayPalPayment, { isLoading }] = useConfirmPayPalPaymentMutation();
  const [status, setStatus] = useState(orderId ? "confirming" : "success");
  const [error, setError] = useState("");

  useEffect(() => {
    // If returning from PayPal, confirm server-side
    const confirmPayPal = async () => {
      if (!orderId || !paymentId) return;
      try {
        const res = await confirmPayPalPayment({ orderId, paymentId }).unwrap();
        if (res.success) {
          setStatus("success");
          toast.success("PayPal payment confirmed");
        } else {
          setStatus("failed");
          setError(res.message || "Failed to confirm PayPal payment");
          toast.error(res.message || "Failed to confirm PayPal payment");
        }
      } catch (e) {
        setStatus("failed");
        setError("Failed to confirm PayPal payment");
        toast.error("Failed to confirm PayPal payment");
      }
    };
    if (orderId && paymentId) confirmPayPal();
  }, [orderId, paymentId, confirmPayPalPayment]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === "confirming" && (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming Payment…</h1>
            <p className="text-gray-600 mb-6">Please wait while we confirm your PayPal payment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h1>
            <p className="text-gray-600 mb-6">Thank you! Your payment was processed successfully.</p>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed to Confirm</h1>
            <p className="text-gray-600 mb-6">{error || "We couldn't confirm your payment. You won't be charged."}</p>
          </>
        )}
        {sessionId && (
          <p className="text-xs text-gray-400 mb-2">Session: {sessionId}</p>
        )}
        {orderId && (
          <p className="text-xs text-gray-400 mb-6">PayPal Order: {orderId}</p>
        )}
        <div className="space-y-3">
          {status === "success" ? (
            <Link to="/my-courses" className="block w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors">Go to My Courses</Link>
          ) : (
            <Link to="/payment" className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">Try Again</Link>
          )}
          <Link to="/" className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;


