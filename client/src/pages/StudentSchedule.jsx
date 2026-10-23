import React, { useState } from "react";
import { useGetStudentSessionsQuery } from "../store/services/liveSessionApi";
import { 
  Calendar, 
  Clock, 
  Video, 
  BookOpen, 
  User, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from "date-fns";

const StudentSchedule = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // week, month
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: sessionsData, isLoading, error, refetch } = useGetStudentSessionsQuery();
  const sessions = sessionsData?.data || [];

  // Get week dates
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter sessions based on status
  const filteredSessions = sessions.filter(session => {
    if (filterStatus === "all") return true;
    if (filterStatus === "upcoming") return session.status === "scheduled" || session.status === "ready_to_start";
    if (filterStatus === "live") return session.status === "live";
    if (filterStatus === "completed") return session.status === "completed" || session.status === "ended";
    return true;
  });

  // Group sessions by date
  const sessionsByDate = filteredSessions.reduce((acc, session) => {
    const sessionDate = format(new Date(session.scheduledDateTime), "yyyy-MM-dd");
    if (!acc[sessionDate]) {
      acc[sessionDate] = [];
    }
    acc[sessionDate].push(session);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
      case "ready_to_start":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "live":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
      case "ended":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "live":
        return "🔴";
      case "scheduled":
      case "ready_to_start":
        return "📅";
      case "completed":
      case "ended":
        return "✅";
      case "cancelled":
        return "❌";
      default:
        return "📅";
    }
  };

  const navigateWeek = (direction) => {
    if (direction === "prev") {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(addWeeks(currentWeek, 1));
    }
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="grid grid-cols-7 gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Schedule</h3>
            <p className="text-red-600 mb-4">{error?.data?.message || "Failed to load schedule"}</p>
            <button
              onClick={refetch}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            📅 My Schedule
          </h1>
          <p className="text-secondary">
            View your upcoming live sessions and learning schedule
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Week Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateWeek("prev")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {format(weekStart, "MMM dd")} - {format(weekEnd, "MMM dd, yyyy")}
                </h2>
              </div>
              
              <button
                onClick={() => navigateWeek("next")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Today
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sessions</option>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live Now</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Scheduled</h3>
            <p className="text-gray-600 mb-6">
              You don't have any live sessions scheduled at the moment. 
              Check back later or contact your instructors for upcoming sessions!
            </p>
            <button
              onClick={() => window.location.href = "/courses"}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="p-4 text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {format(day, "EEE")}
                  </div>
                  <div className={`text-lg font-semibold mt-1 ${
                    isSameDay(day, new Date()) 
                      ? "text-blue-600 bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto" 
                      : "text-gray-700"
                  }`}>
                    {format(day, "dd")}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="grid grid-cols-7 min-h-[400px]">
              {weekDays.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const daySessions = sessionsByDate[dayKey] || [];
                
                return (
                  <div key={day.toISOString()} className="border-r border-gray-200 last:border-r-0">
                    <div className="p-2 space-y-2 min-h-[400px]">
                      {daySessions.map((session) => (
                        <div
                          key={session._id}
                          className={`p-3 rounded-lg border text-xs ${getStatusColor(session.status)} hover:shadow-md transition-shadow cursor-pointer`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg">{getStatusIcon(session.status)}</span>
                            <span className="font-medium">
                              {format(new Date(session.scheduledDateTime), "HH:mm")}
                            </span>
                          </div>
                          
                          <div className="font-medium text-gray-900 mb-1 line-clamp-2">
                            {session.title}
                          </div>
                          
                          <div className="flex items-center text-gray-600 mb-1">
                            <BookOpen className="w-3 h-3 mr-1" />
                            <span className="truncate">{session.course?.title}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600 mb-2">
                            <User className="w-3 h-3 mr-1" />
                            <span className="truncate">{session.instructor?.name}</span>
                          </div>
                          
                          {session.status === "live" && (
                            <button
                              onClick={() => window.open(session.meetingUrl, '_blank')}
                              className="w-full bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                            >
                              <Video className="w-3 h-3 mr-1" />
                              Join Live
                            </button>
                          )}
                          
                          {(session.status === "scheduled" || session.status === "ready_to_start") && (
                            <div className="flex items-center text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>
                                {session.duration ? `${session.duration} min` : "Duration TBD"}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Sessions Summary */}
        {filteredSessions.length > 0 && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Session Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {sessions.filter(s => s.status === "scheduled" || s.status === "ready_to_start").length}
                </div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {sessions.filter(s => s.status === "live").length}
                </div>
                <div className="text-sm text-gray-600">Live Now</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600 mb-1">
                  {sessions.filter(s => s.status === "completed" || s.status === "ended").length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {[...new Set(sessions.map(s => s.course?._id))].length}
                </div>
                <div className="text-sm text-gray-600">Courses</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSchedule;
