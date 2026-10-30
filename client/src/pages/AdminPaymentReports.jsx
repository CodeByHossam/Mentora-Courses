import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPaymentReportsQuery } from '../store/services/paymentApi';
import {
  TrendingUp,
  DollarSign,
  Users,
  CreditCard,
  Calendar,
  Download,
  Filter,
  Eye,
  FileText,
  PieChart,
  BarChart3
} from 'lucide-react';

const AdminPaymentReports = () => {
  const navigate = useNavigate();
  const { data: reportsData, isLoading, error } = useGetPaymentReportsQuery();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedPayment, setSelectedPayment] = useState(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <h2 className="text-2xl font-bold mb-2">Error Loading Reports</h2>
          <p>{error?.data?.message || 'Failed to load payment reports'}</p>
        </div>
      </div>
    );
  }

  const { overview, payments, analytics, settings } = reportsData?.data || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings?.paymentSettings?.currency || settings?.currency || 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      submitted: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getMethodIcon = (method) => {
    const icons = {
      stripe: '💳',
      paypal: '🅿️',
      direct_transfer: '🏦',
      card: '💳',
      bank: '🏦',
      cash: '💵'
    };
    return icons[method] || '💰';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'payments', label: 'All Payments', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Profit Settings', icon: DollarSign }
  ];

  return null;
};

export default AdminPaymentReports;
