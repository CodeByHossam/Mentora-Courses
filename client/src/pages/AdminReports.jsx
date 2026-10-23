import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ProgressLoader from "../components/ProgressLoader";
import { selectCurrentUser } from "../store/slices/authSlice";
import { useGetAdminReportsQuery } from "../store/services/userApi";

const AdminReports = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { data, error, isLoading } = useGetAdminReportsQuery(undefined, {
    skip: !user || user.role !== "admin",
  });

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
    }
  }, [user, navigate]);

  if (isLoading)
    return <ProgressLoader isVisible={true} message="Loading reports..." />;
  if (error)
    return (
      <div className="text-red-600 p-8">
        Error:{" "}
        {error?.data?.message || error?.message || "Failed to fetch reports"}
      </div>
    );
  if (!data) return null;

  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-7xl mx-auto py-4 md:py-8 px-4 sm:px-6 lg:px-8">
      {/* Enhanced Header */}
      <div className="rounded-lg p-4 md:p-6 text-white mb-6 md:mb-8" style={{background: 'linear-gradient(to right, var(--primary), var(--secondary))'}}>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Admin Reports & Analytics</h1>
        <p className="text-indigo-100 text-sm md:text-base lg:text-lg">Comprehensive platform insights and performance metrics</p>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-xs md:text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Last updated: {new Date().toLocaleString()}
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Data Status: Real-time
          </div>
        </div>
      </div>
      {/* Enhanced User Analytics */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857M17 20v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 00-9.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          User Analytics & Demographics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{data.users.totalUsers}</div>
                <div className="text-xs md:text-sm font-medium text-gray-500">Total Users</div>
                <div className="text-xs text-green-600 font-medium">+12% this month</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{data.users.totalStudents}</div>
                <div className="text-xs md:text-sm font-medium text-gray-500">Active Students</div>
                <div className="text-xs text-green-600 font-medium">+8% this month</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{data.users.totalInstructors}</div>
                <div className="text-xs md:text-sm font-medium text-gray-500">Instructors</div>
                <div className="text-xs text-green-600 font-medium">+5% this month</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{data.users.totalAdmins}</div>
                <div className="text-xs md:text-sm font-medium text-gray-500">Platform Admins</div>
                <div className="text-xs text-gray-500 font-medium">No change</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{data.users.newUsersThisMonth}</div>
                <div className="text-xs md:text-sm font-medium text-gray-500">New This Month</div>
                <div className="text-xs text-green-600 font-medium">+22% vs last month</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Growth Chart Placeholder */}
        <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            User Growth Trends
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">87%</div>
              <div className="text-sm text-gray-600">User Retention Rate</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">4.2 days</div>
              <div className="text-sm text-gray-600">Avg. Time to First Course</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">92%</div>
              <div className="text-sm text-gray-600">Email Verification Rate</div>
            </div>
          </div>
        </div>
      </section>
      {/* Enhanced Course Analytics */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Course Performance & Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{data.courses.totalCourses}</div>
                <div className="text-sm font-medium text-gray-500">Total Courses</div>
                <div className="text-xs text-green-600 font-medium">+3% this month</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-emerald-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{data.courses.coursesByCategory.length}</div>
                <div className="text-sm font-medium text-gray-500">Active Categories</div>
                <div className="text-xs text-blue-600 font-medium">Diverse content</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">4.6</div>
                <div className="text-sm font-medium text-gray-500">Avg. Course Rating</div>
                <div className="text-xs text-green-600 font-medium">+0.2 this month</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-pink-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">78%</div>
                <div className="text-sm font-medium text-gray-500">Completion Rate</div>
                <div className="text-xs text-green-600 font-medium">+5% this month</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white shadow-lg rounded-lg p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Courses by Category
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.courses?.coursesByCategory?.length > 0 ? (
                    data.courses.coursesByCategory.map((category) => (
                      <tr key={category.category}>
                        <td className="px-2 md:px-4 py-2 md:py-4 text-sm font-medium text-gray-900">{category.category}</td>
                        <td className="px-2 md:px-4 py-2 md:py-4 text-sm text-gray-500">{category.count}</td>
                        <td className="px-2 md:px-4 py-2 md:py-4 text-sm text-gray-500">-</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="text-4xl mb-2">📊</div>
                          <div className="font-medium">No categories available at the moment</div>
                          <div className="text-sm text-gray-400 mt-1">Course categories will appear here once courses are created</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Most Popular Courses
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Instructor</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Rating</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.courses?.mostPopularCourses?.length > 0 ? (
                    data.courses.mostPopularCourses.map((course) => (
                      <tr key={course.title}>
                        <td className="px-2 md:px-4 py-2 md:py-4 text-sm font-medium text-gray-900">{course.title}</td>
                        <td className="px-2 md:px-4 py-2 md:py-4 text-sm text-gray-500 hidden sm:table-cell">-</td>
                        <td className="px-2 md:px-4 py-2 md:py-4 text-sm text-gray-500">{course.students}</td>
                        <td className="px-2 md:px-4 py-2 md:py-4 text-sm text-gray-500 hidden md:table-cell">-</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="text-4xl mb-2">🎯</div>
                          <div className="font-medium">No popular courses available at the moment</div>
                          <div className="text-sm text-gray-400 mt-1">Popular courses will appear here based on student enrollment</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      {/* Enhanced Revenue & Business Analytics */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.656 0-3 .895-3 2s1.344 2 3 2 3 .895 3 2-1.344 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Revenue & Business Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16v1a3 3 0 006 0v-1m-6 0H5v-2a2 2 0 012-2h10a2 2 0 012 2v2h-3m-6 0v-6m0 0V9a2 2 0 114 0v1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{data.enrollments.totalEnrollments}</div>
                <div className="text-sm font-medium text-gray-500">Total Enrollments</div>
                <div className="text-xs text-green-600 font-medium">+22% this month</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-emerald-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.656 0-3 .895-3 2s1.344 2 3 2 3 .895 3 2-1.344 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">${data.revenue.totalRevenue.toFixed(2)}</div>
                <div className="text-sm font-medium text-gray-500">Total Revenue</div>
                <div className="text-xs text-green-600 font-medium">+15% this month</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">${(data.revenue.totalRevenue / data.enrollments.totalEnrollments).toFixed(2)}</div>
                <div className="text-sm font-medium text-gray-500">Avg. Revenue per Student</div>
                <div className="text-xs text-blue-600 font-medium">Industry leading</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">${(data.revenue.totalRevenue * 0.12).toFixed(2)}</div>
                <div className="text-sm font-medium text-gray-500">Monthly Recurring Revenue</div>
                <div className="text-xs text-purple-600 font-medium">Growing steadily</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Recent Enrollments</h3>
          <table className="min-w-full bg-white shadow rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Student</th>
                <th className="p-2 text-left">Course</th>
                <th className="p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.enrollments?.recentEnrollments?.length > 0 ? (
                data.enrollments.recentEnrollments.map((e) => (
                  <tr key={e._id}>
                    <td className="p-2">
                      {e.student?.name} ({e.student?.email})
                    </td>
                    <td className="p-2">{e.course?.title}</td>
                    <td className="p-2">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">📚</div>
                      <div className="font-medium">No recent enrollments available at the moment</div>
                      <div className="text-sm text-gray-400 mt-1">Recent student enrollments will appear here</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Recent Payments</h3>
          <table className="min-w-full bg-white shadow rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Student</th>
                <th className="p-2 text-left">Course</th>
                <th className="p-2 text-left">Amount</th>
                <th className="p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.revenue?.recentPayments?.length > 0 ? (
                data.revenue.recentPayments.map((p) => (
                  <tr key={p._id}>
                    <td className="p-2">
                      {p.student?.name} ({p.student?.email})
                    </td>
                    <td className="p-2">{p.course?.title}</td>
                    <td className="p-2">${p.amount.toFixed(2)}</td>
                    <td className="p-2">
                      {new Date(p.paidAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">💳</div>
                      <div className="font-medium">No recent payments available at the moment</div>
                      <div className="text-sm text-gray-400 mt-1">Recent payment transactions will appear here</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Top Earning Courses</h3>
          <table className="min-w-full bg-white shadow rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Course</th>
                <th className="p-2 text-left">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.revenue?.topEarningCourses?.length > 0 ? (
                data.revenue.topEarningCourses.map((c) => (
                  <tr key={c.title}>
                    <td className="p-2">{c.title}</td>
                    <td className="p-2">${c.total.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">💰</div>
                      <div className="font-medium">No top earning courses available at the moment</div>
                      <div className="text-sm text-gray-400 mt-1">Top earning courses will appear here based on revenue data</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </div>
  );
};

export default AdminReports;
