import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetInstructorStudentsQuery } from "../store/services/userApi"; // Custom hook to fetch students
import { handleApiError } from "../utils/apiErrorHandler";

const InstructorStudents = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Redirect non-instructors immediately
  useEffect(() => {
    if (!user || user.role !== "instructor") {
      handleApiError(new Error("Only instructors can access this page."));
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch instructor's students; skip if user is not valid instructor
  const {
    data: students = [],
    isLoading,
    error,
  } = useGetInstructorStudentsQuery(user?.id, {
    skip: !user || user.role !== "instructor",
  });

  // Handle errors from API
  useEffect(() => {
    if (error) {
      handleApiError(error);
    }
  }, [error]);

  // If user is not instructor or not loaded, don't render anything (avoid flicker)
  if (!user || user.role !== "instructor") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                👨‍🎓 Your Students
              </h1>
              <p className="mt-2 text-gray-600">
                View and manage students enrolled in your courses
              </p>
              <div className="mt-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Total Students: {students?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-lg p-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
              <p className="text-gray-600">Loading your students...</p>
            </div>
          </div>
        ) : students.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Enrollment Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map(({ _id, name, email, createdAt, avatar }, index) => (
                    <tr key={_id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0">
                            {avatar ? (
                              <img
                                className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-200"
                                src={avatar}
                                alt={name}
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-lg font-bold">
                                  {name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {name || 'Unknown Student'}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {_id?.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">
                            {new Date(createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="text-8xl mb-6">👨‍🎓</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No students yet
              </h3>
              <p className="text-gray-600 mb-8 max-w-md">
                Students will appear here once they enroll in your courses. Create engaging courses to attract learners!
              </p>
              <button
                onClick={() => navigate('/instructor/courses')}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transform transition-all duration-200 hover:scale-105"
              >
                📚 View My Courses
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorStudents;
