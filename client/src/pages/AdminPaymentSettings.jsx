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

  return <AdminPaymentSettingsView />;
};

export default AdminPaymentSettings;
