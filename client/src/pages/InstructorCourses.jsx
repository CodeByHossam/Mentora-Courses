import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useGetInstructorCoursesQuery, useUpdateCourseStatusMutation } from "../store/services/courseApi";
import { handleApiError, handleApiSuccess } from "../utils/apiErrorHandler";
import { selectCurrentUser } from "../store/slices/authSlice";

const InstructorCourses = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    data: courses,
    isLoading,
    error,
    isSuccess,
  } = useGetInstructorCoursesQuery(user?.id, {
    skip: !user?.id,
    refetchOnMountOrArgChange: true,
  });

  const [updateCourseStatus] = useUpdateCourseStatusMutation();

  const handleStatusChange = async (courseId, newStatus) => {
    try {
      await updateCourseStatus({ courseId, status: newStatus }).unwrap();
      handleApiSuccess("Course status updated successfully");
    } catch (error) {
      handleApiError(error, "Failed to update course status");
    }
  };

  const filteredCourses = courses?.filter((course) => {
    if (statusFilter === "all") return true;
    return course.status === statusFilter;
  });

  // Redirect if user is not an instructor
  useEffect(() => {
    if (!user || user.role !== "instructor") {
      handleApiError("You must be an instructor to access this page");
      navigate("/");
    }
  }, [user, navigate]);

  // Handle API error with your custom handler
  useEffect(() => {
    if (error) {
      handleApiError(error);
      // Assume your handler deals with status codes internally (like 401, 500)
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--primary-color)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(48,146,85)]"></div>
      </div>
    );
    
  
};
  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="card rounded-xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-4" style={{background: 'linear-gradient(to right, var(--primary), var(--info))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
                <span className="text-3xl font-bold" style={{background: 'linear-gradient(to right, var(--primary), var(--info))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>📚</span> Your Courses
              </h1>
              <p className="mt-2 text-gray-600">
                Manage and create courses for your students
              </p>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Total Courses: {courses?.length || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Filtered: {filteredCourses?.length || 0}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 sm:mt-0">
              <button
                onClick={() => navigate("/instructor/courses/new")}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-200 hover:scale-105"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Course
              </button>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="card rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                📊 Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border rounded-lg transition-all duration-200" style={{borderColor: 'var(--card-border)'}} onFocus={(e) => {e.target.style.borderColor = 'var(--primary)'; e.target.style.outline = '2px solid var(--primary)'; e.target.style.outlineOffset = '2px'}} onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
              >
                <option value="all">All Status</option>
                <option value="draft">📝 Draft</option>
                <option value="published">✅ Published</option>
                <option value="archived">📦 Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCourses?.map((course) => (
            <div
              key={course._id}
              className="card rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="relative">
                <div className="h-48 flex items-center justify-center" style={{background: 'linear-gradient(to bottom right, var(--primary), var(--info))'}}>
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`${course.imageUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <select
                    value={course.status || 'draft'}
                    onChange={(e) => handleStatusChange(course._id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
                      course.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : course.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : course.status === 'archived'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    <option value="draft">📝 Draft</option>
                    <option value="published">✅ Published</option>
                    <option value="archived">📦 Archived</option>
                  </select>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-bold text-primary mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-secondary mb-4 line-clamp-3">
                  {course.description || 'No description available'}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <span style={{color: 'var(--primary)'}}>👥</span>
                      <span className="text-sm font-medium text-secondary">
                        {course.enrolledStudents?.length || 0} students
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span style={{color: 'var(--info)'}}>📝</span>
                    <span className="text-sm text-secondary">
                      {course.lessons?.length || 0} lessons
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => navigate(`/courses/${course._id}`)}
                    className="w-full px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200" style={{color: 'var(--primary)', backgroundColor: 'var(--accent)'}} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--accent-dark)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--accent)'}
                  >
                    👁️ View Course
                  </button>
                  <button
                    onClick={() => navigate(`/instructor/courses/edit/${course._id}`)}
                    className="w-full px-4 py-2 text-sm font-medium text-cyan-600 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-all duration-200"
                  >
                    ✏️ Edit Course
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {(!filteredCourses || filteredCourses.length === 0) && courses && courses.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No courses match your filter
              </h3>
              <p className="text-gray-600 mb-8 max-w-md">
                Try selecting a different status filter to see your courses.
              </p>
              <button
                onClick={() => setStatusFilter("all")}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-200 hover:scale-105"
              >
                Show All Courses
              </button>
            </div>
          </div>
        )}

        {(!courses || courses.length === 0) && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="text-8xl mb-6">📚</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 mb-8 max-w-md">
                Start your teaching journey by creating your first course. Share your knowledge and help students learn!
              </p>
              <button
                onClick={() => navigate("/instructor/courses/new")}
                className="inline-flex items-center px-8 py-4 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-200 hover:scale-105"
              >
                <svg className="-ml-1 mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Course
              </button>
            </div>
          </div>
        )}
      </div>

  );
};


export default InstructorCourses;
