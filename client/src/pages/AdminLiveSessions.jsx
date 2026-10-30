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

  return null;
};

export default AdminLiveSessions;
