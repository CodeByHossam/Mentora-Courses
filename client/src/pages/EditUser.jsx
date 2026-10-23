import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useUpdateUserMutation,
  useGetUserQuery,
} from "../store/services/userApi";

const EditUser = () => {
  const { userID } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetUserQuery(userID);
  const [updateUser] = useUpdateUserMutation();

  const user = data?.userData;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    bio: "",
    avatar: "", // preview only
    avatarFile: null,
    isVerified: false,
    isActive: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
        avatarFile: null,
        isVerified: user.isVerified || false,
        isActive: user.isActive || false,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setFormData((prev) => ({
        ...prev,
        avatarFile: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("role", formData.role);
    payload.append("bio", formData.bio);
    payload.append("isVerified", formData.isVerified);
    payload.append("isActive", formData.isActive);
    if (formData.avatarFile) {
      payload.append("photo", formData.avatarFile);
    }

    try {
      await updateUser({ id: userID, body: payload }).unwrap();
      navigate("/dashboard");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update user. Please try again.");
    }
  };

  if (isLoading) return <p>Loading user...</p>;
  if (isError) return <p>Error loading user data</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-6">
            ✏️ Edit User
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

      {formData.avatar && (
        <div className="mb-4">
          <img
            src={formData.avatar}
            alt="Current Avatar"
            className="w-24 h-24 rounded-full object-cover"
          />
        </div>
      )}

      <div>
        <label className="block font-medium">Name:</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="form-input w-full"
        />
      </div>

      <div>
        <label className="block font-medium">Email:</label>
        <input
          name="email"
          value={formData.email}
          readOnly
          disabled
          className="form-input w-full bg-gray-100 text-gray-500 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block font-medium">Role:</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="form-select w-full"
        >
          <option value="">Select Role</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label className="block font-medium">Bio:</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          className="form-textarea w-full"
          rows="3"
        />
      </div>

      <div>
        <label className="block font-medium">Upload New Avatar:</label>
        <input
          type="file"
          name="avatar"
          accept="image/*"
          onChange={handleChange}
          className="form-input w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isVerified"
            checked={formData.isVerified}
            onChange={handleChange}
          />
          <span>Verified</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
          />
          <span>Active</span>
        </label>
      </div>

      <button
        type="submit"
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
      >
        Save Changes
      </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUser;
