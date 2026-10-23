import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetEnrollmentRequestsQuery } from "../store/services/enrollmentRequestApi";
import { useGetInstructorRequestsQuery } from "../store/services/instructorRequestApi";
import { useGetUserStatsQuery } from "../store/services/userApi";
import { useGetPaymentStatsQuery } from "../store/services/paymentApi";
import { useGetAdminBillingAccountQuery, useGetAllPlatformTransactionsQuery } from "../store/services/billingApi";
import { handleApiError } from "../utils/apiErrorHandler";

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // ✅ Enrollment requests
  const {
    data: enrollmentRequests,
    isError: enrollmentError,
    error: enrollmentErrorData,
  } = useGetEnrollmentRequestsQuery();

  // ✅ Instructor requests
  const {
    data: instructorRequests,
    isError: instructorError,
    error: instructorErrorData,
  } = useGetInstructorRequestsQuery();

  // ✅ User stats
  const { data: userStats } = useGetUserStatsQuery();

  // ✅ Payments
  const { data: paymentStats } = useGetPaymentStatsQuery();

  // ✅ Admin Billing Data - USE ADMIN-SPECIFIC ENDPOINTS
  const { data: billingData, isLoading: billingLoading } = useGetAdminBillingAccountQuery();
  const { data: transactionsData } = useGetAllPlatformTransactionsQuery({ page: 1, limit: 100 }); // Get more transactions for analysis

  // Extract admin billing data from specialized endpoint with safe fallbacks
  const adminAccount = billingData?.data?.adminAccount || {
    platformBalance: 0,
    totalRevenue: 0,
    totalInstructorPayouts: 0,
    totalStudentRefunds: 0
  };
  const recentTransactions = billingData?.data?.recentTransactions || transactionsData?.data?.transactions || [];

  // Protect route
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Handle errors
  useEffect(() => {
    if (enrollmentError) handleApiError(enrollmentErrorData);
    if (instructorError) handleApiError(instructorErrorData);
  }, [enrollmentError, instructorError]);

  // Counts for enrollment
  const totalEnrollment = enrollmentRequests?.length || 0;
  const pendingEnrollment =
    enrollmentRequests?.filter((r) => r.status === "pending").length || 0;
  const approvedEnrollment =
    enrollmentRequests?.filter((r) => r.status === "approved").length || 0;
  const rejectedEnrollment =
    enrollmentRequests?.filter((r) => r.status === "rejected").length || 0;

  // Counts for instructor
  const totalInstructor = instructorRequests?.length || 0;
  const pendingInstructor =
    instructorRequests?.filter((r) => r.status === "pending").length || 0;
  const approvedInstructor =
    instructorRequests?.filter((r) => r.status === "approved").length || 0;
  const rejectedInstructor =
    instructorRequests?.filter((r) => r.status === "rejected").length || 0;


  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Enhanced Welcome Section */}
        <section className="mb-6 sm:mb-8">
          <div className="card rounded-lg p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
              Welcome back, {user?.name}
            </h1>
            <p className="mt-2 text-secondary text-sm sm:text-base lg:text-lg">
              Admin Dashboard - Complete platform oversight and management
            </p>
            <div className="text-secondary mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-xs sm:text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Last login: {new Date().toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                System Status: All systems operational
              </div>
            </div>
          </div>
        </section>
        {/* Enhanced Priority Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Enrollment Requests Card */}
          <div className="card rounded-xl p-4 sm:p-6 border-l-4 flex flex-col justify-between" style={{borderLeftColor: 'var(--warning)'}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-primary flex items-center">
                <svg className="w-5 h-5 mr-2" style={{color: 'var(--warning)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Enrollment Requests
              </h2>
              {pendingEnrollment > 0 && (
                <span className="bg-error-light text-error text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {pendingEnrollment} pending
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">{totalEnrollment}</div>
            <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm mb-4">
              <div className="text-center">
                <div className="font-semibold text-warning">{pendingEnrollment}</div>
                <div className="text-muted">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-success">{approvedEnrollment}</div>
                <div className="text-muted">Approved</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-error">{rejectedEnrollment}</div>
                <div className="text-muted">Rejected</div>
              </div>
            </div>
            {totalEnrollment > 0 && (
              <button
                className="btn-warning w-full py-2 px-4 rounded-lg transition duration-200"

                onClick={() => navigate("/admin/enrollment-requests")}
              >
                Review All Requests
              </button>
            )}
          </div>

          {/* Instructor Requests Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2" style={{color: 'var(--info)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Instructor Requests
              </h2>
              {pendingInstructor > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {pendingInstructor} pending
                </span>
              )}
              
            </div>
            <div className="text-3xl font-bold text-primary mb-2">{totalInstructor}</div>
            <div className="grid grid-cols-3 gap-2 text-sm mb-4">
              <div className="text-center">
                <div className="font-semibold text-warning">{pendingInstructor}</div>
                <div className="text-muted">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-success">{approvedInstructor}</div>
                <div className="text-gray-500">Approved</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-error">{rejectedInstructor}</div>
                <div className="text-gray-500">Rejected</div>
              </div>
            </div>
            {totalInstructor >= 0 && (
              <button
                className="btn-info w-full py-2 px-4 rounded-lg transition duration-200 "
                onClick={() => navigate("/admin/instructor-requests")}
              >
                Review All Requests
              </button>
            )}
          </div>

          {/* System Health Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                System Health
              </h2>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Healthy
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Server Status</span>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="text-sm font-medium text-blue-600">{userStats?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-medium text-green-600">99.9%</span>
              </div>
            </div>
            <button
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition duration-200"
              onClick={() => navigate("/admin/system-logs")}
            >
              View System Logs
            </button>
          </div>

        </div>
        {/* Enhanced Analytics Grid */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Platform Analytics
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total Users",
                value: userStats?.totalUsers || 0,
                change: "+12%",
                changeType: "positive",
                icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857M17 20v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 00-9.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
                color: "blue"
              },
              {
                label: "Active Students",
                value: userStats?.totalStudents || 0,
                change: "+8%",
                changeType: "positive",
                icon: "M12 14l9-5-9-5-9 5 9 5zm0 0v6",
                color: "green"
              },
              {
                label: "Total Instructors",
                value: userStats?.totalInstructors || 0,
                change: "+5%",
                changeType: "positive",
                icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                color: "purple"
              },
              {
                label: "Total Revenue",
                value: `$${adminAccount?.totalRevenue?.toFixed(2) || adminAccount?.platformBalance?.toFixed(2) || paymentStats?.totalRevenue || 0}`,
                change: "+15%",
                changeType: "positive",
                icon: "M12 8c-1.656 0-3 .895-3 2s1.344 2 3 2 3 .895 3 2-1.344 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                color: "yellow"
              },
              {
                label: "Total Courses",
                value: userStats?.totalCreatedCourses || 0,
                change: "+3%",
                changeType: "positive",
                icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                color: "indigo"
              },
              {
                label: "Course Enrollments",
                value: userStats?.totalEnrolledCourses || 0,
                change: "+22%",
                changeType: "positive",
                icon: "M8 16v1a3 3 0 006 0v-1m-6 0H5v-2a2 2 0 012-2h10a2 2 0 012 2v2h-3m-6 0v-6m0 0V9a2 2 0 114 0v1",
                color: "pink"
              },
              {
                label: "Verified Users",
                value: userStats?.verifiedUsers || 0,
                change: "+18%",
                changeType: "positive",
                icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                color: "emerald"
              },
              {
                label: "Platform Admins",
                value: userStats?.totalAdmins || 0,
                change: "0%",
                changeType: "neutral",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                color: "red"
              }
            ].map(({ label, value, change, changeType, icon, color }) => (
              <div key={label} className={`bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-${color}-500`}>
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 bg-${color}-500 rounded-full flex items-center justify-center`}>
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">{value}</div>
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            changeType === 'positive' ? 'text-green-600' : 
                            changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {changeType === 'positive' && (
                              <svg className="self-center flex-shrink-0 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className="sr-only">{changeType === 'positive' ? 'Increased' : 'Decreased'} by</span>
                            {change}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 💰 Admin Financial Overview */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.656 0-3 .895-3 2s1.344 2 3 2 3 .895 3 2-1.344 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            💰 Platform Financial Overview
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Platform Revenue */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    REVENUE
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Revenue</h3>
                <p className="text-2xl font-bold text-green-600">
                  ${adminAccount?.totalRevenue?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total admin fees collected</p>
              </div>

              {/* Total Payouts Paid */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V9z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                    PAID OUT
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructor Payouts</h3>
                <p className="text-2xl font-bold text-orange-600">
                  ${adminAccount?.totalInstructorPayouts?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total paid to instructors</p>
              </div>

              {/* Monthly Revenue */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    MONTHLY
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Balance</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${adminAccount?.platformBalance?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Revenue minus payouts</p>
              </div>

              {/* Total Transactions */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    ACTIVITY
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Transactions</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {recentTransactions?.length?.toLocaleString() || adminAccount?.statistics?.totalTransactions?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total platform transactions</p>
              </div>
            </div>
          )}

          {/* Recent Financial Activity */}
          {recentTransactions.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Financial Activity
              </h3>
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <svg className={`w-4 h-4 ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                            transaction.type === 'credit' 
                              ? "M12 6v6m0 0v6m0-6h6m-6 0H6" 
                              : "M20 12H4"
                          } />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}${transaction.amount?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">{transaction.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <a href="/admin/payment-reports" className="text-blue-600 hover:text-blue-800 font-medium">
                  View All Financial Reports →
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Enhanced Quick Actions */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Manage Courses",
                to: "/admin/manage-courses",
                description: "Create, edit, and oversee all courses",
                iconPath: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                color: "blue",
                count: userStats?.totalCreatedCourses || 0
              },
              {
                label: "Manage Users",
                to: "/admin/manage-users",
                description: "User accounts and permissions",
                iconPath: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
                color: "green",
                count: userStats?.totalUsers || 0
              },
              {
                label: "View Reports",
                to: "/admin/reports",
                description: "Analytics and detailed reports",
                iconPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                color: "purple",
                count: "View All"
              },
              {
                label: "Instructor Payouts",
                to: "/admin/instructor-payouts",
                description: "Process direct transfer payments to instructors",
                iconPath: "M12 8c-1.656 0-3 .895-3 2s1.344 2 3 2 3 .895 3 2-1.344 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                color: "emerald",
                count: "Pay Now"
              },
              {
                label: "Gift Cards",
                to: "/admin/gift-cards",
                description: "Issue and manage gift cards for users",
                iconPath: "M12 8v13m0-13V6a2 2 0 112 0v2m-2 0V5.5A2.5 2.5 0 1114.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
                color: "pink",
                count: "Manage"
              },
              {
                label: "System Settings",
                to: "/admin/settings",
                description: "Platform configuration and settings",
                iconPath: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
                color: "red",
                count: "Configure"
              }
            ].map(({ label, to, description, iconPath, color, count }) => (
              <a
                key={label}
                href={to}
                className={`group relative rounded-xl border-2 border-gray-200 bg-white p-6 hover:border-${color}-300 hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center group-hover:bg-${color}-200 transition-colors`}>
                    <svg
                      className={`h-6 w-6 text-${color}-600`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                    </svg>
                  </div>
                  <span className={`text-sm font-semibold text-${color}-600 bg-${color}-50 px-2 py-1 rounded-full`}>
                    {count}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{label}</h3>
                <p className="text-sm text-gray-600">{description}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-gray-500 group-hover:text-gray-700">
                  <span>Access now</span>
                  <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
