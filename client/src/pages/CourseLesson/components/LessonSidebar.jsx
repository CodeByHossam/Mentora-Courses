import React from 'react';
import { X } from 'lucide-react';

const LessonSidebar = ({ 
  course, 
  currentLesson, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  handleSelectLesson 
}) => {
  return (
    <aside
      className={`lg:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 pt-36 transition-transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 overflow-y-auto`}
      aria-label="Course lessons sidebar"
    >
      {/* Close Button (mobile only) */}
      <div className="flex justify-center lg:hidden mb-6">
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all"
          aria-label="Close sidebar"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="flex items-center mb-6 mt-10">
        <div className="text-2xl mr-3">📚</div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Course Lessons
        </h2>
      </div>
      
      <div className="space-y-3">
        {course?.lessons?.length > 0 ? (
          course?.lessons.map((lesson, index) => (
            <button
              key={lesson._id}
              onClick={() => handleSelectLesson(lesson)}
              className={`w-full text-left flex items-center justify-between p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                currentLesson?._id === lesson._id
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md"
                  : "hover:bg-gray-50 hover:shadow-md border border-gray-200"
              }`}
            >
              <div className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                  currentLesson?._id === lesson._id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <span className={`font-medium ${
                    currentLesson?._id === lesson._id ? "text-blue-900" : "text-gray-900"
                  }`}>
                    {lesson?.title || "Untitled Lesson"}
                  </span>
                  {lesson?.duration && (
                    <div className="text-xs text-gray-500 mt-1">
                      ⏱️ {lesson.duration} min
                    </div>
                  )}
                </div>
              </div>
              <svg
                className={`w-5 h-5 transition-transform ${
                  currentLesson?._id === lesson._id 
                    ? "text-blue-500 transform rotate-90" 
                    : "text-gray-400"
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">📖</div>
            <p className="text-gray-500 font-medium">No lessons available</p>
            <p className="text-gray-400 text-sm mt-1">Lessons will appear here when added</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default LessonSidebar;
