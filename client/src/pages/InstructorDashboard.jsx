import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetInstructorCoursesQuery } from "../store/services/courseApi";
import { useGetBillingAccountQuery, useGetBillingTransactionsQuery } from "../store/services/billingApi";
import ProgressLoader from "../components/ProgressLoader";
import { selectCurrentUser } from "../store/slices/authSlice";
import { handleApiError, handleApiSuccess } from "../utils/apiErrorHandler";
import InstructorEarningsOverview from "../components/InstructorEarningsOverview";
import InstructorRecentActivity from "../components/InstructorRecentActivity";
import InstructorStatsGrid from "../components/InstructorStatsGrid";
import InstructorCourseList from "../components/InstructorCourseList";
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

        <InstructorStatsGrid
          courses={courses}
          totalStudents={totalStudents}
          avgRating={avgRating}
          formattedRevenue={formattedRevenue}
          revenueGrowth={revenueGrowth}
          revenueGrowthColor={revenueGrowthColor}
        />

        <InstructorEarningsOverview instructorAccount={instructorAccount} />

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

        <InstructorRecentActivity />

        <InstructorCourseList courses={courses} />
      </div>
      <InstructorPayments />
    </div>
  );
};

export default InstructorDashboard;
