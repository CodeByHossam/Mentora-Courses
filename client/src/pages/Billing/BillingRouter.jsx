import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import AdminBillingPage from "./AdminBillingPage";
import InstructorBillingPage from "./InstructorBillingPage";
import StudentBillingPage from "./StudentBillingPage";
import ProgressLoader from "../../components/ProgressLoader";

const BillingRouter = () => {
  const { user, isLoading } = useSelector((state) => state.auth);

  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ProgressLoader
          isVisible={true}
          message="Loading billing dashboard..."
        />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route to appropriate billing page based on user role
  switch (user.role) {
    case "admin":
      return <AdminBillingPage />;
    case "instructor":
      return <InstructorBillingPage />;
    case "student":
      return <StudentBillingPage />;
    default:
      // Fallback for unknown roles - redirect to home
      return <Navigate to="/" replace />;
  }
};

export default BillingRouter;
