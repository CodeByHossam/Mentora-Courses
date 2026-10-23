import React from "react";
import { useSelector } from "react-redux";
import {
  useGetUserEnrollmentRequestsQuery,
  useGetEnrolledCoursesQuery,
} from "../store/services/enrollmentRequestApi";
import { useGetStudentSessionsQuery } from "../store/services/liveSessionApi";
import {
  useGetBillingAccountQuery,
  useGetBillingTransactionsQuery,
} from "../store/services/billingApi";
import ProgressLoader from "../components/ProgressLoader";
import { selectCurrentUser } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import MyCourses from "./MyCourses";
import StudentCertificates from "../components/StudentCertificates";
import StudentBills from "../components/StudentBills";
import BillingStatusAlert from "../pages/Billing/components/BillingStatusAlert";
import {
  BookOpen,
  Video,
  Award,
  Clock,
  Calendar,
  Users,
  TrendingUp,
  Play,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const StudentDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { data: enrollmentRequests, isLoading: isLoadingRequests } =
    useGetUserEnrollmentRequestsQuery();
  const { data: enrolledCourses, isLoading: isLoadingCourses } =
    useGetEnrolledCoursesQuery();
  const { data: liveSessionsData } = useGetStudentSessionsQuery({
    upcoming: "true",
    limit: 5,
  });

  // Billing data
  const { data: billingData, isLoading: billingLoading } =
    useGetBillingAccountQuery();
  const { data: transactionsData } = useGetBillingTransactionsQuery({
    page: 1,
    limit: 5,
  });

  // Extract student billing data
  const studentAccount = billingData?.data?.account || billingData?.account;
  const recentTransactions = transactionsData?.data?.transactions || [];

  if (!user.isActive) {
    return (
      <div className="min-h-screen bg-primary w-full max-w-maxAppWidth flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Account Inactive
          </h2>
          <p className="text-gray-600 mb-4">
            Your account is inactive please click on the activation link sent to
            your email or contact the administrator for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingRequests) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <ProgressLoader isVisible={true} message="Loading dashboard..." />
      </div>
    );
  }

  const pendingRequestsCount =
    enrollmentRequests?.filter((r) => r.status === "pending").length ?? 0;

  const upcomingSessions = liveSessionsData?.data || [];
  const upcomingSessionsCount = upcomingSessions.length;

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-primary">
          Student Dashboard
        </h1>
        <p className="text-base sm:text-lg text-secondary font-medium text-center">
          Welcome{user?.name ? `, ${user.name}` : ""}! Ready to keep learning?
        </p>
      </div>

      {/* Billing Status Alert */}
      <BillingStatusAlert />

      {/* Enhanced Dashboard Summary */}
      <div className="mb-8 sm:mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card rounded-xl p-4 sm:p-6 border-l-4 hover:shadow-xl transition-shadow" style={{borderLeftColor: 'var(--secondary)'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--accent)'}}>
                <BookOpen className="w-6 h-6" style={{color: 'var(--secondary)'}} />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {isLoadingCourses ? "..." : enrolledCourses?.length ?? 0}
              </div>
              <div className="text-sm font-medium text-muted">
                Enrolled Courses
              </div>
              <div className="text-xs text-muted mt-1">Active learning</div>
            </div>
          </div>
        </div>

        <div className="card rounded-xl p-6 border-l-4 hover:shadow-xl transition-shadow" style={{borderLeftColor: 'var(--info)'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--info-light)'}}>
                <Video className="w-6 h-6" style={{color: 'var(--info)'}} />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {upcomingSessionsCount}
              </div>
              <div className="text-sm font-medium text-muted">
                Live Sessions
              </div>
              <div className="text-xs text-gray-400 mt-1">Upcoming</div>
            </div>
          </div>
        </div>

        <div className="card rounded-xl p-6 border-l-4 hover:shadow-xl transition-shadow" style={{borderLeftColor: 'var(--warning)'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--warning-light)'}}>
                <Clock className="w-6 h-6" style={{color: 'var(--warning)'}} />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-primary">
                {pendingRequestsCount}
              </div>
              <div className="text-sm font-medium text-muted">
                Pending Requests
              </div>
              <div className="text-xs text-muted mt-1">
                Awaiting approval
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-sm font-medium text-muted">
                Certificates
              </div>
              <div className="text-xs text-gray-400 mt-1">Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* 💳 Student Payment & Credits */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg
            className="w-6 h-6 mr-3 text-sky-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          💳 Your Account & Payments
        </h2>

        {billingLoading ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-300 h-12 w-12"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Spent */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  SPENT
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Total Spent
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                ${studentAccount?.totalCoursePurchases?.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-gray-500 mt-1">On course purchases</p>
            </div>

            {/* Annual Fee */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  {(studentAccount?.annualFees || 0) > 0 ? "DUE" : "PAID"}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Annual Fee
              </h3>
              <p className="text-2xl font-bold text-orange-600">
                ${studentAccount?.annualFees?.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {(studentAccount?.annualFees || 0) > 0 ? "Payment required" : "No fee due"}
              </p>
            </div>

            {/* Gift Cards */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 0v1m-2 0V6a2 2 0 00-2 0v1m2 0V4H9m3 0a2 2 0 012 2M9 8a2 2 0 000 4h6a2 2 0 100-4H9z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  CARDS
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gift Cards
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {studentAccount?.giftCards?.filter(c => !c.isUsed).length || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">Available to use</p>
            </div>
          </div>
        )}

        {/* Recent Payment Activity */}
        {recentTransactions.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Recent Payment Activity
            </h3>
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-lg mr-3 ${
                        transaction.type === "credit"
                          ? "bg-emerald-100"
                          : "bg-red-100"
                      }`}
                    >
                      <svg
                        className={`w-4 h-4 ${
                          transaction.type === "credit"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={
                            transaction.type === "credit"
                              ? "M12 6v6m0 0v6m0-6h6m-6 0H6"
                              : "M20 12H4"
                          }
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.type === "credit"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "credit" ? "+" : "-"}$
                      {transaction.amount?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <a
                href="/billing"
                className="text-sky-600 hover:text-sky-800 font-medium"
              >
                View All Payment History →
              </a>
            </div>
          </div>
        )}

        {/* Quick Payment Actions */}
        <div className="mt-6 bg-gradient-to-r from-sky-50 to-purple-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Add Credits removed - simplified system */}
            <button
              onClick={() => navigate("/student/payments")}
              className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Payment History
            </button>
            <button
              onClick={() => navigate("/courses")}
              className="flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              Browse Courses
            </button>
            <button
              onClick={() => navigate("/student/refunds")}
              className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 0v1m-2 0V6a2 2 0 00-2 0v1m2 0V4H9m3 0a2 2 0 012 2M9 8a2 2 0 000 4h6a2 2 0 100-4H9z"
                />
              </svg>
              Request Refund
            </button>
          </div>
        </div>
      </div>

      {/* Learning Progress Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Recent Activity
        </h2>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">
                Completed "Introduction to React" lesson
              </p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">
                Earned certificate for "JavaScript Fundamentals"
              </p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-purple-50 rounded-lg">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">
                Started new course "Advanced CSS"
              </p>
              <p className="text-xs text-gray-500">3 days ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Live Sessions */}
      {upcomingSessionsCount > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center text-gray-900">
              <Video className="w-5 h-5 mr-2 text-blue-600" />
              Upcoming Live Sessions
            </h2>
            <button
              onClick={() => navigate("/student/live-sessions")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {upcomingSessions.slice(0, 3).map((session) => {
              if (!session) return null;

              const sessionDate = session.scheduledDate
                ? new Date(session.scheduledDate)
                : new Date();
              const now = new Date();
              const isStartingSoon =
                session.scheduledDate && sessionDate - now <= 15 * 60 * 1000; // 15 minutes

              return (
                <div
                  key={session._id || Math.random()}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {session?.title || "Untitled Session"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {session?.course?.title || "Course not available"}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {session.scheduledDate
                          ? `${sessionDate.toLocaleDateString()} at ${sessionDate.toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}`
                          : "Date not available"}
                      </div>
                    </div>
                    {isStartingSoon && (
                      <div className="flex items-center">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
                          Starting Soon
                        </span>
                        <button
                          onClick={() => navigate("/student/live-sessions")}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                        >
                          Join
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/courses")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Browse Courses
          </button>
          <button
            onClick={() => navigate("/student/courses")}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <Play className="w-5 h-5 mr-2" />
            Continue Learning
          </button>
          <button
            onClick={() => navigate("/student/live-sessions")}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <Video className="w-5 h-5 mr-2" />
            Live Sessions
          </button>
          <button
            onClick={() => navigate("/student/certificates")}
            className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <Award className="w-5 h-5 mr-2" />
            Certificates
          </button>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            My Courses ({enrolledCourses?.length || 0})
          </h2>
          <button
            onClick={() => navigate("/courses")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Find More Courses
          </button>
        </div>
        <MyCourses />
      </div>

      {/* Certificates Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <StudentCertificates />
      </div>

      {/* Bills and Payments Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
          Bills & Payments
        </h2>
        <StudentBills userId={user?._id} />
      </div>

      {/* Enhanced Enrollment Requests Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Enrollment Requests
        </h2>
        {enrollmentRequests?.length > 0 ? (
          <div className="space-y-4">
            {enrollmentRequests.map((request) => {
              if (!request) return null;

              return (
                <div
                  key={request._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {request?.course?.title || "Course not available"}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {request?.course?.description ||
                          "No description available"}
                      </p>
                      <div className="flex items-center mt-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {request.status}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          Requested on{" "}
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString()
                            : "Date not available"}
                        </span>
                      </div>
                    </div>
                    {request.status === "approved" && request?.course?._id && (
                      <button
                        onClick={() =>
                          navigate(`/courses/${request.course._id}`)
                        }
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition duration-200"
                      >
                        Start Learning
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No enrollment requests
            </h3>
            <p className="text-gray-500 mb-4">
              Browse our course catalog to find courses that interest you.
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
            >
              Browse Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
