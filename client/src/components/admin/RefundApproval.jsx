import React, { useState } from 'react';
import { 
  useGetPendingRefundsQuery,
  useGetAllRefundsQuery,
  useApproveRefundMutation,
  useRejectRefundMutation,
  useGetRefundStatsQuery
} from '../../store/services/refundApi';
import { toast } from 'react-toastify';
import { 
  DollarSign, 
  FileText, 
  CheckCircle,
  XCircle,
  Clock,
  RotateCw,
  Filter,
  BarChart3,
  User,
  GraduationCap,
  AlertTriangle,
  Gift,
  Camera
} from 'lucide-react';

const RefundApproval = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [filters, setFilters] = useState({
    refundType: '',
    requesterType: '',
    startDate: '',
    endDate: ''
  });

  // API hooks
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
        await approveRefund({ 
          refundId: selectedRefund._id, 
          adminNotes 
        }).unwrap();
        toast.success('Refund request approved and gift card created successfully');
      } else {
        await rejectRefund({ 
          refundId: selectedRefund._id, 
          adminNotes 
        }).unwrap();
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
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <RotateCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequesterIcon = (requesterType) => {
    return requesterType === 'student' ? 
      <User className="h-5 w-5 text-blue-500" /> : 
      <GraduationCap className="h-5 w-5 text-purple-500" />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const RefundCard = ({ refund, showActions = false }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          {getRequesterIcon(refund.requesterType)}
          <div className="ml-3">
            <h4 className="font-medium text-gray-900">
              {refund.requesterType === 'student' ? 'Student' : 'Instructor'} Refund Request
            </h4>
            <p className="text-sm text-gray-600">
              {refund.requesterName || `${refund.requesterType} ID: ${refund.requesterId}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          {getStatusIcon(refund.status)}
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(refund.status)}`}>
            {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="font-medium text-gray-700">Refund Type:</span>
          <p className="text-gray-600">{refund.refundType.replace(/_/g, ' ')}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Requested Amount:</span>
          <p className="text-gray-900 font-semibold">{formatCurrency(refund.requestedAmount)}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Original Amount:</span>
          <p className="text-gray-600">{formatCurrency(refund.originalAmount)}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Submitted:</span>
          <p className="text-gray-600">{formatDate(refund.createdAt)}</p>
        </div>
      </div>

      <div className="mb-4">
        <span className="font-medium text-gray-700">Reason:</span>
        <p className="text-gray-600 mt-1">{refund.reason.replace(/_/g, ' ')}</p>
      </div>

      {refund.description && (
        <div className="mb-4">
          <span className="font-medium text-gray-700">Description:</span>
          <p className="text-gray-600 mt-1">{refund.description}</p>
        </div>
      )}

      {refund.relatedCourse && (
        <div className="mb-4">
          <span className="font-medium text-gray-700">Related Course:</span>
          <p className="text-gray-600 mt-1">{refund.relatedCourse.title || refund.relatedCourse}</p>
        </div>
      )}

      {refund.adminNotes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <span className="font-medium text-gray-700">Admin Notes:</span>
          <p className="text-gray-600 mt-1">{refund.adminNotes}</p>
        </div>
      )}

      {showActions && refund.status === 'pending' && (
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => handleApprovalAction(refund, 'approve')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </button>
          <button
            onClick={() => handleApprovalAction(refund, 'reject')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              Refund Management
            </h2>
            <p className="text-gray-600 mt-1">
              Review and approve refund requests from students and instructors
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {refundStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{refundStats.pending || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{refundStats.approved || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{refundStats.rejected || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Refunded</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(refundStats.totalRefunded || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Requests
              {pendingRefunds?.refunds?.length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                  {pendingRefunds.refunds.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Requests
            </button>
          </nav>
        </div>

        {/* Filters for All Requests */}
        {activeTab === 'all' && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center mb-4">
              <Filter className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Type
                </label>
                <select
                  name="refundType"
                  value={filters.refundType}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="course_purchase">Course Purchase</option>
                  <option value="admin_fee_overpayment">Admin Fee Overpayment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requester Type
                </label>
                <select
                  name="requesterType"
                  value={filters.requesterType}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Users</option>
                  <option value="student">Students</option>
                  <option value="instructor">Instructors</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {activeTab === 'pending' && (
            <>
              {isLoadingPending ? (
                <div className="text-center py-8">
                  <RotateCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Loading pending requests...</p>
                </div>
              ) : pendingRefunds?.refunds?.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pendingRefunds.refunds.map((refund) => (
                    <RefundCard key={refund._id} refund={refund} showActions={true} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-600">No pending refund requests</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'all' && (
            <>
              {isLoadingAll ? (
                <div className="text-center py-8">
                  <RotateCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Loading all requests...</p>
                </div>
              ) : allRefunds?.refunds?.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {allRefunds.refunds.map((refund) => (
                    <RefundCard key={refund._id} refund={refund} showActions={refund.status === 'pending'} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No refund requests found</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Refund Request
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Amount:</span> {formatCurrency(selectedRefund.requestedAmount)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Requester:</span> {selectedRefund.requesterType}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Type:</span> {selectedRefund.refundType.replace(/_/g, ' ')}
                </p>
              </div>

              {approvalAction === 'approve' && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <Gift className="h-6 w-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-green-900 mb-1">
                        Gift Card Refund
                      </h4>
                      <p className="text-sm text-green-800">
                        This refund will be processed as a gift card valid for 1 year. 
                        The gift card will be automatically added to the user's account balance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes {approvalAction === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Provide notes for this ${approvalAction}...`}
                />
              </div>


              {approvalAction === 'reject' && !adminNotes.trim() && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-sm text-red-700">
                      Admin notes are required when rejecting a refund request.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitApproval}
                  disabled={
                    (isApproving || isRejecting) || 
                    (approvalAction === 'reject' && !adminNotes.trim())
                  }
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center justify-center ${
                    approvalAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                  }`}
                >
                  {(isApproving || isRejecting) ? (
                    <>
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `${approvalAction === 'approve' ? 'Approve' : 'Reject'} Refund`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundApproval;
