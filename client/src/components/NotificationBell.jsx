import React from "react";
import { Bell } from "lucide-react";
import { useGetUnreadCountQuery } from "../store/services/notificationApi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const NotificationBell = ({ className = "", showText = false }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Get unread count from the dedicated API endpoint
  const {
    data: unreadCountData,
    error,
    isLoading,
  } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds for real-time updates
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skip: !user, // Skip if user is not authenticated
  });

  // Extract unread count from API response
  const unreadCount = unreadCountData?.data?.unreadCount || 0;

  const handleClick = () => {
    // Navigate based on user role
    if (user?.role === "admin") {
      navigate("/admin/notifications");
    } else if (user?.role === "instructor") {
      navigate("/instructor/notifications");
    } else {
      navigate("/student/notifications");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 transition-colors ${className}`}
      title={`${unreadCount} unread notifications${
        error ? " (Error loading count)" : ""
      }${isLoading ? " (Loading...)" : ""}`}
    >
      <Bell className="w-5 h-5" />
      {/* Show badge only if there are unread notifications */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white shadow-lg">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      {showText && (
        <span className="ml-2 text-sm">
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
