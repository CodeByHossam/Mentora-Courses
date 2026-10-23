import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BookOpen } from "lucide-react";
import { useGetEnrolledCoursesQuery } from "../store/services/enrollmentRequestApi";
import ProgressLoader from "../components/ProgressLoader";

const MyCourses = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetEnrolledCoursesQuery();

  useEffect(() => {
    // Redirect if not student
    if (user && user.role !== "student") {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error.data?.message || "Failed to fetch enrolled courses");
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <ProgressLoader isVisible={true} message="Loading your courses..." />
      </div>
    );
  }

  const courses = data || [];

  return (
    <div className="min-h-screen bg-primary p-8">
        {/* Header Section */}
        <div className="card rounded-2xl p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold" style={{background: 'linear-gradient(to right, var(--secondary), var(--accent))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
              📚 My Learning Journey
            </h1>
            <p className="mt-2 text-secondary">
              Continue your progress and explore the courses you're enrolled in
            </p>
            <div className="mt-4 flex justify-center items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: 'var(--secondary)'}}></div>
              <span className="text-sm text-secondary">Enrolled Courses: {courses?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => {
              return (
                <div
                  key={course._id}
                  className="card rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="relative">
                    <div className="h-48 flex items-center justify-center" style={{background: 'linear-gradient(to bottom right, var(--secondary), var(--accent))'}}>
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
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium" style={{color: 'var(--secondary)'}}>
                        Enrolled
                      </span>
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
                        <span style={{color: 'var(--secondary)'}}>👨‍🏫</span>
                        <span className="text-xs text-secondary">
                          {course.instructor?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span style={{color: 'var(--accent)'}}>📝</span>
                        <span className="text-xs text-secondary">
                          {course.lessons?.length || 0} lessons
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => navigate(`/courses/${course._id}/learn`)}
                        className="btn-secondary w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        🚀 Continue Learning
                      </button>
                      <button
                        onClick={() => navigate(`/courses/${course._id}`)}
                        className="w-full px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200" style={{color: 'var(--secondary)', backgroundColor: 'var(--accent)'}} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--accent-dark)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--accent)'}
                      >
                        📋 Course Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="text-8xl mb-6">🎓</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No courses enrolled yet
              </h3>
              <p className="text-gray-600 mb-8 max-w-md">
                Start your learning journey by exploring and enrolling in amazing courses created by our expert instructors!
              </p>
              <button
                onClick={() => navigate("/courses")}
                className="inline-flex items-center px-8 py-4 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transform transition-all duration-200 hover:scale-105"
              >
                <svg className="-ml-1 mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Explore Courses
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default MyCourses;
