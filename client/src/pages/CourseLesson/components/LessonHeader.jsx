import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LessonHeader = ({ 
  courseId, 
  course, 
  currentLesson, 
  isSidebarOpen, 
  setIsSidebarOpen 
}) => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-4">
          {/* Top buttons row */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
            >
              <ArrowRight size={16} />
              <span className="text-sm font-medium">Show All Lessons</span>
            </button>

            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Course</span>
            </button>
          </div>

          {/* Course and Lesson Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              📚 {course?.title || "Untitled Course"}
            </h1>
            <h3 className="text-lg text-gray-700 mt-1 flex items-center">
              <span className="mr-2">🎯</span>
              {currentLesson?.title || "No Lesson Selected"}
            </h3>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LessonHeader;
