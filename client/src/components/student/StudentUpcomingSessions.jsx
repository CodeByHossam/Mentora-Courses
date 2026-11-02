import React from "react";

const StudentUpcomingSessions = ({ upcomingSessions, upcomingSessionsCount }) => {
  if (upcomingSessionsCount === 0) return null;
  return (
    <>
      {/* Upcoming Live Sessions */}
      {upcomingSessionsCount > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center text-gray-900">
              <Video className="w-5 h-5 mr-2 text-blue-600" />
              Upcoming Live Sessions
            </h2>
            <button
              onClick={() => navigate("/student/live-sessions")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {upcomingSessions.slice(0, 3).map((session) => {
              if (!session) return null;

              const sessionDate = session.scheduledDate
                ? new Date(session.scheduledDate)
                : new Date();
              const now = new Date();
              const isStartingSoon =
                session.scheduledDate && sessionDate - now <= 15 * 60 * 1000; // 15 minutes

              return (
                <div
                  key={session._id || Math.random()}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {session?.title || "Untitled Session"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {session?.course?.title || "Course not available"}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {session.scheduledDate
                          ? `${sessionDate.toLocaleDateString()} at ${sessionDate.toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}`
                          : "Date not available"}
                      </div>
                    </div>
                    {isStartingSoon && (
                      <div className="flex items-center">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
                          Starting Soon
                        </span>
                        <button
                          onClick={() => navigate("/student/live-sessions")}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                        >
                          Join
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default StudentUpcomingSessions;
