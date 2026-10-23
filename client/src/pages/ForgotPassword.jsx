import React, { useState } from "react";
import { useSendPasswordLinkMutation } from "../store/services/passwordApi";
import { handleApiError, handleApiSuccess } from "../utils/apiErrorHandler";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sendLink, { isLoading }] = useSendPasswordLinkMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendLink({ email }).unwrap();
      handleApiSuccess("Password reset link sent. Check your email.");
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-4 sm:mb-6 text-gray-900">
            🔐 Forgot Your Password?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label htmlFor="email" className="form-label">
            Enter your email
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
