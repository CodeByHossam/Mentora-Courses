import React, { useState, useEffect } from 'react';
import { 
  useCreateInstructorRefundMutation, 
  useGetInstructorRefundsQuery,
  useGetRefundStatsQuery 
} from '../../store/services/refundApi';
import { useGetBillingAccountQuery } from '../../store/services/billingApi';
import { toast } from 'react-toastify';
import { 
  DollarSign, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RotateCw,
  Info,
  Gift
} from 'lucide-react';

const InstructorRefundRequest = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    refundType: 'financial_issue',
    reason: '',
    description: '',
    requestedAmount: ''
  });

  // API hooks
  const [createRefund, { isLoading: isCreating }] = useCreateInstructorRefundMutation();
  const { data: refunds, isLoading: isLoadingRefunds, refetch: refetchRefunds } = useGetInstructorRefundsQuery();
  const { data: refundStats } = useGetRefundStatsQuery({ period: '30d' });
  const { data: billingData } = useGetBillingAccountQuery();

  // Extract billing account data
  const instructorAccount = billingData?.data;
  const owedAdminFees = instructorAccount?.owedAdminFees || 0;
  const totalAdminFeesPaid = instructorAccount?.totalAdminFeesPaid || 0;
  const maxRefundable = Math.max(0, totalAdminFeesPaid - owedAdminFees);

  useEffect(() => {
    // Auto-set the maximum refundable amount
    if (maxRefundable > 0 && !formData.requestedAmount) {
      setFormData(prev => ({
        ...prev,
        requestedAmount: maxRefundable.toFixed(2)
      }));
    }
  }, [maxRefundable]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason || !formData.requestedAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const requestedAmount = parseFloat(formData.requestedAmount);
    if (requestedAmount <= 0) {
      toast.error('Refund amount must be greater than zero');
      return;
    }

    try {
      const refundData = {
        refundType: formData.refundType,
        reason: formData.reason,
        description: formData.description,
        requestedAmount: requestedAmount
      };

      await createRefund(refundData).unwrap();
      
      toast.success('Financial refund request submitted successfully');
      setShowForm(false);
      setFormData({
        refundType: 'financial_issue',
        reason: '',
        description: '',
        requestedAmount: ''
      });
      refetchRefunds();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to submit refund request');
    }
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

  // Check if there are any pending refund requests
  const hasPendingRefund = refunds?.refunds?.some(r => r.status === 'pending') || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
              Financial Refund Requests
            </h2>
            <p className="text-gray-600 mt-1">
              Request refunds for any financial issues or overpayments
            </p>
          </div>
          
          {!hasPendingRefund && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {showForm ? 'Cancel' : 'Request Refund'}
            </button>
          )}
        </div>
      </div>

      {/* Refund Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Info className="h-6 w-6 text-blue-600 mr-2" />
          Refund Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Pending Requests</div>
            <div className="text-2xl font-bold text-yellow-900">
              {refunds?.refunds?.filter(r => r.status === 'pending').length || 0}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Approved Requests</div>
            <div className="text-2xl font-bold text-green-900">
              {refunds?.refunds?.filter(r => r.status === 'approved').length || 0}
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Rejected Requests</div>
            <div className="text-2xl font-bold text-red-900">
              {refunds?.refunds?.filter(r => r.status === 'rejected').length || 0}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Approved Amount</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(
                refunds?.refunds
                  ?.filter(r => r.status === 'approved')
                  ?.reduce((sum, r) => sum + (r.requestedAmount || 0), 0) || 0
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-blue-800 font-medium">Refund Information</p>
              <p className="text-blue-700 text-sm mt-1">
                You can request refunds for various financial issues including overpayments, billing errors, or other financial discrepancies. 
                All approved refunds are processed as gift cards valid for 1 year.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Request Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Submit Financial Refund Request
          </h3>
          
          {/* Gift Card Notice */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Gift className="h-6 w-6 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-purple-900 mb-1">
                  Refund Processing Information
                </h4>
                <p className="text-sm text-purple-800">
                  All approved refunds will be processed as <strong>gift cards</strong> that can be used for future course purchases or platform services. 
                  Gift cards are valid for 1 year from the issue date and will be added to your account upon approval.
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Refund Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Type *
              </label>
              <select
                name="refundType"
                value={formData.refundType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="financial_issue">Financial Issue</option>
                <option value="admin_fee_overpayment">Admin Fee Overpayment</option>
                <option value="billing_error">Billing Error</option>
                <option value="duplicate_payment">Duplicate Payment</option>
                <option value="service_not_received">Service Not Received</option>
                <option value="other">Other</option>
              </select>
              <p className="text-sm text-gray-600 mt-1">
                Select the type of financial issue you're experiencing.
              </p>
            </div>

            {/* Refund Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="requestedAmount"
                  value={formData.requestedAmount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="0.00"
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Enter the amount you believe should be refunded.
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Refund *
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select a reason...</option>
                <option value="overpaid_admin_fees">Overpaid admin fees</option>
                <option value="duplicate_payment">Duplicate payment</option>
                <option value="incorrect_calculation">Incorrect fee calculation</option>
                <option value="payment_error">Payment processing error</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Please provide additional details about your refund request..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors flex items-center"
              >
                {isCreating ? (
                  <>
                    <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Request Notice */}
      {hasPendingRefund && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <Info className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-blue-800">Pending Request</h3>
              <p className="text-blue-700 mt-1">
                You already have a pending refund request. Please wait for it to be processed before submitting a new one.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Existing Refund Requests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 text-gray-600 mr-2" />
            Your Refund Requests
          </h3>
        </div>

        {isLoadingRefunds ? (
          <div className="p-6 text-center">
            <RotateCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading refund requests...</p>
          </div>
        ) : refunds?.refunds?.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {refunds.refunds.map((refund) => (
              <div key={refund._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getStatusIcon(refund.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(refund.status)}`}>
                        {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1">
                      {refund.refundType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Requested Amount:</span> {formatCurrency(refund.requestedAmount)}
                      </div>
                      <div>
                        <span className="font-medium">Reason:</span> {refund.reason.replace(/_/g, ' ')}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span> {formatDate(refund.createdAt)}
                      </div>
                      {refund.processedAt && (
                        <div>
                          <span className="font-medium">Processed:</span> {formatDate(refund.processedAt)}
                        </div>
                      )}
                    </div>

                    {refund.description && (
                      <p className="text-sm text-gray-700 mb-3">
                        <span className="font-medium">Details:</span> {refund.description}
                      </p>
                    )}

                    {refund.adminNotes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium text-gray-900">Admin Notes:</span>
                          <span className="text-gray-700 ml-2">{refund.adminNotes}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>No refund requests found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorRefundRequest;
