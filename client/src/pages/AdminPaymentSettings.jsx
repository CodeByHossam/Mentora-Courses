/**
 * Admin Payment Settings Page
 * 
 * Allows administrators to configure payment system settings including:
 * - Payment gateway configuration (Stripe, PayPal, Direct Transfer)
 * - Fee structures and percentages
 * - Auto-enrollment settings
 * - Payment statistics and monitoring
 * 
 * @author Mentora Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  CreditCard, 
  DollarSign, 
  Settings, 
  BarChart3, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Save,
  TestTube
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const AdminPaymentSettings = () => {
  const [settings, setSettings] = useState({
    paymentSettings: {
      instructorAnnualFee: 0,
      studentAdminFee: 0,
      globalDeductionPercentage: 0,
      stripeEnabled: false,
      paypalEnabled: false,
      directTransferEnabled: true,
      minimumPaymentAmount: 1,
      currency: 'USD',
      autoEnrollOnCardPayment: true,
      autoEnrollOnPaypalPayment: true,
      requireAdminApprovalForDirectTransfer: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [testLoading, setTestLoading] = useState({ stripe: false, paypal: false });
  const [paymentStats, setPaymentStats] = useState(null);
  const [gatewayStatus, setGatewayStatus] = useState({ stripe: null, paypal: null });

  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
    fetchPaymentStats();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      } else {
        toast.error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await fetch('/api/admin/settings/payment-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      paymentSettings: {
        ...prev.paymentSettings,
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setSaveLoading(true);
    try {
      const response = await fetch('/api/admin/settings/payment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings.paymentSettings)
      });

      if (response.ok) {
        toast.success('Payment settings saved successfully');
        fetchPaymentStats(); // Refresh stats
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleResetSettings = async () => {
    if (!window.confirm('Are you sure you want to reset all payment settings to defaults?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/payment/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Settings reset to defaults');
        fetchSettings();
      } else {
        toast.error('Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Error resetting settings');
    } finally {
      setLoading(false);
    }
  };

  const testGateway = async (gateway) => {
    setTestLoading(prev => ({ ...prev, [gateway]: true }));
    try {
      const response = await fetch('/api/admin/settings/test-gateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ gateway })
      });

      const data = await response.json();
      setGatewayStatus(prev => ({ ...prev, [gateway]: data.data }));
      
      if (data.data.connected) {
        toast.success(`${gateway} connection successful`);
      } else {
        toast.error(`${gateway} connection failed: ${data.data.error}`);
      }
    } catch (error) {
      console.error(`Error testing ${gateway}:`, error);
      toast.error(`Error testing ${gateway} connection`);
    } finally {
      setTestLoading(prev => ({ ...prev, [gateway]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Settings</h1>
          <p className="text-gray-600 mt-2">Configure payment gateways, fees, and enrollment settings</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleResetSettings}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveSettings}
            loading={saveLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Payment Statistics */}
      {paymentStats && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Payment Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{paymentStats.totalPayments}</div>
              <div className="text-sm text-gray-600">Total Payments</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${paymentStats.totalRevenue?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ${paymentStats.totalAdminFees?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">Admin Fees</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                ${paymentStats.totalInstructorPayments?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">Instructor Payments</div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Gateway Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Gateways
          </h2>
          
          <div className="space-y-4">
            {/* Stripe */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Stripe</div>
                  <div className="text-sm text-gray-500">Credit/Debit Card Processing</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {gatewayStatus.stripe && (
                  <div className="flex items-center">
                    {gatewayStatus.stripe.connected ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testGateway('stripe')}
                  loading={testLoading.stripe}
                >
                  <TestTube className="w-4 h-4 mr-1" />
                  Test
                </Button>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.paymentSettings.stripeEnabled}
                    onChange={(e) => handleSettingChange('stripeEnabled', e.target.checked)}
                    className="mr-2"
                  />
                  Enable
                </label>
              </div>
            </div>

            {/* PayPal */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium">PayPal</div>
                  <div className="text-sm text-gray-500">PayPal Payment Processing</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {gatewayStatus.paypal && (
                  <div className="flex items-center">
                    {gatewayStatus.paypal.connected ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testGateway('paypal')}
                  loading={testLoading.paypal}
                >
                  <TestTube className="w-4 h-4 mr-1" />
                  Test
                </Button>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.paymentSettings.paypalEnabled}
                    onChange={(e) => handleSettingChange('paypalEnabled', e.target.checked)}
                    className="mr-2"
                  />
                  Enable
                </label>
              </div>
            </div>

            {/* Direct Transfer */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Settings className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Direct Bank Transfer</div>
                  <div className="text-sm text-gray-500">Manual bank transfer with receipt upload</div>
                </div>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.paymentSettings.directTransferEnabled}
                  onChange={(e) => handleSettingChange('directTransferEnabled', e.target.checked)}
                  className="mr-2"
                />
                Enable
              </label>
            </div>
          </div>
        </Card>

        {/* Fee Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Fee Configuration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor Annual Fee ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.paymentSettings.instructorAnnualFee}
                onChange={(e) => handleSettingChange('instructorAnnualFee', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Admin Fee ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.paymentSettings.studentAdminFee}
                onChange={(e) => handleSettingChange('studentAdminFee', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Global Deduction Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.paymentSettings.globalDeductionPercentage}
                onChange={(e) => handleSettingChange('globalDeductionPercentage', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Payment Amount ($)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={settings.paymentSettings.minimumPaymentAmount}
                onChange={(e) => handleSettingChange('minimumPaymentAmount', parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={settings.paymentSettings.currency}
                onChange={(e) => handleSettingChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Enrollment Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Enrollment Settings
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.paymentSettings.autoEnrollOnCardPayment}
              onChange={(e) => handleSettingChange('autoEnrollOnCardPayment', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Auto-enroll on card payment
            </span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.paymentSettings.autoEnrollOnPaypalPayment}
              onChange={(e) => handleSettingChange('autoEnrollOnPaypalPayment', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Auto-enroll on PayPal payment
            </span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.paymentSettings.requireAdminApprovalForDirectTransfer}
              onChange={(e) => handleSettingChange('requireAdminApprovalForDirectTransfer', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Require admin approval for direct transfers
            </span>
          </label>
        </div>
      </Card>
    </div>
  );
};

export default AdminPaymentSettings;
