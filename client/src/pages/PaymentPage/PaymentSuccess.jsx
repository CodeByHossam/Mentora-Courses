import React from "react";
import { useSearchParams, Link } from "react-router-dom";

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const paymentId = params.get("paymentId");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">\u2705</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h1>
        <p className="text-gray-600 mb-6">Thank you! Your payment was processed successfully.</p>
        {sessionId && (
          <p className="text-xs text-gray-400 mb-2">Session: {sessionId}</p>
        )}
        {paymentId && (
          <p className="text-xs text-gray-400 mb-6">Payment: {paymentId}</p>
        )}
        <div className="space-y-3">
          <Link to="/my-courses" className="block w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors">Go to My Courses</Link>
          <Link to="/" className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;