import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetEnrollmentRequestsQuery } from "../store/services/enrollmentRequestApi";
import { useGetInstructorRequestsQuery } from "../store/services/instructorRequestApi";
import { useGetUserStatsQuery } from "../store/services/userApi";
import { useGetPaymentStatsQuery } from "../store/services/paymentApi";
import { useGetAdminBillingAccountQuery, useGetAllPlatformTransactionsQuery } from "../store/services/billingApi";
import { handleApiError } from "../utils/apiErrorHandler";
import AdminDashboardWelcome from "../components/AdminDashboardWelcome";
import AdminDashboardPriorityActions from "../components/AdminDashboardPriorityActions";
import AdminDashboardOverview from "../components/AdminDashboardOverview";
import AdminDashboardQuickActions from "../components/AdminDashboardQuickActions";

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const {
    data: enrollmentRequests,
    isError: enrollmentError,
    error: enrollmentErrorData,
  } = useGetEnrollmentRequestsQuery();

  const {
    data: instructorRequests,
    isError: instructorError,
    error: instructorErrorData,
  } = useGetInstructorRequestsQuery();

  const { data: userStats } = useGetUserStatsQuery();
  const { data: paymentStats } = useGetPaymentStatsQuery();

  const { data: billingData, isLoading: billingLoading } = useGetAdminBillingAccountQuery();
  const { data: transactionsData } = useGetAllPlatformTransactionsQuery({ page: 1, limit: 100 });

  const adminAccount = billingData?.data?.adminAccount || {
    platformBalance: 0,
    totalRevenue: 0,
    totalInstructorPayouts: 0,
    totalStudentRefunds: 0
  };
  const recentTransactions = billingData?.data?.recentTransactions || transactionsData?.data?.transactions || [];

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (enrollmentError) handleApiError(enrollmentErrorData);
    if (instructorError) handleApiError(instructorErrorData);
  }, [enrollmentError, instructorError]);

  const totalEnrollment = enrollmentRequests?.length || 0;
  const pendingEnrollment = enrollmentRequests?.filter((r) => r.status === "pending").length || 0;
  const approvedEnrollment = enrollmentRequests?.filter((r) => r.status === "approved").length || 0;
  const rejectedEnrollment = enrollmentRequests?.filter((r) => r.status === "rejected").length || 0;

  const totalInstructor = instructorRequests?.length || 0;
  const pendingInstructor = instructorRequests?.filter((r) => r.status === "pending").length || 0;
  const approvedInstructor = instructorRequests?.filter((r) => r.status === "approved").length || 0;
  const rejectedInstructor = instructorRequests?.filter((r) => r.status === "rejected").length || 0;

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AdminDashboardWelcome user={user} />
        <AdminDashboardPriorityActions
          pendingEnrollment={pendingEnrollment}
          totalEnrollment={totalEnrollment}
          approvedEnrollment={approvedEnrollment}
          rejectedEnrollment={rejectedEnrollment}
          pendingInstructor={pendingInstructor}
          totalInstructor={totalInstructor}
          approvedInstructor={approvedInstructor}
          rejectedInstructor={rejectedInstructor}
          userStats={userStats}
        />
        <AdminDashboardOverview
          userStats={userStats}
          adminAccount={adminAccount}
          billingLoading={billingLoading}
          recentTransactions={recentTransactions}
          paymentStats={paymentStats}
        />
        <AdminDashboardQuickActions userStats={userStats} />
      </div>
    </div>
  );
};

export default AdminDashboard;