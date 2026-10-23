/**
 * Admin Payments & Accounting Page
 * 
 * Comprehensive payment management dashboard for administrators including:
 * - Payment statistics and analytics
 * - Recent transactions and payment history
 * - Direct transfer approval/rejection
 * - Payment method breakdown
 * - Revenue tracking and reporting
 * 
 * @author Mentora Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
  Building2,
  Eye,
  Download,
  RefreshCw,
  User,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-toastify';
import PaymentDetailsModal from '../components/PaymentDetailsModal';
import { 
  useGetAdminPaymentStatsQuery,
  useGetAdminPendingTransfersQuery,
  useApproveAdminTransferMutation 
} from '../store/services/paymentApi';
import { 
  useGetPendingDirectTransfersQuery,
  useApproveDirectTransferMutation 
} from '../store/services/billingApi';
import { useGetPaymentReportsQuery } from '../store/services/paymentApi';

const AdminPayments = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    method: 'all',
    dateRange: '30'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Redux RTK Query hooks
  const { 
    data: paymentStatsData, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats
  } = useGetAdminPaymentStatsQuery();

  const { 
    data: reportsData, 
    isLoading: reportsLoading, 
    error: reportsError 
  } = useGetPaymentReportsQuery();

  const { 
    data: courseTransfersData, 
    isLoading: courseTransfersLoading, 
    error: courseTransfersError,
    refetch: refetchCourseTransfers
  } = useGetAdminPendingTransfersQuery();

  const { 
    data: billingTransfersData, 
    isLoading: billingTransfersLoading, 
    error: billingTransfersError,
    refetch: refetchBillingTransfers
  } = useGetPendingDirectTransfersQuery();

  const [approveAdminTransfer] = useApproveAdminTransferMutation();
  const [approveBillingTransfer] = useApproveDirectTransferMutation();

  // Combine data from different sources with better error handling
  const paymentStats = paymentStatsData?.data || {};
  const recentPayments = paymentStats?.recentPayments || [];
  const loading = statsLoading || courseTransfersLoading || billingTransfersLoading;
  
  // Add fallback values for payment stats
  const safePaymentStats = {
    totalRevenue: paymentStats?.totalRevenue || 0,
    totalAdminFees: paymentStats?.totalAdminFees || 0,
    totalPayments: paymentStats?.totalPayments || 0,
    totalInstructorPayments: paymentStats?.totalInstructorPayments || 0,
    paymentMethodStats: paymentStats?.paymentMethodStats || []
  };

  const courseTransfers = courseTransfersData?.data || [];
  const billingTransfers = (billingTransfersData?.pendingPayments || []).map(payment => ({
    ...payment,
    isBillingPayment: true
  }));
  const allPendingTransfers = [...courseTransfers, ...billingTransfers];

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: reportsData?.data?.settings?.paymentSettings?.currency || reportsData?.data?.settings?.currency || 'USD'
    }).format(amount || 0);
  };

  // Format date helper
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status color helper
  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      submitted: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get method icon helper
  const getMethodIcon = (method) => {
    const icons = {
      stripe: '💳',
      paypal: '🅿️',
      direct_transfer: '🏦',
      card: '💳',
      bank: '🏦',
      cash: '💵',
      bank_transfer: '🏦'
    };
    return icons[method] || '💰';
  };

  // Tab definitions
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'course-payments', label: 'Course Payments', icon: CreditCard },
    { id: 'admin-fee-payments', label: 'Admin Fee Payments', icon: DollarSign },
    { id: 'all-payments', label: 'All Payments', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: PieChart }
  ];

  // Debug logging
  console.log('🔍 Payment stats:', paymentStats);
  console.log('🔍 Course transfers:', courseTransfers);
  console.log('🔍 Billing transfers:', billingTransfers);
  console.log('🔍 All pending transfers:', allPendingTransfers);
  console.log('🔍 Combined pending transfers:', allPendingTransfers);
  
  // Log any errors
  if (statsError) {
    console.log('❌ Stats error:', statsError);
    toast.error('Failed to load payment statistics');
  }
  if (courseTransfersError) {
    console.log('❌ Course transfers error:', courseTransfersError);
    toast.error('Failed to load course transfers');
  }
  if (billingTransfersError) {
    console.log('❌ Billing transfers error:', billingTransfersError);
    toast.error('Failed to load billing transfers - Server error (500)');
  }

  const handleTransferAction = async (paymentId, action, isBillingPayment = false) => {
    console.log('🔄 Admin payment approval:', { paymentId, action, isBillingPayment });
    setActionLoading(prev => ({ ...prev, [paymentId]: true }));
    
    try {
      if (isBillingPayment) {
        await approveBillingTransfer({ 
          paymentId, 
          action,
          adminNotes: `${action === 'approve' ? 'Approved' : 'Rejected'} by admin`
        }).unwrap();
        refetchBillingTransfers();
      } else {
        // Course payments expect different format: approved (boolean) + adminNote (string)
        await approveAdminTransfer({ 
          paymentId, 
          approved: action === 'approve',
          adminNote: `${action === 'approve' ? 'Approved' : 'Rejected'} by admin`
        }).unwrap();
        refetchCourseTransfers();
      }

      if (isBillingPayment) {
        if (action === 'approve') {
          toast.success('Billing payment approved - Outstanding balance and credits updated');
        } else {
          toast.success('Billing payment rejected');
        }
      } else {
        if (action === 'approve') {
          toast.success('Course payment approved - Student enrolled successfully');
        } else {
          toast.success('Course payment rejected');
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing transfer:`, error);
      toast.error(error.data?.message || `Error ${action}ing transfer`);
    } finally {
      setActionLoading(prev => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleCloseModal = () => {
    setSelectedPayment(null);
    setShowPaymentModal(false);
  };

  const handleModalApprove = async (paymentId, adminNotes) => {
    await handleTransferAction(paymentId, 'approve', selectedPayment?.isBillingPayment);
    handleCloseModal();
  };

  const handleModalReject = async (paymentId, adminNotes) => {
    await handleTransferAction(paymentId, 'reject', selectedPayment?.isBillingPayment);
    handleCloseModal();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const methodConfig = {
      stripe: { color: 'bg-purple-100 text-purple-800', label: 'Stripe' },
      paypal: { color: 'bg-blue-100 text-blue-800', label: 'PayPal' },
      direct_transfer: { color: 'bg-green-100 text-green-800', label: 'Bank Transfer' },
      credit_payment: { color: 'bg-orange-100 text-orange-800', label: 'Credit Payment' },
      cash: { color: 'bg-gray-100 text-gray-800', label: 'Cash' }
    };

    const config = methodConfig[method] || { color: 'bg-gray-100 text-gray-800', label: method || 'Unknown' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredPayments = recentPayments.filter(payment => {
    const matchesSearch = searchTerm === '' || 
      payment.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || payment.status === filters.status;
    const matchesMethod = filters.method === 'all' || payment.method === filters.method;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="mr-3" />
            Payments Reports and Analytics
          </h1>
          <p className="text-gray-600 mt-2">Comprehensive payment oversight, analytics, and financial reporting</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              refetchCourseTransfers();
              refetchBillingTransfers();
              refetchStats();
            }}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </button>
          
          <button
            onClick={async () => {
              try {
                console.log('🔄 Starting commission fix...');
                
                const token = localStorage.getItem('token');
                console.log('Token exists:', !!token);
                
                const response = await fetch('/api/payments/admin/fix-commissions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                console.log('Response status:', response.status);
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Fix result:', result);
                  toast.success(`Commission fix completed! Processed: ${result.data.processed}, Skipped: ${result.data.skipped}, Errors: ${result.data.errors}`);
                  // Refresh data after fix
                  refetchCourseTransfers();
                  refetchBillingTransfers();
                  refetchStats();
                } else {
                  const errorText = await response.text();
                  console.error('Error response:', errorText);
                  toast.error(`Error fixing commissions: ${response.status} - ${errorText}`);
                }
              } catch (error) {
                console.error('Error:', error);
                toast.error(`Error fixing commissions: ${error.message}`);
              }
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Fix Instructor Commissions
          </button>
        </div>
      </div>

      {/* Payment Workflow Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-semibold">ℹ️</span>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Payment Approval Workflows</h3>
            <div className="mt-2 text-sm text-blue-700">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">📚 Course Payments:</p>
                  <p>When approved, students are automatically enrolled in the course and billing records are created for instructor commissions.</p>
                </div>
                <div>
                  <p className="font-medium">💳 Billing Payments:</p>
                  <p>When approved, the payment amount is deducted from user's available credits and outstanding balance is reduced.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportsData?.data?.overview?.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600">↗ {reportsData?.data?.overview?.profitMargin?.toFixed(1)}% profit margin</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admin Profit</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportsData?.data?.overview?.totalAdminProfit)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-4">
                <span className="text-sm text-blue-600">{reportsData?.data?.settings?.paymentSettings?.globalDeductionPercentage || reportsData?.data?.settings?.globalDeductionPercentage || 0}% deduction rate</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Instructor Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportsData?.data?.overview?.totalInstructorEarnings)}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-4">
                <span className="text-sm text-purple-600">Paid to instructors</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{reportsData?.data?.overview?.totalPayments}</p>
                </div>
                <CreditCard className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-4">
                <span className="text-sm text-orange-600">Avg: {formatCurrency(reportsData?.data?.overview?.averagePayment)}</span>
              </div>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              Monthly Revenue Trend (Last 12 Months)
            </h3>
            <div className="space-y-4">
              {reportsData?.data?.analytics?.monthlyData?.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{month.month}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-green-600 font-semibold">{formatCurrency(month.revenue)}</span>
                    <span className="text-blue-600 text-sm">({month.count} payments)</span>
                    <span className="text-purple-600 text-sm">Profit: {formatCurrency(month.profit)}</span>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No monthly data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods Performance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(reportsData?.data?.analytics?.paymentMethodStats || {}).map(([method, stats]) => (
                <div key={method} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700 flex items-center">
                      <span className="mr-2">{getMethodIcon(method)}</span>
                      {method.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">{stats.count} payments</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
                </div>
              ))}
              {(!reportsData?.data?.analytics?.paymentMethodStats || Object.keys(reportsData?.data?.analytics?.paymentMethodStats).length === 0) && (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No payment method data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      )}

      {activeTab === 'course-payments' && (
        <div className="space-y-6">
          {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${safePaymentStats.totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admin Fees</p>
              <p className="text-2xl font-bold text-gray-900">
                ${safePaymentStats.totalAdminFees.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{safePaymentStats.totalPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Instructor Payments</p>
              <p className="text-2xl font-bold text-gray-900">
                ${safePaymentStats.totalInstructorPayments.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Direct Transfers */}
      {allPendingTransfers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-yellow-600" />
            Pending Direct Transfers ({allPendingTransfers.length})
          </h2>
          <div className="space-y-4">
            {allPendingTransfers.map((payment) => (
              <div key={payment._id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{payment.userId?.name || payment.student?.name || 'Unknown User'}</p>
                        {payment.isBillingPayment && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Billing Payment
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {payment.isBillingPayment 
                          ? 'Account Top-up Payment' 
                          : payment.course?.title || 'Course Not Found'
                        }
                      </p>
                      {payment.receiptInfo && (
                        <p className="text-xs text-gray-500 mt-1">
                          Ref: {payment.receiptInfo.transferReference}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(payment.finalAmount || payment.amount || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleViewPayment(payment)}
                    className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleTransferAction(payment._id, 'reject', payment.isBillingPayment)}
                    disabled={actionLoading[payment._id]}
                    className="flex items-center px-3 py-1 text-sm border border-red-300 rounded text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleTransferAction(payment._id, 'approve', payment.isBillingPayment)}
                    disabled={actionLoading[payment._id]}
                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Payment History</h2>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={filters.method}
              onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Methods</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="direct_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Payment Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.userId?.name || payment.student?.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.userId?.email || payment.student?.email || 'No email available'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.course?.title || 'Course Not Found'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${(payment.finalAmount || payment.amount || 0).toFixed(2)}
                    </div>
                    {(payment.adminFee || 0) > 0 && (
                      <div className="text-xs text-gray-500">
                        Admin fee: ${(payment.adminFee || 0).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getMethodBadge(payment.method)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewPayment(payment)}
                      className="flex items-center px-2 py-1 text-sm border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No payments found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {safePaymentStats.paymentMethodStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Method Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {safePaymentStats.paymentMethodStats.map((stat) => (
              <div key={stat._id || 'unknown'} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  {getMethodBadge(stat._id)}
                  <span className="text-sm font-medium">{stat.count || 0} payments</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  ${(stat.revenue || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

          {/* Payment Details Modal */}
          <PaymentDetailsModal
            isOpen={showPaymentModal}
            onClose={handleCloseModal}
            payment={selectedPayment}
            onApprove={handleModalApprove}
            onReject={handleModalReject}
            loading={actionLoading[selectedPayment?._id]}
          />
        </div>
      )}

      {/* Admin Fee Payments Tab - REMOVED (Old System) */}

      {/* All Payments Tab */}
      {activeTab === 'all-payments' && (
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">All Payment Transactions</h3>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex items-center hover:bg-gray-50">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </button>
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportsData?.data?.payments?.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {payment._id?.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.student?.name || payment.userId?.firstName + ' ' + payment.userId?.lastName}</div>
                      <div className="text-sm text-gray-500">{payment.student?.email || payment.userId?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.course?.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</div>
                      {payment.originalAmount !== payment.amount && (
                        <div className="text-xs text-gray-500">Original: {formatCurrency(payment.originalAmount)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">{formatCurrency(payment.adminFee)}</div>
                      <div className="text-xs text-gray-500">{payment.adminPercentage}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{formatCurrency(payment.instructorAmount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center text-sm text-gray-900">
                        <span className="mr-2">{getMethodIcon(payment.method)}</span>
                        {payment.method?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewPayment(payment)}
                        className="flex items-center px-2 py-1 text-sm border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) || []}
              </tbody>
            </table>
            
            {(!reportsData?.data?.payments || reportsData?.data?.payments?.length === 0) && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                <p className="mt-1 text-sm text-gray-500">Payment history will appear here once transactions are processed.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              Monthly Revenue Trend (Last 12 Months)
            </h3>
            <div className="space-y-4">
              {reportsData?.data?.analytics?.monthlyData?.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{month.month}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-green-600 font-semibold">{formatCurrency(month.revenue)}</span>
                    <span className="text-blue-600 text-sm">({month.count} payments)</span>
                    <span className="text-purple-600 text-sm">Profit: {formatCurrency(month.profit)}</span>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No monthly data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods Performance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(reportsData?.data?.analytics?.paymentMethodStats || {}).map(([method, stats]) => (
                <div key={method} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700 flex items-center">
                      <span className="mr-2">{getMethodIcon(method)}</span>
                      {method.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">{stats.count} payments</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
                </div>
              ))}
              {(!reportsData?.data?.analytics?.paymentMethodStats || Object.keys(reportsData?.data?.analytics?.paymentMethodStats).length === 0) && (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No payment method data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue vs Profit Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                Revenue Trends
              </h4>
              {reportsData?.data?.analytics?.trends ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="text-sm font-medium text-green-700">
                      {formatCurrency(reportsData.data.analytics.trends.thisMonth)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm text-gray-600">Last Month</span>
                    <span className="text-sm font-medium text-blue-700">
                      {formatCurrency(reportsData.data.analytics.trends.lastMonth)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <span className="text-sm text-gray-600">Growth Rate</span>
                    <span className="text-sm font-medium text-purple-700">
                      {reportsData.data.analytics.trends.growthRate || '0%'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm">No trend data available</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <PieChart className="w-4 h-4 mr-2 text-blue-500" />
                Profit Analysis
              </h4>
              {reportsData?.data?.overview ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm text-gray-600">Total Admin Profit</span>
                    <span className="text-sm font-medium text-green-700">
                      {formatCurrency(reportsData.data.overview.totalAdminProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm text-gray-600">Instructor Earnings</span>
                    <span className="text-sm font-medium text-blue-700">
                      {formatCurrency(reportsData.data.overview.totalInstructorEarnings)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <span className="text-sm text-gray-600">Profit Margin</span>
                    <span className="text-sm font-medium text-purple-700">
                      {reportsData.data.overview.profitMargin?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <PieChart className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm">No profit data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
