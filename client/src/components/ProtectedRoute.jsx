// src/components/ProtectedRoute.js
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../store/slices/authSlice";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Handle /dashboard route
  if (location.pathname === "/dashboard") {
    switch (user?.role) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "instructor":
        return <Navigate to="/instructor" replace />;
      case "student":
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // If no specific roles are required, allow access
  if (allowedRoles.length === 0) {
    return <Outlet />;
  }

  // Check if user has required role
  if (user?.role && allowedRoles.includes(user.role)) {
    return <Outlet />;
  }

  // If user has a role but it's not allowed, redirect to their dashboard
  if (user?.role) {
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "instructor":
        return <Navigate to="/instructor" replace />;
      case "student":
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Fallback to home page
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
