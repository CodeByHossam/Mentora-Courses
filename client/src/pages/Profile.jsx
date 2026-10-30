import React, { useState, useEffect } from "react";
import ProfileView from "../components/ProfileView";
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

  return <ProfileView />;
};

export default Profile;
