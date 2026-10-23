import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetInstructorCoursesQuery } from "../store/services/courseApi";
import { useGetBillingAccountQuery, useGetBillingTransactionsQuery } from "../store/services/billingApi";
import ProgressLoader from "../components/ProgressLoader";
import { selectCurrentUser } from "../store/slices/authSlice";
import { handleApiError, handleApiSuccess } from "../utils/apiErrorHandler";
import InstructorPayments from "./InstructorPayments";
import BillingStatusAlert from "./Billing/components/BillingStatusAlert";
// import useBillingWithPending from "../hooks/useBillingWithPending";

const InstructorDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  // Billing data with pending admin fee payments
  const { data: transactionsData } = useGetBillingTransactionsQuery({ page: 1, limit: 5 });

  // Extract instructor billing data
  const {data:instructorAccount,isLoading:accountLoading} = useGetBillingAccountQuery(user?.id, {
    
  }
  );
  const recentTransactions = transactionsData?.data?.transactions || [];

  const {

    data: courses,
    isLoading,
    error,
    isSuccess,
  } = useGetInstructorCoursesQuery(user?.id, {
    skip: !user?.id,
    refetchOnMountOrArgChange: true,
  });

  // Redirect if user is not an instructor
  React.useEffect(() => {
    if (user && user.role !== "instructor") {
      navigate("/");
    }
  }, [user, navigate]);

  // Handle API error globally
  React.useEffect(() => {
    if (error) {
      handleApiError(error);
    }
  }, [error]);

  // Calculate real stats from courses
  const totalStudents =
    courses?.reduce((sum, c) => sum + (c.students || 0), 0) || 0;
  const ratedCurses = !isLoading && courses
    ? courses.filter((c) => c.averageRating > 0)
    : [];
  const avgRating =
    courses && courses.length > 0 && ratedCurses.length > 0
      ? (
          courses.reduce((sum, c) => sum + (c.averageRating || 0), 0) /
          ratedCurses.length
        ).toFixed(1)
      : "N/A";

  // Calculate monthly revenue (placeholder - should be replaced with real API data)
  const monthlyRevenue = courses && courses.length > 0 
    ? courses.reduce((sum, c) => sum + ((c.students || 0) * (c.price || 0) * 0.85), 0) // 85% instructor share
    : 0;
  
  const formattedRevenue = monthlyRevenue > 0 
    ? `$${monthlyRevenue.toLocaleString()}` 
    : "$0";
  
  const revenueGrowth = monthlyRevenue > 0 ? "+12%" : "0%";
  const revenueGrowthColor = monthlyRevenue > 0 ? "text-green-500" : "text-gray-500";
  // Show inactive account message
  if (user && !user.isActive) {
    return (
      <div className="min-h-screen bg-red-500 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Account Inactive
          </h2>
          <p className="text-gray-600 mb-4">
            Your account is inactive please click on the activation link sent to your email or contact the administrator
            for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <ProgressLoader
        isVisible={true}
        message="Loading instructor dashboard..."
      />
    );

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
            Welcome, {user?.name}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-secondary">
            Instructor Dashboard - Manage your courses
          </p>
        </div>

        {/* Billing Status Alert */}
        <BillingStatusAlert />

        {/* Enhanced Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Courses */}
          <div className="card overflow-hidden rounded-lg border-l-4" style={{borderLeftColor: 'var(--primary)'}}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'var(--primary)'}}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-2xl font-bold text-primary">{courses?.length || 0}</div>
                  <div className="text-sm font-medium text-muted">Your Courses</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {courses?.filter(c => c.status === 'published').length || 0} published
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Students */}
          <div className="card overflow-hidden rounded-lg border-l-4" style={{borderLeftColor: 'var(--success)'}}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--success)'}}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-2xl font-bold text-primary">{totalStudents}</div>
                  <div className="text-sm font-medium text-muted">Total Students</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Across {courses?.length || 0} courses
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="card overflow-hidden rounded-lg border-l-4" style={{borderLeftColor: 'var(--warning)'}}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--warning)'}}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-2xl font-bold text-primary">{avgRating}</div>
                  <div className="text-sm font-medium text-muted">Average Rating</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {ratedCurses.length} rated course{ratedCurses.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="card overflow-hidden rounded-lg border-l-4" style={{borderLeftColor: 'var(--secondary)'}}>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--secondary)'}}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-2xl font-bold text-primary">{formattedRevenue}</div>
                  <div className="text-sm font-medium text-muted">This Month</div>
                  <div className={`text-xs mt-1 ${revenueGrowthColor}`}>
                    {revenueGrowth} from last month
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 💰 Instructor Earnings Overview */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.656 0-3 .895-3 2s1.344 2 3 2 3 .895 3 2-1.344 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            💰 Your Earnings & Balance
          </h2>
          
          {accountLoading ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {/* Available Balance */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V9z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    AVAILABLE
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Balance</h3>
                <p className="text-2xl font-bold text-emerald-600">
                  ${instructorAccount?.availableBalance?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Ready for withdrawal</p>
              </div>

              {/* Total Commissions */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    EARNED
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Commissions</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${instructorAccount?.totalCommissionEarned?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Lifetime earnings</p>
              </div>

              {/* Welcome Credits */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 0v1m-2 0V6a2 2 0 00-2 0v1m2 0V4H9m3 0a2 2 0 012 2M9 8a2 2 0 000 4h6a2 2 0 100-4H9z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    PENDING
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Commissions</h3>
                <p className="text-2xl font-bold text-purple-600">
                  ${instructorAccount?.pendingCommissions?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Unpaid commissions</p>
              </div>

              {/* Outstanding Balance */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    FEES
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Annual Fees</h3>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-orange-600">
                    ${instructorAccount?.annualFees?.toLocaleString() || '0'}
                  </p>
                  {(instructorAccount?.annualFees || 0) > 0 && (
                    <div className="text-xs text-gray-500">
                      <p>Yearly platform fee</p>
                      <p className="text-orange-600">Due: Annual subscription</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">Yearly platform fee</p>
              </div>

              {/* Approved Payouts removed - using direct payout system now */}
            </div>
          )}

          {/* Course Sales Summary */}
          {instructorAccount?.courseSales && instructorAccount.courseSales.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Recent Course Sales
              </h3>
              <div className="space-y-3">
                {instructorAccount.courseSales.slice(0, 5).map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Course Sale - {sale.paymentMethod === 'direct_transfer' ? 'Direct Transfer' : 'Card Payment'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        +${sale.commissionAmount?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        From ${sale.saleAmount?.toLocaleString()} sale
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <a href="/instructor/payments" className="text-emerald-600 hover:text-emerald-800 font-medium">
                  View All Earnings & Payments →
                </a>
              </div>
            </div>
          )}

          {/* Quick Billing Actions */}
          <div className="mt-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/instructor/payments')}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Reports
              </button>
              <button
                onClick={() => navigate('/billing')}
                className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Billing Settings
              </button>
              <button
                onClick={() => navigate('/instructor/refunds')}
                className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 0v1m-2 0V6a2 2 0 00-2 0v1m2 0V4H9m3 0a2 2 0 012 2M9 8a2 2 0 000 4h6a2 2 0 100-4H9z" />
                </svg>
                Request Refund
              </button>
            </div>
          </div>
        </div>


        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-[rgb(33,40,50)]">
            Quick Actions
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <button
              onClick={() => navigate("/instructor/courses/new")}
              className="relative block w-full rounded-lg border-2 border-dashed border-[rgb(33,98,58)] p-12 text-center hover:border-[rgb(48,146,85)] focus:outline-none focus:ring-2 focus:ring-[rgb(33,98,58)] focus:ring-offset-2 transition-colors duration-300"
            >
              <svg
                className="mx-auto h-12 w-12 text-[rgb(33,98,58)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="mt-2 block text-sm font-medium text-[rgb(33,40,50)]">
                Create New Course
              </span>
            </button>

            <button
              onClick={() => navigate("/instructor/courses")}
              className="relative block w-full rounded-lg border-2 border-dashed border-[rgb(33,98,58)] p-12 text-center hover:border-[rgb(48,146,85)] focus:outline-none focus:ring-2 focus:ring-[rgb(33,98,58)] focus:ring-offset-2 transition-colors duration-300"
            >
              <svg
                className="mx-auto h-12 w-12 text-[rgb(33,98,58)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span className="mt-2 block text-sm font-medium text-[rgb(33,40,50)]">
                Manage Courses
              </span>
            </button>

            <button
              onClick={() => navigate("/instructor/students")}
              className="relative block w-full rounded-lg border-2 border-dashed border-[rgb(33,98,58)] p-12 text-center hover:border-[rgb(48,146,85)] focus:outline-none focus:ring-2 focus:ring-[rgb(33,98,58)] focus:ring-offset-2 transition-colors duration-300"
            >
              <svg
                className="mx-auto h-12 w-12 text-[rgb(33,98,58)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="mt-2 block text-sm font-medium text-[rgb(33,40,50)]">
                View Students
              </span>
            </button>

            <button
              onClick={() => navigate("/instructor/grading")}
              className="relative block w-full rounded-lg border-2 border-dashed border-[rgb(33,98,58)] p-12 text-center hover:border-[rgb(48,146,85)] focus:outline-none focus:ring-2 focus:ring-[rgb(33,98,58)] focus:ring-offset-2 transition-colors duration-300"
            >
              <svg
                className="mx-auto h-12 w-12 text-[rgb(33,98,58)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="mt-2 block text-sm font-medium text-[rgb(33,40,50)]">
                📊 Grade Students
              </span>
            </button>

            <button
              onClick={() => navigate("/instructor/payments")}
              className="relative block w-full rounded-lg border-2 border-dashed border-[rgb(33,98,58)] p-12 text-center hover:border-[rgb(48,146,85)] focus:outline-none focus:ring-2 focus:ring-[rgb(33,98,58)] focus:ring-offset-2 transition-colors duration-300"
            >
              <svg
                className="mx-auto h-12 w-12 text-[rgb(33,98,58)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span className="mt-2 block text-sm font-medium text-[rgb(33,40,50)]">
                💳 Enrollment & Payments
              </span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Recent Activity
          </h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">New student enrolled in "React Fundamentals"</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">Course "JavaScript Mastery" received a 5-star review</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">Payment received: $99.00</p>
                <p className="text-xs text-gray-500">3 days ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Courses Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Your Courses ({courses?.length || 0})
            </h2>
            <button
              onClick={() => navigate('/instructor/courses/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Course
            </button>
          </div>
          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{course.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        course.status === 'published' ? 'bg-green-100 text-green-800' : 
                        course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {course.status || 'draft'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {course.students || 0} students
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        {course.averageRating || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/instructor/courses/edit/${course._id}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => navigate(`/courses/${course._id}`)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition duration-200"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first course.</p>
              <button
                onClick={() => navigate('/instructor/courses/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
              >
                Create Your First Course
              </button>
            </div>
          )}
        </div>
      </div>
      <InstructorPayments />
    </div>
  );
};

export default InstructorDashboard;
