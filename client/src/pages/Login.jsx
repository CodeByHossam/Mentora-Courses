import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";

import { useLoginMutation } from "../store/services/authApi";
import { setCredentials } from "../store/slices/authSlice";
import { handleApiError, handleApiSuccess } from "../utils/apiErrorHandler";
import ProgressLoader from "../components/ProgressLoader";
import usePersist from "../hooks/usePersist";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [trustDevice, setTrustDevice] = usePersist();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login, { isLoading, error }] = useLoginMutation();

  useEffect(() => {
    if (error) handleApiError(error);
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(formData).unwrap();
      const { accessToken, user } = response;
      dispatch(setCredentials({ accessToken, user }));

      handleApiSuccess("Login successful!");

      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "instructor":
          navigate("/instructor");
          break;
        case "student":
          navigate("/student");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <div className="min-h-screen bg-primary shadow-2xl my-2 sm:my-4 md:my-8 p-4 rounded-2xl flex items-center justify-center px-4 sm:px-6 lg:px-12 overflow-x-hidden">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg" style={{background: 'linear-gradient(to right, var(--success), var(--info))'}}>
            <span className="text-white text-lg sm:text-2xl font-bold">LT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary mb-2">Welcome Back!</h1>
          <p className="text-sm sm:text-base text-secondary">Sign in to continue your learning journey</p>
        </div>

        {/* Login Card */}
        <div className="card rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-primary mb-2">
              Sign in to your account
            </h2>
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium hover:underline transition-colors" style={{color: 'var(--success)'}} onMouseEnter={(e) => e.target.style.color = 'var(--success-dark)'} onMouseLeave={(e) => e.target.style.color = 'var(--success)'}
              >
                Create one here
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-secondary">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm hover:underline transition-colors" style={{color: 'var(--success)'}} onMouseEnter={(e) => e.target.style.color = 'var(--success-dark)'} onMouseLeave={(e) => e.target.style.color = 'var(--success)'}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Trust Device Checkbox */}
            <div className="flex items-start space-x-3">
              <input
                id="trustDevice"
                type="checkbox"
                checked={trustDevice}
                onChange={() => setTrustDevice(!trustDevice)}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor="trustDevice"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Trust this device for future logins
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Keep me signed in on this device for convenience
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${
                isLoading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <ProgressLoader isVisible={true} message="Signing in..." />
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help? {" "}
              <Link to="/contact" className="text-green-600 hover:text-green-700 font-medium hover:underline transition-colors">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
