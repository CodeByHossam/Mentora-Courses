import React from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboardPriorityActions = (props) => {
  const navigate = useNavigate();
  return (
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
  );
};

export default AdminDashboardPriorityActions;