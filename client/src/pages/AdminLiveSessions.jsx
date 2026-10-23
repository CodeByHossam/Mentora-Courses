import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  useGetAllLiveSessionsQuery, 
  useStartLiveSessionMutation, 
  useEndLiveSessionMutation,
  useDeleteLiveSessionMutation,
  useCancelLiveSessionMutation
} from "../store/services/liveSessionApi";
import { toast } from "react-toastify";
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Play, 
  Square, 
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
  Trash2,
  Ban
} from "lucide-react";

const AdminLiveSessions = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("scheduledDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSession, setExpandedSession] = useState(null);

  // Fetch all live sessions with real-time updates
  const { 
    data: sessionsData, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useGetAllLiveSessionsQuery({
    status: filterStatus === "all" ? undefined : filterStatus,
    page: 1,
    limit: 100
  }, {
    // Real-time updates
    pollingInterval: 30000, // Poll every 30 seconds
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  // Mutations
  const [startSession] = useStartLiveSessionMutation();
  const [endSession] = useEndLiveSessionMutation();
  const [deleteSession] = useDeleteLiveSessionMutation();
  const [cancelSession] = useCancelLiveSessionMutation();

  // Process sessions data
  const sessions = sessionsData?.sessions || [];

  // Handle session actions with immediate refetch
  const handleStartSession = async (sessionId) => {
    try {
      const response = await startSession(sessionId).unwrap();
      toast.success("Session started successfully!");
      
      if (response.data?.zoomStartUrl) {
        window.open(response.data.zoomStartUrl, '_blank');
      }
      
      refetch(); // Force immediate update
    } catch (error) {
      toast.error("Failed to start session");
      console.error("Start session error:", error);
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      await endSession(sessionId).unwrap();
      toast.success("Session ended successfully!");
      
      // Force refetch to ensure immediate update
      refetch();
    } catch (error) {
      toast.error("Failed to end session");
      console.error("End session error:", error);
    }
  };

  const handleDeleteSession = async (sessionId, sessionTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${sessionTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteSession(sessionId).unwrap();
      toast.success("Session deleted successfully!");
      refetch();
    } catch (error) {
      toast.error("Failed to delete session");
      console.error("Delete session error:", error);
    }
  };

  const handleCancelSession = async (sessionId, sessionTitle) => {
    if (!window.confirm(`Are you sure you want to cancel "${sessionTitle}"? Students will be notified.`)) {
      return;
    }

    try {
      await cancelSession(sessionId).unwrap();
      toast.success("Session cancelled successfully!");
      refetch();
    } catch (error) {
      toast.error("Failed to cancel session");
      console.error("Cancel session error:", error);
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
      return { status: "upcoming", label: "Upcoming", color: "blue", icon: Calendar };
    }

    if (sessionDate <= now && sessionEndDate > now) {
      return { status: "ready", label: "Ready to Start", color: "yellow", icon: Play };
    }

    if (sessionEndDate < now) {
      return { status: "ended", label: "Ended", color: "gray", icon: Square };
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

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.course?.instructor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
            return sessionDate > now && session.status !== "completed";
          case "ongoing":
            return sessionDate <= now && sessionEndDate > now && session.status === "active";
          case "past":
            return sessionEndDate < now || session.status === "completed";
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
          aValue = a.course?.instructor?.name || "";
          bValue = b.course?.instructor?.name || "";
          break;
        case "participants":
          aValue = a.participants?.length || 0;
          bValue = b.participants?.length || 0;
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
      completed: 0
    };

    sessions.forEach(session => {
      const statusInfo = getSessionStatus(session);
      switch (statusInfo.status) {
        case "upcoming":
        case "scheduled":
          statusCounts.upcoming++;
          break;
        case "live":
        case "ready":
          statusCounts.live++;
          break;
        case "completed":
          statusCounts.completed++;
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
              <Video className="h-8 w-8 text-blue-600 mr-3" />
              Live Sessions Management
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor and manage all live sessions across the platform
            </p>
          </div>
          <div className="flex items-center space-x-3">
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
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Video className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-yellow-600" />
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

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-gray-600" />
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
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Sessions</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Live Now</option>
              <option value="past">Past Sessions</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="scheduledDate">Sort by Date</option>
              <option value="course">Sort by Course</option>
              <option value="instructor">Sort by Instructor</option>
              <option value="participants">Sort by Participants</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center justify-center px-4 py-2 w-full border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <p className="text-gray-600">
              {searchTerm || filterStatus !== "all" 
                ? "No sessions match your current filters." 
                : "No live sessions have been scheduled yet."}
            </p>
          </div>
        ) : (
          filteredAndSortedSessions.map((session) => {
            const statusInfo = getSessionStatus(session);
            const dateTime = formatDateTime(session.scheduledDate);
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedSession === session._id;

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
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span className="font-medium">Course:</span>
                        <span className="ml-1 text-blue-600">{session.course?.title}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">Instructor:</span>
                        <span className="ml-1">{session.course?.instructor?.name}</span>
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
                        <Users className="h-4 w-4 mr-2" />
                        <span className="font-medium">Enrolled Students:</span>
                        <span className="ml-1">
                          {session.course?.enrolledStudents?.length || 0} students
                        </span>
                        <span className="mx-2">•</span>
                        <span className="font-medium">Duration:</span>
                        <span className="ml-1">{session.duration} minutes</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-6">
                      {/* Join Button */}
                      {(statusInfo.status === "live" || statusInfo.status === "ready") && (session.zoomJoinUrl || session.zoomStartUrl) && (
                        <button
                          onClick={() => {
                            const joinUrl = session.zoomJoinUrl || session.zoomStartUrl;
                            if (joinUrl) {
                              window.open(joinUrl, '_blank');
                            } else {
                              toast.error("No Zoom meeting URL available");
                            }
                          }}
                          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {statusInfo.status === "live" ? "Join Live" : "Join Session"}
                        </button>
                      )}

                      {/* Start Session Button */}
                      {(session.status !== "active" && session.status !== "live") && (statusInfo.status === "upcoming" || statusInfo.status === "ready") && (
                        <button
                          onClick={() => handleStartSession(session._id)}
                          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Session
                        </button>
                      )}

                      {/* Open Meeting Button */}
                      {(session.status === "active" || session.status === "live") && (session.zoomStartUrl || session.zoomJoinUrl) && (
                        <button
                          onClick={() => {
                            const meetingUrl = session.zoomStartUrl || session.zoomJoinUrl;
                            if (meetingUrl) {
                              window.open(meetingUrl, '_blank');
                            } else {
                              toast.error("No Zoom meeting URL available");
                            }
                          }}
                          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Meeting
                        </button>
                      )}

                      {/* End Session Button */}
                      {(session.status === "active" || session.status === "live") && (
                        <button
                          onClick={() => handleEndSession(session._id)}
                          className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          End Session
                        </button>
                      )}

                      {/* Cancel Session Button - Only for upcoming sessions */}
                      {(statusInfo.status === "upcoming" || statusInfo.status === "scheduled") && (
                        <button
                          onClick={() => handleCancelSession(session._id, session.title)}
                          className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Cancel
                        </button>
                      )}

                      {/* Delete Session Button - For upcoming, cancelled, completed, and ended sessions */}
                      {(statusInfo.status === "upcoming" || statusInfo.status === "scheduled" || statusInfo.status === "cancelled" || statusInfo.status === "completed" || statusInfo.status === "ended") && (
                        <button
                          onClick={() => handleDeleteSession(session._id, session.title)}
                          className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {(statusInfo.status === "completed" || statusInfo.status === "ended") ? "Remove" : "Delete"}
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
                            <div>
                              <span className="font-medium text-gray-600">Meeting ID:</span>
                              <span className="ml-2 font-mono text-gray-800">{session.zoomMeetingId || "N/A"}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Passcode:</span>
                              <span className="ml-2 font-mono text-gray-800">{session.zoomPassword || session.zoomPasscode || "N/A"}</span>
                            </div>
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
                              <span className="font-medium text-gray-600">Created:</span>
                              <span className="ml-2 text-gray-800">
                                {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : "N/A"}
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

export default AdminLiveSessions;
