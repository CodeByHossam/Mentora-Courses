import React from "react";

const AdminDashboardWelcome = ({ user }) => (
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
);

export default AdminDashboardWelcome;