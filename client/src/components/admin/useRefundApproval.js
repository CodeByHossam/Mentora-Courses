import { useState } from 'react';
import {
  useGetPendingRefundsQuery,
  useGetAllRefundsQuery,
  useApproveRefundMutation,
  useRejectRefundMutation,
  useGetRefundStatsQuery
} from '../../store/services/refundApi';
import { toast } from 'react-toastify';

export const useRefundApproval = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [filters, setFilters] = useState({ refundType: '', requesterType: '', startDate: '', endDate: '' });

  const { data: pendingRefunds, isLoading: isLoadingPending, refetch: refetchPending } = useGetPendingRefundsQuery();
  const { data: allRefunds, isLoading: isLoadingAll, refetch: refetchAll } = useGetAllRefundsQuery(filters);
  const { data: refundStats } = useGetRefundStatsQuery();
  const [approveRefund, { isLoading: isApproving }] = useApproveRefundMutation();
  const [rejectRefund, { isLoading: isRejecting }] = useRejectRefundMutation();

  const handleApprovalAction = (refund, action) => {
    setSelectedRefund(refund);
    setApprovalAction(action);
    setAdminNotes('');
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedRefund) return;
    try {
      if (approvalAction === 'approve') {
        await approveRefund({ refundId: selectedRefund._id, adminNotes }).unwrap();
        toast.success('Refund request approved and gift card created successfully');
      } else {
        await rejectRefund({ refundId: selectedRefund._id, adminNotes }).unwrap();
        toast.success('Refund request rejected');
      }
      setShowApprovalModal(false);
      setSelectedRefund(null);
      setApprovalAction(null);
      setAdminNotes('');
    } catch (error) {
      toast.error(error?.data?.message || `Failed to ${approvalAction} refund request`);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return null;
      case 'approved': return null;
      case 'rejected': return null;
      case 'processing': return null;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequesterIcon = (requesterType) =>
    requesterType === 'student' ? null : null;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return {
    activeTab, setActiveTab,
    selectedRefund, setSelectedRefund,
    showApprovalModal, setShowApprovalModal,
    approvalAction, setApprovalAction,
    adminNotes, setAdminNotes,
    receiptFile, setReceiptFile,
    filters, setFilters,
    pendingRefunds, isLoadingPending, refetchPending,
    allRefunds, isLoadingAll, refetchAll,
    refundStats,
    approveRefund, isApproving,
    rejectRefund, isRejecting,
    handleApprovalAction, handleSubmitApproval, handleFilterChange,
    getStatusColor, formatCurrency, formatDate,
  };
};
export default useRefundApproval;
