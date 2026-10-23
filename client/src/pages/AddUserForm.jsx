import React, { useState } from "react";
import { useCreateUserMutation } from "../store/services/userApi";
import { toast } from "react-toastify";
import FormInput from "../components/FormInput";
import FileUpload from "../components/FileUpload";
import { validateForm, VALIDATION_RULES } from "../utils/validation";

const roles = ["admin", "instructor", "student"];

const AddUserForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    isVerified: false,
  });
  const [photo, setPhoto] = useState(null);

  const [createUser, { isLoading }] = useCreateUserMutation();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    const validation = validateForm(formData, VALIDATION_RULES.user.register);
    
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).flat();
      toast.error(errorMessages[0] || "Please fix the validation errors.");
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) =>
      payload.append(key, value)
    );
    if (photo) payload.append("photo", photo);

    try {
      await createUser(payload).unwrap();
      toast.success("User created successfully!");
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "student",
        isVerified: false,
      });
      setPhoto(null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create user.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-6">
            👤 Add New User
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <FormInput
          name="name"
          type="text"
          label="Name"
          value={formData.name}
          onChange={handleChange}
          required
          validationRules={VALIDATION_RULES.user.register.name}
          placeholder="Enter full name"
        />

        <FormInput
          name="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={handleChange}
          required
          validationRules={VALIDATION_RULES.user.register.email}
          placeholder="Enter email address"
        />

        <FormInput
          name="password"
          type="password"
          label="Password"
          value={formData.password}
          onChange={handleChange}
          required
          validationRules={VALIDATION_RULES.user.register.password}
          placeholder="Enter secure password"
        />

        {/* Role */}
        <div>
          <label className="block font-medium">Role *</label>
          <select
            name="role"
            className="form-select w-full"
            value={formData.role}
            onChange={handleChange}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* isVerified */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isVerified"
            checked={formData.isVerified}
            onChange={handleChange}
          />
          <label className="font-medium">Is Verified</label>
        </div>

        <FileUpload
          name="photo"
          label="Profile Photo"
          onChange={(e) => setPhoto(e.target.files)}
          accept="image/*"
          allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
          maxSize={2 * 1024 * 1024}
          preview={true}
        />

        {/* Submit */}
        <button
          type="submit"
          className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Add User"}
        </button>
      </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserForm;
