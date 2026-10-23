import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectCurrentToken,
} from "../store/slices/authSlice";
import {
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
} from "../store/services/authApi";
import { toast } from "react-toastify";
import { User, Camera } from "lucide-react";
import { UserCheck, ShieldCheck, BadgeCheck } from "lucide-react";


const Profile = () => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);
  const {
    data: profileData,
    isLoading,
    error,
    refetch,
  } = useGetCurrentUserQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    avatar: "", // URL preview
    avatarFile: null, // File object for upload
  });

  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    swift: "",
    iban: "",
    routingNumber: "",
    branchCode: "",
    preferredMethod: "bank_transfer",
  });

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || "",
        email: profileData.email || "",
        bio: profileData.bio || "",
        avatar: profileData.avatar || "",
        avatarFile: null,
      });

      // Initialize payment data
      const paymentDetails = profileData.paymentDetails || {};
      const bankDetails = paymentDetails.bankDetails || {};
      const paymentPreferences = paymentDetails.paymentPreferences || {};

      setPaymentData({
        bankName: bankDetails.bankName || "",
        accountNumber: bankDetails.accountNumber || "",
        accountHolder: bankDetails.accountHolder || "",
        swift: bankDetails.swift || "",
        iban: bankDetails.iban || "",
        routingNumber: bankDetails.routingNumber || "",
        branchCode: bankDetails.branchCode || "",
        preferredMethod: paymentPreferences.preferredMethod || "bank_transfer",
      });
    }
  }, [profileData]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "avatar") {
      const file = files[0];
      if (file) {
        setFormData((prev) => ({
          ...prev,
          avatarFile: file,
          avatar: URL.createObjectURL(file), // preview
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("name", formData.name);
    form.append("email", formData.email);
    form.append("bio", formData.bio);
    if (formData.avatarFile) {
      form.append("photo", formData.avatarFile);
    }

    try {
      await updateProfile(form).unwrap();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      refetch();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/payment-details",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (response.ok) {
        toast.success("Payment information updated successfully!");
        setIsEditingPayment(false);
        refetch();
      } else {
        toast.error("Failed to update payment information");
      }
    } catch (error) {
      console.error("Error updating payment info:", error);
      toast.error("Error updating payment information");
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        Loading user data...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex justify-center items-center">
        Error loading profile data
      </div>
    );
  if (!profileData)
    return (
      <div className="min-h-screen flex justify-center items-center">
        No profile data available
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="relative h-48 bg-gradient-to-r from-green-500 via-blue-600 to-purple-600">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div className="h-32 w-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden shadow-lg flex items-center justify-center">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt={formData.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`${
                      formData.avatar ? "hidden" : "flex"
                    } items-center justify-center w-full h-full`}
                  >
                    <User className="w-12 h-12 text-white" />
                  </div>
                </div>
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2 shadow-lg">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-20 pb-8 px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profileData?.name}
                </h1>
                <p className="text-gray-600 text-lg mb-1">
                  {profileData?.email}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 capitalize">
                    {profileData?.role}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    Member since{" "}
                    {new Date(profileData?.createdAt).getFullYear()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isEditing
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 hover:shadow-lg"
                }`}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {isEditing ? (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Edit Profile Information
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        readOnly
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      id="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="avatar"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-gray-300 flex items-center justify-center">
                        {formData.avatar ? (
                          <img
                            src={formData.avatar}
                            alt="Preview"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`${
                            formData.avatar ? "hidden" : "flex"
                          } items-center justify-center w-full h-full`}
                        >
                          <User className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <input
                        type="file"
                        name="avatar"
                        id="avatar"
                        accept="image/*"
                        onChange={handleChange}
                        className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a new profile picture (JPG, PNG, max 5MB)
                    </p>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 ${
                        isUpdating
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:shadow-lg"
                      }`}
                    >
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    About
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {profileData?.bio ||
                      "No bio provided yet. Click 'Edit Profile' to add information about yourself."}
                  </p>
                </div>

                {/* Stats Cards */}

<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
  {/* Profile Completion */}
  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
      <BadgeCheck className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-gray-500">Profile</p>
      <p className="text-lg font-semibold">Complete</p>
    </div>
  </div>

  {/* Account Status */}
  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
    <div className="p-3 rounded-full bg-green-100 text-green-600">
      <UserCheck className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-gray-500">Account</p>
      <p className="text-lg font-semibold">Active</p>
    </div>
  </div>

  {/* Role */}
  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
      <ShieldCheck className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-gray-500">Role</p>
      <p className="text-lg font-semibold capitalize">{profileData?.role}</p>
    </div>
  </div>
</div>

                {/* Billing Information Section */}
                {(profileData?.role === "instructor" ||
                  profileData?.role === "admin") && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Payment Information
                      </h3>
                      <button
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                        onClick={() => setIsEditingPayment(!isEditingPayment)}
                      >
                        {isEditingPayment ? "Cancel" : "Manage"}
                      </button>
                    </div>
                    {isEditingPayment ? (
                      <form
                        onSubmit={handlePaymentSubmit}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bank Name
                            </label>
                            <input
                              type="text"
                              name="bankName"
                              value={paymentData.bankName}
                              onChange={handlePaymentChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Enter bank name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Account Holder Name
                            </label>
                            <input
                              type="text"
                              name="accountHolder"
                              value={paymentData.accountHolder}
                              onChange={handlePaymentChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Full name on account"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Account Number
                            </label>
                            <input
                              type="text"
                              name="accountNumber"
                              value={paymentData.accountNumber}
                              onChange={handlePaymentChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Account number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              SWIFT Code
                            </label>
                            <input
                              type="text"
                              name="swift"
                              value={paymentData.swift}
                              onChange={handlePaymentChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="SWIFT/BIC code"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              IBAN (Optional)
                            </label>
                            <input
                              type="text"
                              name="iban"
                              value={paymentData.iban}
                              onChange={handlePaymentChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="International Bank Account Number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Preferred Method
                            </label>
                            <select
                              name="preferredMethod"
                              value={paymentData.preferredMethod}
                              onChange={handlePaymentChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="bank_transfer">
                                Bank Transfer
                              </option>
                              <option value="stripe">Stripe</option>
                              <option value="paypal">PayPal</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setIsEditingPayment(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Save Payment Info
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-gray-600">
                        {profileData?.paymentDetails?.bankDetails?.bankName ? (
                          <div className="space-y-2">
                            <p>
                              <span className="font-medium">Bank:</span>{" "}
                              {profileData.paymentDetails.bankDetails.bankName}
                            </p>
                            <p>
                              <span className="font-medium">
                                Account Holder:
                              </span>{" "}
                              {
                                profileData.paymentDetails.bankDetails
                                  .accountHolder
                              }
                            </p>
                            <p>
                              <span className="font-medium">
                                Preferred Method:
                              </span>{" "}
                              {profileData.paymentDetails.paymentPreferences
                                ?.preferredMethod || "Bank Transfer"}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <svg
                              className="w-8 h-8 mx-auto text-gray-400 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            <p className="text-gray-500 mb-2">
                              No payment information added yet
                            </p>
                            <p className="text-sm text-gray-400">
                              Add your payment details to receive earnings from
                              course sales
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
