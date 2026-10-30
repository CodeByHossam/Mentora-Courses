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
import AdminPaymentsView from "./AdminPaymentsView";

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

  // Log any errors
  if (statsError) {
    toast.error('Failed to load payment statistics');
  }
  if (courseTransfersError) {
    toast.error('Failed to load course transfers');
  }
  if (billingTransfersError) {
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

  return <AdminPaymentsView />;
};

export default AdminPayments;
