/**
 * Admin Bulk Delete Page
 * 
 * Provides secure bulk deletion interface for administrators
 * with proper confirmation modals and financial data protection.
 */

import React, { useState } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  Shield, 
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  MessageCircle,
  FileText,
  Bell,
  Mail,
} from 'lucide-react';
import { 
  useGetDeletionStatisticsQuery,
  useBulkDeleteCommentsMutation,
  useBulkDeleteTestsMutation,
  useBulkDeleteNotificationsMutation,
  useBulkDeleteMessagesMutation,
  useBulkDeleteLiveSessionsMutation,
  useBulkDeleteCertificatesMutation,
  useBulkDeleteEnrollmentRequestsMutation,
  useBulkDeletePaymentsMutation,
  useBulkDeleteBillingTransactionsMutation,
  useBulkDeleteGiftCardsMutation,
  useBulkDeleteAdminFeePaymentsMutation,
  useBulkDeleteAllNonCriticalMutation,
} from '../store/services/adminBulkDeleteApi';

const AdminBulkDelete = () => {
  // Redux API hooks
  const { 
    data: statistics, 
    isLoading: loading, 
    error, 
    refetch: fetchStatistics 
  } = useGetDeletionStatisticsQuery();

  // Mutation hooks
  const [bulkDeleteComments] = useBulkDeleteCommentsMutation();
  const [bulkDeleteTests] = useBulkDeleteTestsMutation();
  const [bulkDeleteNotifications] = useBulkDeleteNotificationsMutation();
  const [bulkDeleteMessages] = useBulkDeleteMessagesMutation();
  const [bulkDeleteLiveSessions] = useBulkDeleteLiveSessionsMutation();
  const [bulkDeleteCertificates] = useBulkDeleteCertificatesMutation();
  const [bulkDeleteEnrollmentRequests] = useBulkDeleteEnrollmentRequestsMutation();
  const [bulkDeletePayments] = useBulkDeletePaymentsMutation();
  const [bulkDeleteBillingTransactions] = useBulkDeleteBillingTransactionsMutation();
  const [bulkDeleteGiftCards] = useBulkDeleteGiftCardsMutation();
  const [bulkDeleteAdminFeePayments] = useBulkDeleteAdminFeePaymentsMutation();
  const [bulkDeleteAllNonCritical] = useBulkDeleteAllNonCriticalMutation();

  const [operationLoading, setOperationLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle deletion operation
  const handleDelete = async (operation) => {
    try {
      setOperationLoading(true);
      
      const result = await operation.mutation({
        confirmPassword,
        ...operation.extraData 
      });

      console.log('🔍 DELETION RESULT:', result);
      console.log('🔍 RESULT.DATA:', result.data);

      if (result.error) {
        console.log('❌ DELETION ERROR:', result.error);
        throw new Error(result.error.data?.message || 'Deletion failed');
      }

      // Success - show success message in modal
      setShowSuccessModal(true);
      const deletedCount = result.data?.deletedCount || result.data?.data?.deletedCount || 'unknown';
      console.log('✅ DELETED COUNT:', deletedCount);
      setSuccessMessage(`${operation.name} completed successfully! Deleted: ${deletedCount} records`);
      
      // Refresh statistics
      fetchStatistics();
      
    } catch (err) {
      console.error('❌ Deletion error:', err);
      setShowErrorModal(true);
      setErrorMessage(err.message || 'Deletion failed');
    } finally {
      setOperationLoading(false);
      setShowConfirmModal(false);
      setCurrentOperation(null);
      setConfirmPassword('');
    }
  };

  // Confirm deletion
  const confirmDelete = (operation) => {
    setCurrentOperation(operation);
    setShowConfirmModal(true);
  };

  // Safe deletion operations
  const safeOperations = [
    {
      name: 'Comments',
      description: 'Delete all user comments and replies',
      icon: MessageCircle,
      color: 'blue',
      count: statistics?.safeModels?.comments || 0,
      mutation: bulkDeleteComments,
      confirmText: 'DELETE_ALL_COMMENTS',
    },
    {
      name: 'Tests & Grades',
      description: 'Delete all tests and associated grades',
      icon: FileText,
      color: 'green',
      count: statistics?.safeModels?.tests || 0,
      mutation: bulkDeleteTests,
      confirmText: 'DELETE_ALL_TESTS',
    },
    {
      name: 'Notifications',
      description: 'Delete all system notifications',
      icon: Bell,
      color: 'yellow',
      count: statistics?.safeModels?.notifications || 0,
      mutation: bulkDeleteNotifications,
      confirmText: 'DELETE_ALL_NOTIFICATIONS',
    },
    {
      name: 'Messages',
      description: 'Delete all user messages',
      icon: Mail,
      color: 'purple',
      count: statistics?.safeModels?.messages || 0,
      mutation: bulkDeleteMessages,
      confirmText: 'DELETE_ALL_MESSAGES',
    },
    {
      name: 'Live Sessions',
      description: 'Delete completed live sessions',
      icon: Database,
      color: 'indigo',
      count: statistics?.safeModels?.liveSessions || 0,
      mutation: bulkDeleteLiveSessions,
      confirmText: 'DELETE_LIVE_SESSIONS',
    },
    {
      name: 'Certificates',
      description: 'Delete all certificates',
      icon: Shield,
      color: 'pink',
      count: statistics?.safeModels?.certificates || 0,
      mutation: bulkDeleteCertificates,
      confirmText: 'DELETE_ALL_CERTIFICATES',
    },
    {
      name: 'Enrollment Requests',
      description: 'Delete processed enrollment requests',
      icon: Database,
      color: 'teal',
      count: statistics?.safeModels?.enrollmentRequests || 0,
      mutation: bulkDeleteEnrollmentRequests,
      confirmText: 'DELETE_ENROLLMENT_REQUESTS',
    },
  ];

  // Sensitive operations
  const sensitiveOperations = [
    {
      name: 'Payment Records',
      description: 'Delete all payment history (SENSITIVE)',
      icon: AlertTriangle,
      color: 'red',
      count: statistics?.sensitiveModels?.payments || 0,
      mutation: bulkDeletePayments,
      confirmText: 'DELETE_ALL_PAYMENTS_HISTORY',
    },
    {
      name: 'Billing Transactions',
      description: 'Delete all billing transactions (SENSITIVE)',
      icon: AlertTriangle,
      color: 'red',
      count: statistics?.sensitiveModels?.billingTransactions || 0,
      mutation: bulkDeleteBillingTransactions,
      confirmText: 'DELETE_ALL_BILLING_TRANSACTIONS',
    },
    {
      name: 'Gift Cards',
      description: 'Delete all gift card records (SENSITIVE)',
      icon: AlertTriangle,
      color: 'red',
      count: statistics?.sensitiveModels?.giftCards || 0,
      mutation: bulkDeleteGiftCards,
      confirmText: 'DELETE_ALL_GIFT_CARDS',
    },
    {
      name: 'Admin Fee Payments',
      description: 'Delete admin fee payment records (SENSITIVE)',
      icon: AlertTriangle,
      color: 'red',
      count: statistics?.sensitiveModels?.adminFeePayments || 0,
      mutation: bulkDeleteAdminFeePayments,
      confirmText: 'DELETE_ALL_ADMIN_FEE_PAYMENTS',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-error mx-auto mb-4" />
            <p className="text-secondary">Loading deletion statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <XCircle className="w-12 h-12 text-error mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">Error Loading Data</h2>
            <p className="text-secondary mb-4">{error?.data?.message || error?.message || 'Failed to load deletion statistics'}</p>
            <button
              onClick={() => fetchStatistics()}
              className="btn-error px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trash2 className="w-8 h-8" style={{color: 'var(--error)'}} />
            <h1 className="text-3xl font-bold" style={{color: 'var(--text-primary)'}}>Admin Bulk Delete</h1>
          </div>
          <p className="max-w-2xl mx-auto" style={{color: 'var(--text-secondary)'}}>
            🚨 Dangerous operations ahead! This interface allows bulk deletion of database records. 
            Use with extreme caution and always backup your data first.
          </p>
        </div>

        {/* Statistics Summary */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card rounded-xl shadow-lg p-6 border-l-4" style={{borderLeftColor: 'var(--success)'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{color: 'var(--text-muted)'}}>Safe to Delete</p>
                  <p className="text-2xl font-bold" style={{color: 'var(--success)'}}>
                    {Object.values(statistics.safeModels || {}).reduce((sum, count) => sum + count, 0)}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8" style={{color: 'var(--success)'}} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">With Relationships</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {Object.values(statistics.relationshipModels || {}).reduce((sum, count) => sum + count, 0)}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sensitive Data</p>
                  <p className="text-2xl font-bold text-red-600">
                    {Object.values(statistics.sensitiveModels || {}).reduce((sum, count) => sum + count, 0)}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Protected</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Object.values(statistics.protectedModels || {}).reduce((sum, count) => sum + count, 0)}
                  </p>
                </div>
                <Database className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Safe Operations */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Safe Deletion Operations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeOperations.map((operation) => (
              <div key={operation.name} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <operation.icon className={`w-8 h-8 text-${operation.color}-600`} />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${operation.color}-100 text-${operation.color}-800`}>
                    {operation.count} records
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{operation.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{operation.description}</p>
                <button
                  onClick={() => confirmDelete(operation)}
                  disabled={operation.count === 0 || operationLoading}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    operation.count === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {operationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    `Delete ${operation.name}`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sensitive Operations */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Sensitive Operations (Financial Data)
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">⚠️ Warning: Financial Data</h3>
                <p className="text-red-700 text-sm">
                  These operations delete financial records. This may affect billing, payments, and financial reporting. 
                  Ensure you have proper backups and legal compliance before proceeding.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sensitiveOperations.map((operation) => (
              <div key={operation.name} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-red-200">
                <div className="flex items-start justify-between mb-4">
                  <operation.icon className="w-8 h-8 text-red-600" />
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    {operation.count} records
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{operation.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{operation.description}</p>
                <button
                  onClick={() => confirmDelete(operation)}
                  disabled={operation.count === 0 || operationLoading}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    operation.count === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {operationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    `Delete ${operation.name}`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Nuclear Option */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-xl shadow-lg p-8 text-white">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">☢️ Nuclear Option</h2>
              <p className="text-red-100 mb-6 max-w-2xl mx-auto">
                Delete ALL non-critical data in one operation. This includes comments, tests, notifications, 
                messages, and other safe-to-delete records. Financial and user data will be preserved.
              </p>
              <button
                onClick={() => confirmDelete({
                  name: 'Nuclear Deletion',
                  description: 'Delete all non-critical data',
                  mutation: bulkDeleteAllNonCritical,
                  confirmText: 'DELETE_ALL_NON_CRITICAL_DATA',
                  extraData: { nuclear: true }
                })}
                disabled={operationLoading}
                className="bg-white text-red-600 px-8 py-3 rounded-lg font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {operationLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  '☢️ NUCLEAR DELETE'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={() => fetchStatistics()}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Statistics
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && currentOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-gray-600">
                You are about to delete <strong>{currentOperation.name}</strong>. 
                This action cannot be undone.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type the following text to confirm deletion:
              </label>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <code className="text-red-800 font-mono text-sm font-bold">
                  {currentOperation.confirmText}
                </code>
              </div>
              <input
                type="text"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                placeholder={currentOperation.confirmText}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setCurrentOperation(null);
                  setConfirmPassword('');
                }}
                disabled={operationLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(currentOperation)}
                disabled={confirmPassword !== currentOperation.confirmText || operationLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {operationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBulkDelete;
