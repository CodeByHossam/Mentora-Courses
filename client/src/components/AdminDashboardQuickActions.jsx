import React from "react";

const AdminDashboardQuickActions = ({ userStats }) => {
  const quickActions = [
    {
      label: "Manage Courses",
      to: "/admin/manage-courses",
      description: "Create, edit, and oversee all courses",
      iconPath:
        "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      color: "blue",
      count: userStats?.totalCreatedCourses || 0,
    },
    {
      label: "Manage Users",
      to: "/admin/manage-users",
      description: "User accounts and permissions",
      iconPath:
        "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      color: "green",
      count: userStats?.totalUsers || 0,
    },
    {
      label: "View Reports",
      to: "/admin/reports",
      description: "Analytics and detailed reports",
      iconPath:
        "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      color: "purple",
      count: "View All",
    },
    {
      label: "Instructor Payouts",
      to: "/admin/instructor-payouts",
      description: "Process direct transfer payments to instructors",
      iconPath:
        "M12 8c-1.656 0-3 .895-3 2s1.344 2 3 2 3 .895 3 2-1.344 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "emerald",
      count: "Pay Now",
    },
    {
      label: "System Settings",
      to: "/admin/settings",
      description: "Platform configuration and settings",
      iconPath:
        "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      color: "red",
      count: "Configure",
    },
  ];

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <svg
          className="w-6 h-6 mr-3 text-purple-600"
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
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map(({ label, to, description, iconPath, color, count }) => (
          <a
            key={label}
            href={to}
            className={`group relative rounded-xl border-2 border-gray-200 bg-white p-6 hover:border-${color}-300 hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center group-hover:bg-${color}-200 transition-colors`}
              >
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
              <span
                className={`text-sm font-semibold text-${color}-600 bg-${color}-50 px-2 py-1 rounded-full`}
              >
                {count}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{label}</h3>
            <p className="text-sm text-gray-600">{description}</p>
            <div className="mt-4 flex items-center text-sm font-medium text-gray-500 group-hover:text-gray-700">
              <span>Access now</span>
              <svg
                className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default AdminDashboardQuickActions;
EOF