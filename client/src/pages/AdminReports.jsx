import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ProgressLoader from "../components/ProgressLoader";
import { selectCurrentUser } from "../store/slices/authSlice";
import { useGetAdminReportsQuery } from "../store/services/userApi";

const AdminReports = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { data, error, isLoading } = useGetAdminReportsQuery(undefined, {
    skip: !user || user.role !== "admin",
  });

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
    }
  }, [user, navigate]);

  if (isLoading)
    return <ProgressLoader isVisible={true} message="Loading reports..." />;
  if (error)
    return (
      <div className="text-red-600 p-8">
        Error:{" "}
        {error?.data?.message || error?.message || "Failed to fetch reports"}
      </div>
    );
  if (!data) return null;

  return <AdminReportsView />;
};

export default AdminReports;
