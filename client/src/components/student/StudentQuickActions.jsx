import React from "react";

const StudentQuickActions = () => {
  return (
    <>
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/courses")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Browse Courses
          </button>
          <button
            onClick={() => navigate("/student/courses")}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <Play className="w-5 h-5 mr-2" />
            Continue Learning
          </button>
          <button
            onClick={() => navigate("/student/live-sessions")}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <Video className="w-5 h-5 mr-2" />
            Live Sessions
          </button>
          <button
            onClick={() => navigate("/student/certificates")}
            className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <Award className="w-5 h-5 mr-2" />
            Certificates
          </button>
        </div>
      </div>

    </>
  );
};

export default StudentQuickActions;
