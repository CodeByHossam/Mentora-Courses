import React from "react";
import AdminDashboardFinancial from "./AdminDashboardFinancial";

const AdminDashboardOverview = ({ userStats, adminAccount, billingLoading, recentTransactions, paymentStats }) => {
  return (
    <>
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
        <AdminDashboardFinancial
          adminAccount={adminAccount}
          billingLoading={billingLoading}
          recentTransactions={recentTransactions}
        />

    </>
  );
};

export default AdminDashboardOverview;
