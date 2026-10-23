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

    

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ConfirmationModalWrapper />
        
        {/* Header Section */}
        <div className="card rounded-xl p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                👥 Manage Users
              </h1>
              <p className="mt-2 text-sm sm:text-base text-secondary">
                View, edit, and manage all users in the system
              </p>
              <div className="mt-4 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: 'var(--success)'}}></div>
                  <span className="text-sm text-secondary">Total Users: {users?.length || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: 'var(--info)'}}></div>
                  <span className="text-sm text-secondary">Filtered: {filteredUsers.length}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => navigate("/admin/users/create")}
                className="btn-success w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg text-sm font-medium transform transition-all duration-200 hover:scale-105"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create New User
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="card rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-secondary mb-2">
                🔍 Search Users
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg transition-all duration-200" style={{borderColor: 'var(--card-border)'}} onFocus={(e) => {e.target.style.borderColor = 'var(--success)'; e.target.style.outline = '2px solid var(--success)'; e.target.style.outlineOffset = '2px'}} onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
              />
            </div>
            <div className="lg:w-64">
              <label className="block text-sm font-medium text-secondary mb-2">
                🎭 Filter by Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg transition-all duration-200" style={{borderColor: 'var(--card-border)'}} onFocus={(e) => {e.target.style.borderColor = 'var(--success)'; e.target.style.outline = '2px solid var(--success)'; e.target.style.outlineOffset = '2px'}} onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
              >
                <option value="all">All Roles</option>
                <option value="student">👨‍🎓 Student</option>
                <option value="instructor">👨‍🏫 Instructor</option>
                <option value="admin">👨‍💼 Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-accent">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => {
                  const isLoadingAction = actionLoadingUserId === user._id;
                  return (
                    <tr key={user._id} className="hover:bg-accent transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0 rounded-full ring-2 flex items-center justify-center" style={{background: 'linear-gradient(to bottom right, var(--info), var(--primary))', ringColor: 'var(--card-border)'}}>
                            {user.avatar ? (
                              <img
                                className="h-12 w-12 rounded-full object-cover"
                                src={user.avatar}
                                alt={user.name}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`${user.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                              <User className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-primary">
                              {user.name}
                            </div>
                            <div className="text-xs text-muted">
                              ID: {user._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user._id, e.target.value)
                          }
                          disabled={isLoadingAction}
                          className="text-sm rounded-lg bg-white px-3 py-2 transition-all duration-200" 
                          style={{borderColor: 'var(--card-border)'}} 
                          onFocus={(e) => {e.target.style.borderColor = 'var(--success)'; e.target.style.outline = '2px solid var(--success)'; e.target.style.outlineOffset = '2px'}} 
                          onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
                        >
                          <option value="student">👨‍🎓 Student</option>
                          <option value="instructor">👨‍🏫 Instructor</option>
                          <option value="admin">👨‍💼 Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-500">Active:</span>
                            <button
                              onClick={() => handleActiveStateChange(user._id, !user.isActive)}
                              disabled={isLoadingAction || user.role === "admin"}
                              className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                                user.isActive 
                                  ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                              } ${isLoadingAction || user.role === "admin" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {user.isActive ? "✅ Active" : "❌ Inactive"}
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-500">Verified:</span>
                            <button
                              onClick={() => handleVerificationStateChange(user._id, !user.isVerified)}
                              disabled={isLoadingAction}
                              className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                                user.isVerified 
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-200" 
                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              } ${isLoadingAction ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {user.isVerified ? "✅ Verified" : "⏳ Unverified"}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(user.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              navigate(`/admin/users/${user._id}/edit`)
                            }
                            disabled={isLoadingAction}
                            className={`px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-all duration-200 ${
                              isLoadingAction ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                            }`}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={isLoadingAction}
                            className={`p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200 ${
                              isLoadingAction ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};



export default AdminManageUsers;


