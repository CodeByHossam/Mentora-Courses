import React, { useState, useEffect } from "react";
import { Trash2, User } from "lucide-react";

import { handleApiError, handleApiSuccess } from "../utils/apiErrorHandler"; // adjust path as needed
import { useNavigate } from "react-router-dom";
import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUpdateUserActiveStateMutation,
  useUpdateUserVerificationStateMutation,
} from "../store/services/userApi";
import ProgressLoader from "../components/ProgressLoader";
import { useConfirm } from "../hooks/useConfirm";
import AdminManageUsersView from "./AdminManageUsersView";

const AdminManageUsers = () => {
  const { confirm, ConfirmationModalWrapper } = useConfirm();
  const navigate = useNavigate();

  // States for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // States to track loading for user actions (delete/update)
  const [actionLoadingUserId, setActionLoadingUserId] = useState(null);

  // Fetch users
  const { data: users, isLoading, error } = useGetUsersQuery();

  // Mutations
  const [deleteUser] = useDeleteUserMutation();
  const [updateUserRole] = useUpdateUserMutation();
  const [updateUserActiveState] = useUpdateUserActiveStateMutation();
  const [updateUserVerificationState] = useUpdateUserVerificationStateMutation();

  // Debounce search input to reduce filter computations
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Filter users based on debounced search term and role filter
  const filteredUsers =
    users?.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    }) || [];

  // Handle user deletion with loading and error handling
  const handleDeleteUser = async (userId) => {
    const confirmed = await confirm({
      title: "Delete User",
      message: "Are you sure you want to delete this user?",
    });

    if (!confirmed) return;
    if (confirmed) {
      setActionLoadingUserId(userId);
      try {
        await deleteUser(userId).unwrap();
        handleApiSuccess("User deleted successfully");
      } catch (err) {
        handleApiError(err);
      } finally {
        setActionLoadingUserId(null);
      }
    }
  };

  // Handle role update with loading and error handling
  const handleRoleChange = async (userId, newRole) => {
    setActionLoadingUserId(userId);
    try {
      await updateUserRole({ id:userId, body:{role: newRole} }).unwrap();
      handleApiSuccess("User role updated successfully");
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoadingUserId(null);
    }
  };

  // Handle active state toggle
  const handleActiveStateChange = async (userId, isActive) => {
    setActionLoadingUserId(userId);
    try {
      await updateUserActiveState({ userId, isActive }).unwrap();
      handleApiSuccess(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoadingUserId(null);
    }
  };

  // Handle verification state toggle
  const handleVerificationStateChange = async (userId, isVerified) => {
    setActionLoadingUserId(userId);
    try {
      await updateUserVerificationState({ userId, isVerified }).unwrap();
      handleApiSuccess(`User ${isVerified ? 'verified' : 'unverified'} successfully`);
    } catch (err) {
      handleApiError(err);
    } finally {
      setActionLoadingUserId(null);
    }
  };

  // Show spinner while fetching users
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ProgressLoader isVisible={true} message="Loading users..." />
      </div>
    );
  }

  // Show error message if fetching users fails
if (error) {
  handleApiError(error);
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-600">
          {error.data?.message || "Failed to load users"}
        </p>
      </div>
    </div>
  );
}

  return <AdminManageUsersView />;
};

export default AdminManageUsers;
