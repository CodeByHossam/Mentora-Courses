import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Mail, 
  Monitor, 
  DollarSign,
  Calculator,
  CreditCard,
  Percent
} from "lucide-react";
import {
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useUpdatePaymentSettingsMutation,
  useResetPaymentSettingsMutation,
  useTestPaymentGatewayMutation
} from "../store/services/adminSettingsApi";

const AdminSettings = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "general");
  
  // API hooks
  const { 
    data: adminSettingsData, 
    isLoading: isLoadingSettings, 
    error: settingsError,
    refetch: refetchSettings
  } = useGetAdminSettingsQuery();
  
  const [updateAdminSettings, { isLoading: isUpdatingSettings }] = useUpdateAdminSettingsMutation();
  const [updatePaymentSettings, { isLoading: isUpdatingPayment }] = useUpdatePaymentSettingsMutation();
  const [resetPaymentSettings, { isLoading: isResetting }] = useResetPaymentSettingsMutation();
  const [testPaymentGateway, { isLoading: isTesting }] = useTestPaymentGatewayMutation();

  // Local state for form data
  const [settings, setSettings] = useState({
    paymentSettings: {
      globalDeductionPercentage: 10,
      instructorAnnualFee: 100,
      studentAdminFee: 5,
      stripeEnabled: true,
      paypalEnabled: true,
      directTransferEnabled: true,
      minimumPaymentAmount: 5,
      currency: "USD",
      autoEnrollOnCardPayment: true,
      autoEnrollOnPaypalPayment: true,
      requireAdminApprovalForDirectTransfer: true
    },
    systemSettings: {
      siteName: "Mentora",
      siteDescription: "Professional Learning Management System",
      allowRegistration: true,
      maintenanceMode: false,
      maxFileSize: 50,
      sessionTimeout: 30,
      supportEmail: "support@Mentora.com",
      logLevel: "info",
      backupFrequency: "daily"
    },
    notificationSettings: {
      emailNotificationsEnabled: true,
      paymentNotificationsEnabled: true,
      enrollmentNotificationsEnabled: true,
      smsNotifications: false
    }
  });

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  // Legacy handler for backward compatibility
  const handleLegacySettingChange = (key, value) => {
    // Determine which section this setting belongs to
    const paymentKeys = ['globalDeductionPercentage', 'instructorAnnualFee', 'studentAdminFee', 'stripeEnabled', 'paypalEnabled', 'directTransferEnabled', 'minimumPaymentAmount', 'autoEnrollOnCardPayment', 'autoEnrollOnPaypalPayment', 'requireAdminApprovalForDirectTransfer'];
    const systemKeys = ['siteName', 'siteDescription', 'allowRegistration', 'maintenanceMode', 'maxFileSize', 'sessionTimeout', 'supportEmail'];
    const notificationKeys = ['emailNotificationsEnabled', 'paymentNotificationsEnabled', 'enrollmentNotificationsEnabled'];
    
    if (paymentKeys.includes(key)) {
      handleSettingChange('paymentSettings', key, value);
    } else if (systemKeys.includes(key)) {
      handleSettingChange('systemSettings', key, value);
    } else if (notificationKeys.includes(key)) {
      handleSettingChange('notificationSettings', key, value);
    }
  };

  // Sync API data with local state
  useEffect(() => {
    if (adminSettingsData?.data) {
      setSettings(prev => ({
        ...prev,
        ...adminSettingsData.data
      }));
    }
  }, [adminSettingsData]);

  // Debug logging
  useEffect(() => {
    if (settingsError) {
      console.error("Admin settings error:", settingsError);
    }
    if (adminSettingsData) {
      console.log("Admin settings data:", adminSettingsData);
    }
  }, [settingsError, adminSettingsData]);

  const handleSaveSettings = async () => {
    try {
      if (activeTab === "payments") {
        await updatePaymentSettings(settings.paymentSettings).unwrap();
        toast.success("Payment settings saved successfully!");
      } else {
        await updateAdminSettings(settings).unwrap();
        toast.success("Settings saved successfully!");
      }
      refetchSettings();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to save settings");
      console.error("Save settings error:", error);
    }
  };

  const handleResetPaymentSettings = async () => {
    if (!window.confirm("Are you sure you want to reset payment settings to defaults? This action cannot be undone.")) {
      return;
    }

    try {
      await resetPaymentSettings().unwrap();
      toast.success("Payment settings reset to defaults!");
      refetchSettings();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to reset payment settings");
      console.error("Reset payment settings error:", error);
    }
  };

  const tabs = [
    { id: "general", label: "⚙️ General", icon: "⚙️" },
    { id: "payments", label: "💰 Payment & Profit", icon: "💰" },
    { id: "security", label: "🔒 Security", icon: "🔒" },
    { id: "notifications", label: "📧 Notifications", icon: "📧" },
    { id: "system", label: "🖥️ System", icon: "🖥️" }
  ];

  // Show loading state
  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-gray-600">Loading admin settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (settingsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-medium">Error loading admin settings</p>
                <p className="text-sm">{settingsError?.data?.message || settingsError?.message || "Unknown error"}</p>
              </div>
              <button
                onClick={() => refetchSettings()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2 inline" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AdminSettingsView />;
};

export default AdminSettings;
