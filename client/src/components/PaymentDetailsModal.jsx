/**
 * Payment Details Modal Component
 * 
 * Displays detailed information about a payment including:
 * - Payment information (amount, method, status)
 * - User and course details
 * - Receipt information for direct transfers
 * - Admin approval actions
 * 
 * @author Mentora Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { 
  X, 
  User, 
  CreditCard, 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  DollarSign,
  Book,
  Clock
} from 'lucide-react';
import Button from './Button';

const PaymentDetailsModal = ({ 
  isOpen, 
  onClose, 
  payment, 
  onApprove, 
  onReject, 
  loading = false 
}) => {
  const [adminNotes, setAdminNotes] = useState('');

  if (!isOpen || !payment) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      pending_verification: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      pending_admin_approval: { color: 'bg-orange-100 text-orange-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const methodConfig = {
      stripe: { color: 'bg-purple-100 text-purple-800', label: 'Stripe' },
      paypal: { color: 'bg-blue-100 text-blue-800', label: 'PayPal' },
      direct_transfer: { color: 'bg-green-100 text-green-800', label: 'Bank Transfer' },
      direct: { color: 'bg-green-100 text-green-800', label: 'Bank Transfer' }
    };

    const config = methodConfig[method] || { color: 'bg-gray-100 text-gray-800', label: method };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <CreditCard className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

  const handleAction = (action) => {
    if (action === 'approve') {
      onApprove(payment._id, adminNotes);
    } else {
      onReject(payment._id, adminNotes);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              {payment.isBillingPayment ? 'Billing Account Payment' : 'Course Enrollment Payment'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${(payment.finalAmount || payment.amount || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">{formatDate(payment.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Status</p>
                {getStatusBadge(payment.status)}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Payment Method</p>
                {getMethodBadge(payment.method)}
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              User Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{payment.userId?.name || payment.student?.name || 'Unknown User'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{payment.userId?.email || payment.student?.email || 'No email available'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-medium capitalize">{payment.userId?.role || payment.student?.role || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Course Information (for course payments) */}
          {!payment.isBillingPayment && payment.course && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Book className="w-5 h-5 mr-2" />
                Course Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Course Title</p>
                    <p className="font-medium">{payment.course?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Instructor</p>
                    <p className="font-medium">{payment.course?.instructor?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Receipt Information (for direct transfers) */}
          {payment.receiptInfo && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Receipt Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {payment.receiptInfo.transferReference && (
                  <div>
                    <p className="text-sm text-gray-600">Transfer Reference</p>
                    <p className="font-medium">{payment.receiptInfo.transferReference}</p>
                  </div>
                )}
                
                {payment.receiptInfo.transferDate && (
                  <div>
                    <p className="text-sm text-gray-600">Transfer Date</p>
                    <p className="font-medium">{formatDate(payment.receiptInfo.transferDate)}</p>
                  </div>
                )}

                {payment.receiptInfo.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-medium">{payment.receiptInfo.notes}</p>
                  </div>
                )}

                {(payment.receiptUrl || payment.receiptInfo.receiptUrl) && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Receipt</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(payment.receiptUrl || payment.receiptInfo.receiptUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Receipt
                    </Button>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Submitted</p>
                  <p className="font-medium">{formatDate(payment.receiptInfo.submittedAt)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {(payment.status === 'pending_admin_approval' || payment.status === 'pending_verification') && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Admin Actions</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any notes about this payment approval/rejection..."
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => handleAction('reject')}
                    loading={loading}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Payment
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleAction('approve')}
                    loading={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Payment
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Admin Approval History */}
          {payment.adminApproval && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Approval History</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  {payment.adminApproval.approvedBy && (
                    <>
                      <p className="text-sm">
                        <span className="font-medium text-green-600">Approved</span> on{' '}
                        {formatDate(payment.adminApproval.approvedAt)}
                      </p>
                      {payment.adminApproval.adminNotes && (
                        <p className="text-sm text-gray-600">
                          Notes: {payment.adminApproval.adminNotes}
                        </p>
                      )}
                    </>
                  )}
                  
                  {payment.adminApproval.rejectedBy && (
                    <>
                      <p className="text-sm">
                        <span className="font-medium text-red-600">Rejected</span> on{' '}
                        {formatDate(payment.adminApproval.rejectedAt)}
                      </p>
                      {payment.adminApproval.adminNotes && (
                        <p className="text-sm text-gray-600">
                          Notes: {payment.adminApproval.adminNotes}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
