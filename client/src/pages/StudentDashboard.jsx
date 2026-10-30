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
import StudentRecentPayments from "../components/StudentRecentPayments";
import StudentLearningProgress from "../components/StudentLearningProgress";
import StudentUpcomingSessions from "../components/StudentUpcomingSessions";
import StudentQuickActions from "../components/StudentQuickActions";
import StudentCoursesAndBills from "../components/StudentCoursesAndBills";
import StudentSummaryCards from "../components/StudentSummaryCards";
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

        <StudentSummaryCards
          isLoadingCourses={isLoadingCourses}
          enrolledCourses={enrolledCourses}
          upcomingSessionsCount={upcomingSessionsCount}
          pendingRequestsCount={pendingRequestsCount}
        />
        <StudentRecentPayments recentTransactions={recentTransactions} />


        <StudentLearningProgress />

        <StudentUpcomingSessions upcomingSessions={upcomingSessions} upcomingSessionsCount={upcomingSessionsCount} />

        <StudentQuickActions />
        <StudentCoursesAndBills enrolledCourses={enrolledCourses} user={user} />

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
