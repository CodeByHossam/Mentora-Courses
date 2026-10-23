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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{background: 'linear-gradient(to right, var(--info), var(--secondary))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
                ⚙️ System Settings
              </h1>
              <p className="mt-2 text-secondary">
                Configure system-wide settings and preferences
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={isUpdatingSettings || isUpdatingPayment}
              className="btn-primary px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {(isUpdatingSettings || isUpdatingPayment) ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin inline" />
                  Saving...
                </>
              ) : (
                <>💾 Save Changes</>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card rounded-xl p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "text-white shadow-lg"
                        : "text-secondary hover:bg-accent"
                    }`}
                    style={activeTab === tab.id ? {background: 'linear-gradient(to right, var(--info), var(--secondary))'} : {}}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {activeTab === "general" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-primary mb-6">General Settings</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Site Name
                      </label>
                      <input
                        type="text"
                        value={settings.systemSettings?.siteName || settings.siteName || ""}
                        onChange={(e) => handleLegacySettingChange("siteName", e.target.value)}
                        className="w-full px-4 py-3 border rounded-lg transition-colors" style={{borderColor: 'var(--card-border)'}} onFocus={(e) => {e.target.style.borderColor = 'var(--primary)'; e.target.style.outline = '2px solid var(--primary)'; e.target.style.outlineOffset = '2px'}} onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Max File Size (MB)
                      </label>
                      <input
                        type="number"
                        value={settings.systemSettings?.maxFileSize || settings.maxFileSize || 50}
                        onChange={(e) => handleLegacySettingChange("maxFileSize", parseInt(e.target.value))}
                        className="w-full px-4 py-3 border rounded-lg transition-colors" style={{borderColor: 'var(--card-border)'}} onFocus={(e) => {e.target.style.borderColor = 'var(--primary)'; e.target.style.outline = '2px solid var(--primary)'; e.target.style.outlineOffset = '2px'}} onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Description
                    </label>
                    <textarea
                      value={settings.systemSettings?.siteDescription || settings.siteDescription || ""}
                      onChange={(e) => handleLegacySettingChange("siteDescription", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={settings.systemSettings?.supportEmail || settings.supportEmail || ""}
                      onChange={(e) => handleLegacySettingChange("supportEmail", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.systemSettings?.allowRegistration ?? settings.allowRegistration ?? true}
                        onChange={(e) => handleLegacySettingChange("allowRegistration", e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Allow user registration</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.systemSettings?.maintenanceMode ?? settings.maintenanceMode ?? false}
                        onChange={(e) => handleLegacySettingChange("maintenanceMode", e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Maintenance mode</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">💰 Payment & Profit Configuration</h2>
                    <button
                      onClick={handleResetPaymentSettings}
                      disabled={isResetting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResetting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin inline" />
                          Resetting...
                        </>
                      ) : (
                        <>🔄 Reset to Defaults</>
                      )}
                    </button>
                  </div>
                  
                  {/* Profit Settings */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                      <span className="mr-2">📈</span>
                      Platform Profit Settings
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Global Deduction Percentage (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={settings.paymentSettings?.globalDeductionPercentage || settings.globalDeductionPercentage || 10}
                          onChange={(e) => handleLegacySettingChange("globalDeductionPercentage", parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Percentage deducted from each course payment as platform profit
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Currency
                        </label>
                        <select
                          value={settings.paymentSettings?.currency || settings.currency || "USD"}
                          onChange={(e) => handleLegacySettingChange("currency", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                          <option value="AUD">AUD - Australian Dollar</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Annual User Fees */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <span className="mr-2">👥</span>
                      Annual User Fees
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Instructor Annual Fee ({settings.paymentSettings?.currency || settings.currency || "USD"})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={settings.paymentSettings?.instructorAnnualFee || settings.instructorAnnualFee || 100}
                          onChange={(e) => handleLegacySettingChange("instructorAnnualFee", parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border rounded-lg transition-colors" style={{borderColor: 'var(--card-border)'}} onFocus={(e) => {e.target.style.borderColor = 'var(--primary)'; e.target.style.outline = '2px solid var(--primary)'; e.target.style.outlineOffset = '2px'}} onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Annual fee charged to instructors for platform access
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Student Admin Fee ({settings.paymentSettings?.currency || settings.currency || "USD"})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={settings.paymentSettings?.studentAdminFee || settings.studentAdminFee || 5}
                          onChange={(e) => handleLegacySettingChange("studentAdminFee", parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border rounded-lg transition-colors" style={{borderColor: 'var(--card-border)'}} onFocus={(e) => {e.target.style.borderColor = 'var(--primary)'; e.target.style.outline = '2px solid var(--primary)'; e.target.style.outlineOffset = '2px'}} onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Annual administrative fee for student accounts
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Gateway Settings */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                      <span className="mr-2">💳</span>
                      Payment Gateway Configuration
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Minimum Payment Amount ({settings.paymentSettings?.currency || settings.currency || "USD"})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={settings.paymentSettings?.minimumPaymentAmount || settings.minimumPaymentAmount || 5}
                          onChange={(e) => handleLegacySettingChange("minimumPaymentAmount", parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            <span className="mr-2">💳</span>
                            Stripe Payments
                          </div>
                          <div className="text-sm text-gray-500">Enable Stripe payment gateway</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.paymentSettings?.stripeEnabled ?? settings.stripeEnabled ?? true}
                          onChange={(e) => handleLegacySettingChange("stripeEnabled", e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            <span className="mr-2">🅿️</span>
                            PayPal Payments
                          </div>
                          <div className="text-sm text-gray-500">Enable PayPal payment gateway</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.paymentSettings?.paypalEnabled ?? settings.paypalEnabled ?? true}
                          onChange={(e) => handleLegacySettingChange("paypalEnabled", e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            <span className="mr-2">🏦</span>
                            Direct Transfer
                          </div>
                          <div className="text-sm text-gray-500">Enable direct bank transfers</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.paymentSettings?.directTransferEnabled ?? settings.directTransferEnabled ?? true}
                          onChange={(e) => handleLegacySettingChange("directTransferEnabled", e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Enrollment Settings */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                      <span className="mr-2">🎓</span>
                      Enrollment Automation
                    </h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Auto-enroll on Card Payment</div>
                          <div className="text-sm text-gray-500">Automatically enroll students after successful card payments</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.paymentSettings?.autoEnrollOnCardPayment ?? settings.autoEnrollOnCardPayment ?? true}
                          onChange={(e) => handleLegacySettingChange("autoEnrollOnCardPayment", e.target.checked)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Auto-enroll on PayPal Payment</div>
                          <div className="text-sm text-gray-500">Automatically enroll students after successful PayPal payments</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.paymentSettings?.autoEnrollOnPaypalPayment ?? settings.autoEnrollOnPaypalPayment ?? true}
                          onChange={(e) => handleLegacySettingChange("autoEnrollOnPaypalPayment", e.target.checked)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Require Admin Approval for Direct Transfers</div>
                          <div className="text-sm text-gray-500">Direct transfer payments require manual admin approval</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.paymentSettings?.requireAdminApprovalForDirectTransfer ?? settings.requireAdminApprovalForDirectTransfer ?? true}
                          onChange={(e) => handleLegacySettingChange("requireAdminApprovalForDirectTransfer", e.target.checked)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Profit Calculator Preview */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🧮</span>
                      Profit Calculator Preview
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-blue-600">$100</div>
                        <div className="text-sm text-gray-600">Course Price</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-green-600">${(100 * (settings.paymentSettings?.globalDeductionPercentage || settings.globalDeductionPercentage || 10) / 100).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Platform Profit ({settings.paymentSettings?.globalDeductionPercentage || settings.globalDeductionPercentage || 10}%)</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-purple-600">${(100 - (100 * (settings.paymentSettings?.globalDeductionPercentage || settings.globalDeductionPercentage || 10) / 100)).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Instructor Earnings</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.systemSettings?.sessionTimeout || settings.sessionTimeout || 30}
                        onChange={(e) => handleLegacySettingChange("sessionTimeout", parseInt(e.target.value))}
                        className="w-full px-4 py-3 border rounded-lg transition-colors" style={{borderColor: 'var(--card-border)'}} onFocus={(e) => {e.target.style.borderColor = 'var(--primary)'; e.target.style.outline = '2px solid var(--primary)'; e.target.style.outlineOffset = '2px'}} onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Log Level
                      </label>
                      <select
                        value={settings.systemSettings?.logLevel || settings.logLevel || "info"}
                        onChange={(e) => handleLegacySettingChange("logLevel", e.target.value)}
                        className="w-full px-4 py-3 border rounded-lg transition-colors" style={{borderColor: 'var(--card-border)'}} onFocus={(e) => {e.target.style.borderColor = 'var(--primary)'; e.target.style.outline = '2px solid var(--primary)'; e.target.style.outlineOffset = '2px'}} onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
                      >
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <span className="text-yellow-400 text-xl">⚠️</span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Changes to security settings will affect all users. Please review carefully before saving.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Settings</h2>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Email Notifications</div>
                        <div className="text-sm text-gray-500">Send notifications via email</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notificationSettings?.emailNotificationsEnabled ?? settings.emailNotifications ?? true}
                        onChange={(e) => handleLegacySettingChange("emailNotificationsEnabled", e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">SMS Notifications</div>
                        <div className="text-sm text-gray-500">Send notifications via SMS</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notificationSettings?.smsNotifications ?? settings.smsNotifications ?? false}
                        onChange={(e) => handleLegacySettingChange("smsNotifications", e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Payment Notifications</div>
                        <div className="text-sm text-gray-500">Send notifications for payment events</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notificationSettings?.paymentNotificationsEnabled ?? settings.paymentNotificationsEnabled ?? true}
                        onChange={(e) => handleLegacySettingChange("paymentNotificationsEnabled", e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Enrollment Notifications</div>
                        <div className="text-sm text-gray-500">Send notifications for enrollment events</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notificationSettings?.enrollmentNotificationsEnabled ?? settings.enrollmentNotificationsEnabled ?? true}
                        onChange={(e) => handleLegacySettingChange("enrollmentNotificationsEnabled", e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "system" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Backup Frequency
                    </label>
                    <select
                      value={settings.systemSettings?.backupFrequency || settings.backupFrequency || "daily"}
                      onChange={(e) => handleLegacySettingChange("backupFrequency", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <span className="text-green-500 text-2xl mr-3">💾</span>
                        <div>
                          <div className="font-medium text-green-900">Storage</div>
                          <div className="text-sm text-green-700">85% Used</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <span className="text-blue-500 text-2xl mr-3">🔄</span>
                        <div>
                          <div className="font-medium text-blue-900">Last Backup</div>
                          <div className="text-sm text-blue-700">2 hours ago</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <span className="text-purple-500 text-2xl mr-3">📊</span>
                        <div>
                          <div className="font-medium text-purple-900">System Load</div>
                          <div className="text-sm text-purple-700">Normal</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
