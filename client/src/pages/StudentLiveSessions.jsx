import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetStudentSessionsQuery,
  useJoinLiveSessionMutation
} from "../store/services/liveSessionApi";
import { toast } from "react-toastify";
import {
import StudentLiveSessionsView from "./StudentLiveSessionsView";
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

  return <StudentLiveSessionsView />;
};

export default StudentLiveSessions;
