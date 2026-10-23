import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  useGetStudentSessionsQuery,
  useJoinLiveSessionMutation
} from "../store/services/liveSessionApi";
import { toast } from "react-toastify";
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Play, 
  Filter, 
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  BookOpen,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Timer,
  Eye
} from "lucide-react";

const StudentLiveSessions = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("scheduledDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSession, setExpandedSession] = useState(null);

  // Fetch student's sessions with real-time updates
  const { 
    data: sessionsData, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useGetStudentSessionsQuery({
    page: 1,
    limit: 100
  }, {
    // Real-time updates
    pollingInterval: 30000, // Poll every 30 seconds
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  // Mutations
  const [joinSession] = useJoinLiveSessionMutation();

  // Process sessions data
  const sessions = sessionsData?.data || [];

  // Handle join session
  const handleJoinSession = async (sessionId) => {
    try {
      const response = await joinSession(sessionId).unwrap();
      toast.success("Joining session...");
      
      if (response.data?.zoomJoinUrl) {
        window.open(response.data.zoomJoinUrl, '_blank');
      }
      
      refetch(); // Force immediate update
    } catch (error) {
      toast.error(error?.data?.message || "Failed to join session");
      console.error("Join session error:", error);
    }
  };

  // Get session status
  const getSessionStatus = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.scheduledDate);
    const sessionEndDate = new Date(sessionDate.getTime() + (session.duration * 60 * 1000));

    if (session.status === "completed") {
      return { status: "completed", label: "Completed", color: "green", icon: CheckCircle };
    }
    
    if (session.status === "cancelled") {
      return { status: "cancelled", label: "Cancelled", color: "red", icon: XCircle };
    }

    if (session.status === "active" || session.status === "live") {
      return { status: "live", label: "Live Now", color: "green", icon: Video };
    }

    if (sessionDate > now) {
      const timeDiff = sessionDate - now;
      const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hoursUntil < 1 && minutesUntil <= 15) {
        return { status: "starting-soon", label: "Starting Soon", color: "yellow", icon: Timer };
      }
      return { status: "upcoming", label: "Upcoming", color: "blue", icon: Calendar };
    }

    if (sessionDate <= now && sessionEndDate > now) {
      return { status: "ready", label: "Join Now", color: "green", icon: Play };
    }

    if (sessionEndDate < now) {
      return { status: "ended", label: "Ended", color: "gray", icon: CheckCircle };
    }

    return { status: "scheduled", label: "Scheduled", color: "blue", icon: Clock };
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  // Get countdown for upcoming sessions
  const getCountdown = (scheduledDate) => {
    const now = new Date();
    const sessionDate = new Date(scheduledDate);
    const timeDiff = sessionDate - now;

    if (timeDiff <= 0) return null;

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.instructor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      const now = new Date();
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.scheduledDate);
        const sessionEndDate = new Date(sessionDate.getTime() + (session.duration * 60 * 1000));
        
        switch (filterStatus) {
          case "upcoming":
            return sessionDate > now && session.status !== "completed" && session.status !== "cancelled";
          case "live":
            return (session.status === "active" || session.status === "live") || 
                   (sessionDate <= now && sessionEndDate > now);
          case "past":
            return sessionEndDate < now || session.status === "completed";
          case "cancelled":
            return session.status === "cancelled";
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "scheduledDate":
          aValue = new Date(a.scheduledDate);
          bValue = new Date(b.scheduledDate);
          break;
        case "course":
          aValue = a.course?.title || "";
          bValue = b.course?.title || "";
          break;
        case "instructor":
          aValue = a.instructor?.name || "";
          bValue = b.instructor?.name || "";
          break;
        default:
          aValue = a[sortBy] || "";
          bValue = b[sortBy] || "";
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [sessions, searchTerm, filterStatus, sortBy, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => {
    const statusCounts = {
      total: sessions.length,
      upcoming: 0,
      live: 0,
      completed: 0,
      cancelled: 0
    };

    sessions.forEach(session => {
      const statusInfo = getSessionStatus(session);
      switch (statusInfo.status) {
        case "upcoming":
        case "scheduled":
        case "starting-soon":
          statusCounts.upcoming++;
          break;
        case "live":
        case "ready":
          statusCounts.live++;
          break;
        case "completed":
        case "ended":
          statusCounts.completed++;
          break;
        case "cancelled":
          statusCounts.cancelled++;
          break;
      }
    });

    return statusCounts;
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Sessions</h3>
          <p className="text-gray-600 mb-4">
            {error?.data?.message || "Failed to load live sessions"}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white shadow rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Video className="h-8 w-8 text-purple-600 mr-3" />
              My Live Sessions
            </h1>
            <p className="text-gray-600 mt-2">
              Join live sessions from your enrolled courses
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/student/courses')}
              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Courses
            </button>
            <button
              onClick={() => refetch()}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Live Now</p>
              <p className="text-3xl font-bold text-gray-900">{stats.live}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Play className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions, courses, instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Sessions</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live Now</option>
              <option value="past">Past Sessions</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="scheduledDate">Sort by Date</option>
              <option value="course">Sort by Course</option>
              <option value="instructor">Sort by Instructor</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center justify-center px-4 py-2 w-full border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-6">
        {filteredAndSortedSessions.length === 0 ? (
          <div className="text-center py-12">
            <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== "all" 
                ? "No sessions match your current filters." 
                : "You don't have any live sessions from your enrolled courses yet."}
            </p>
            <button
              onClick={() => navigate('/student/courses')}
              className="flex items-center mx-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Browse Courses
            </button>
          </div>
        ) : (
          filteredAndSortedSessions.map((session) => {
            const statusInfo = getSessionStatus(session);
            const dateTime = formatDateTime(session.scheduledDate);
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedSession === session._id;
            const countdown = getCountdown(session.scheduledDate);

            return (
              <div key={session._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 mr-3">
                          {session.title}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                          <StatusIcon className="h-4 w-4 mr-1" />
                          {statusInfo.label}
                        </span>
                        {countdown && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Timer className="h-3 w-3 mr-1" />
                            {countdown}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span className="font-medium">Course:</span>
                        <button
                          onClick={() => navigate(`/course/${session.course?._id}`)}
                          className="ml-1 text-purple-600 hover:text-purple-800 hover:underline"
                        >
                          {session.course?.title}
                        </button>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">Instructor:</span>
                        <span className="ml-1 text-blue-600">{session.instructor?.name}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="font-medium">Date:</span>
                        <span className="ml-1">{dateTime.date}</span>
                        <span className="mx-2">•</span>
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="font-medium">Time:</span>
                        <span className="ml-1">{dateTime.time}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">Duration:</span>
                        <span className="ml-1">{session.duration} minutes</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-6">
                      {/* Join Button - For live and ready sessions */}
                      {(statusInfo.status === "live" || statusInfo.status === "ready") && (
                        <button
                          onClick={() => handleJoinSession(session._id)}
                          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Join Session
                        </button>
                      )}

                      {/* View Recording Button - For completed sessions with recordings */}
                      {(statusInfo.status === "completed" || statusInfo.status === "ended") && session.recordingUrl && (
                        <button
                          onClick={() => window.open(session.recordingUrl, '_blank')}
                          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Recording
                        </button>
                      )}

                      {/* Expand Button */}
                      <button
                        onClick={() => setExpandedSession(isExpanded ? null : session._id)}
                        className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t pt-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Session Details</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Description:</span>
                              <p className="text-gray-800 mt-1">{session.description || "No description provided"}</p>
                            </div>
                            {session.zoomMeetingId && (
                              <div>
                                <span className="font-medium text-gray-600">Meeting ID:</span>
                                <span className="ml-2 font-mono text-gray-800">{session.zoomMeetingId}</span>
                              </div>
                            )}
                            {session.zoomPassword && (
                              <div>
                                <span className="font-medium text-gray-600">Passcode:</span>
                                <span className="ml-2 font-mono text-gray-800">{session.zoomPassword}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Course Information</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Category:</span>
                              <span className="ml-2 text-gray-800">{session.course?.category?.name || "N/A"}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Price:</span>
                              <span className="ml-2 text-gray-800">${session.course?.price || "N/A"}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Enrolled Students:</span>
                              <span className="ml-2 text-gray-800">
                                {session.course?.enrolledStudents?.length || 0} students
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentLiveSessions;
