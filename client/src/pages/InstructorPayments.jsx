import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Users, 
  BookOpen, 
  DollarSign, 
  Calendar,
  FileText,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  CreditCard,
  UserCheck
} from "lucide-react";
import { useGetInstructorPendingTransfersQuery, useApproveInstructorTransferMutation } from "../store/services/paymentApi";
import {
  useGetInstructorEnrollmentRequestsQuery,
  useUpdateEnrollmentRequestMutation,
  useDeleteEnrollmentRequestMutation,
  useEditAdminNoteMutation,
  useDeleteAdminNoteMutation,
  useGetReceiptUrlQuery,
} from "../store/services/enrollmentRequestApi";
import ProgressLoader from "../components/ProgressLoader";
import { handleApiError, handleApiSuccess } from "../utils/apiErrorHandler";
import { useCreatePaymentMutation } from "../store/services/paymentApi";
import { useConfirm } from "../hooks/useConfirm";

const InstructorPayments = () => {
  const { confirm, ConfirmationModalWrapper } = useConfirm();
  const { data, isLoading, isError, refetch } = useGetInstructorPendingTransfersQuery();
  const [approveTransfer, { isLoading: isApproving }] = useApproveInstructorTransferMutation();
  

  
  // Enrollment requests state and API
  const { data: requests, isLoading: requestsLoading, error: requestsError } = useGetInstructorEnrollmentRequestsQuery();
  const [updateStatus, { isLoading: updating }] = useUpdateEnrollmentRequestMutation();
  const [deleteRequest] = useDeleteEnrollmentRequestMutation();
  const [editAdminNote] = useEditAdminNoteMutation();
  const [deleteAdminNote] = useDeleteAdminNoteMutation();
  const [createPayment] = useCreatePaymentMutation();

  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [editingNotes, setEditingNotes] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('enrollment-requests');

  const transfers = data?.data || [];

  const handleApprove = async (paymentId) => {
    try {
      await approveTransfer({ paymentId }).unwrap();
      toast.success("Payment approved, student enrolled, and billing recorded!");
      refetch();
    } catch (e) {
      toast.error(e?.data?.message || "Failed to approve payment");
    }
  };


  // Enrollment request handlers
  useEffect(() => {
    if (requestsError) handleApiError(requestsError);
  }, [requestsError]);

  const handleAddNote = async (id) => {
    if (!adminNotes[id]) return handleApiError("Note cannot be empty");

    const request = requests.find((r) => r._id === id);
    if (!request) return handleApiError("Request not found");

    setIsProcessing(true);
    try {
      await updateStatus({
        id,
        status: request.status,
        adminNote: adminNotes[id],
      }).unwrap();

      handleApiSuccess("Note added successfully.");
      setAdminNotes((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecision = async (id, status) => {
    setIsProcessing(true);

    try {
      await updateStatus({
        id,
        status,
        adminNote: adminNotes[id] || "",
      }).unwrap();

      handleApiSuccess(`Request ${status} successfully.`);
      setSelectedRequestId(null);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditNote = async (requestId, noteId) => {
    const noteKey = `${requestId}-${noteId}`;
    const editedContent = editingNotes[noteKey];
    
    if (!editedContent || !editedContent.trim()) {
      return handleApiError("Note content cannot be empty");
    }

    try {
      await editAdminNote({
        id: requestId,
        noteId: noteId,
        note: editedContent.trim()
      }).unwrap();
      
      setEditingNotes(prev => {
        const newState = { ...prev };
        delete newState[noteKey];
        return newState;
      });
      
      handleApiSuccess("Note updated successfully");
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleDeleteNote = async (requestId, noteId) => {
    const confirmed = await confirm({
      title: "Delete this note?",
      message: "This action cannot be undone.",
    });

    if (confirmed) {
      try {
        await deleteAdminNote({
          id: requestId,
          noteId: noteId
        }).unwrap();
        handleApiSuccess("Note deleted successfully");
      } catch (err) {
        handleApiError(err);
      }
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: "Delete this request?",
      message: "This action cannot be undone.",
    });

    if (confirmed) {
      try {
        await deleteRequest(id).unwrap();
        handleApiSuccess("Request deleted.");
      } catch (err) {
        handleApiError(err);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPaymentMethodBadge = (method) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    switch (method) {
      case 'stripe':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'paypal':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'direct_transfer':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'stripe':
        return '💳';
      case 'paypal':
        return '🅿️';
      case 'direct_transfer':
        return '🏦';
      default:
        return '❓';
    }
  };

  const getApprovedByDisplay = (request) => {
    if (!request.approvedBy || !request.approvedBy.role) {
      return request.status === 'approved' ? 'Unknown' : '-';
    }

    const { role, user, approvedAt } = request.approvedBy;
    
    if (role === 'automatic') {
      return (
        <div className="text-sm">
          <div className="font-medium text-blue-600">🤖 Automatic</div>
          <div className="text-gray-500 text-xs">
            {approvedAt ? new Date(approvedAt).toLocaleDateString() : ''}
          </div>
        </div>
      );
    }

    const roleIcon = role === 'admin' ? '👑' : '👨‍🏫';
    const roleName = role === 'admin' ? 'Admin' : 'Instructor';
    
    return (
      <div className="text-sm">
        <div className="font-medium text-gray-900">
          {roleIcon} {user?.name || 'Unknown'} ({roleName})
        </div>
        <div className="text-gray-500 text-xs">
          {approvedAt ? new Date(approvedAt).toLocaleDateString() : ''}
        </div>
      </div>
    );
  };

  // Receipt viewer component
  const ReceiptViewer = ({ requestId, fileName }) => {
    const [showReceipt, setShowReceipt] = useState(false);
    const { data: receiptData, isLoading: receiptLoading, error: receiptError } = useGetReceiptUrlQuery(requestId, {
      skip: !showReceipt
    });

    const handleToggleReceipt = () => {
      setShowReceipt(!showReceipt);
    };

    const handleDownloadReceipt = () => {
      if (receiptData?.url) {
        const link = document.createElement('a');
        link.href = receiptData.url;
        link.download = fileName || 'transfer-receipt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    if (receiptLoading) {
      return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-sm text-gray-600">Loading receipt...</span>
        </div>
      );
    }

    if (receiptError) {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm rounded">
          📄 Receipt unavailable
        </span>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <button
            onClick={handleToggleReceipt}
            className={`inline-flex items-center px-3 py-2 text-white text-sm rounded-lg transition-colors font-medium ${
              showReceipt 
                ? 'bg-gray-600 hover:bg-gray-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {showReceipt ? (
              <>🙈 Hide Document</>
            ) : (
              <>👁️ Show Document</>
            )}
          </button>
          {receiptData?.url && (
            <>
              <button
                onClick={handleDownloadReceipt}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                💾 Download Receipt
              </button>
              <a
                href={receiptData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                🔗 Open in New Tab
              </a>
            </>
          )}
        </div>
        
        {/* Document Preview */}
        {receiptData?.url && showReceipt && (
          <div className="mt-4 border rounded-lg overflow-hidden bg-gray-50">
            <div className="bg-gray-100 px-4 py-2 border-b">
              <h4 className="text-sm font-medium text-gray-700">📄 Document Preview</h4>
            </div>
            <div className="p-4">
              <iframe
                src={receiptData.url}
                className="w-full h-64 sm:h-80 md:h-96 border rounded"
                title="Bank Transfer Receipt"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading || requestsLoading) {
    return <ProgressLoader isVisible={true} message="Loading payment data..." />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600">Unable to load payment information. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <ConfirmationModalWrapper />
      
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  💳 Payments & Enrollment
                </h1>
                <p className="text-gray-600 mt-1">Manage enrollment requests and direct transfers</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {(requests?.length || 0) + (transfers?.length || 0)}
              </div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-xl shadow-lg p-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('enrollment-requests')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'enrollment-requests'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5" />
              📋 Enrollment Requests
              {requests?.length > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === 'enrollment-requests' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                }`}>
                  {requests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('direct-transfers')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'direct-transfers'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              💰 Direct Transfers
              {transfers?.length > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === 'direct-transfers' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-600'
                }`}>
                  {transfers.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'enrollment-requests' ? (
        <EnrollmentRequestsTab 
          requests={requests}
          selectedRequestId={selectedRequestId}
          setSelectedRequestId={setSelectedRequestId}
          adminNotes={adminNotes}
          setAdminNotes={setAdminNotes}
          editingNotes={editingNotes}
          setEditingNotes={setEditingNotes}
          handleDecision={handleDecision}
          handleDelete={handleDelete}
          handleAddNote={handleAddNote}
          handleEditNote={handleEditNote}
          handleDeleteNote={handleDeleteNote}
          getStatusIcon={getStatusIcon}
          getStatusBadge={getStatusBadge}
          getPaymentMethodBadge={getPaymentMethodBadge}
          getPaymentMethodIcon={getPaymentMethodIcon}
          getApprovedByDisplay={getApprovedByDisplay}
          ReceiptViewer={ReceiptViewer}
          updating={updating}
          isProcessing={isProcessing}
        />
      ) : activeTab === 'direct-transfers' ? (
        <DirectTransfersTab 
          transfers={transfers}
          handleApprove={handleApprove}
          isApproving={isApproving}
        />
      ) : null}
    </div>
  );
};

// Enrollment Requests Tab Component
const EnrollmentRequestsTab = ({ 
  requests, selectedRequestId, setSelectedRequestId, adminNotes, setAdminNotes,
  editingNotes, setEditingNotes, handleDecision, handleDelete, handleAddNote,
  handleEditNote, handleDeleteNote, getStatusIcon, getStatusBadge, 
  getPaymentMethodBadge, getPaymentMethodIcon, getApprovedByDisplay, ReceiptViewer, updating, isProcessing 
}) => (
  <div className="max-w-7xl mx-auto">
    {/* Quick Stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">⏳ Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {requests?.filter(r => r.status === 'pending').length || 0}
            </p>
          </div>
          <Clock className="w-8 h-8 text-yellow-500" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">✅ Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {requests?.filter(r => r.status === 'approved').length || 0}
            </p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">❌ Rejected</p>
            <p className="text-2xl font-bold text-red-600">
              {requests?.filter(r => r.status === 'rejected').length || 0}
            </p>
          </div>
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">💰 Total Amount</p>
            <p className="text-2xl font-bold text-blue-600">
              ${requests?.reduce((sum, r) => sum + (r.transferredAmount || 0), 0).toFixed(2) || '0.00'}
            </p>
          </div>
          <DollarSign className="w-8 h-8 text-blue-500" />
        </div>
      </div>
    </div>

    {/* Workflow Information */}
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-lg">💡</span>
          </div>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">Unified Approval Workflow</h3>
          <div className="mt-1 text-sm text-blue-700">
            <p className="mb-1">
              <strong>For Direct Transfer Payments:</strong> Use the "Direct Transfers" tab to approve payments. 
              This will automatically approve the enrollment request, enroll the student, and record billing.
            </p>
            <p>
              <strong>For Card/PayPal Payments:</strong> These are automatically approved and enrolled when payment succeeds.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Enrollment Requests Table */}
    {requests?.length === 0 ? (
      <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
        <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No Enrollment Requests</h3>
        <p className="text-sm sm:text-base text-gray-600">Enrollment requests for your courses will appear here.</p>
      </div>
    ) : (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          {requests?.map((r) => (
            <div key={r._id} className="border-b border-gray-200 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {r.student?.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.student?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{r.student?.email || "No email"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">📚 Course:</span>
                      <span className="font-medium">{r.course?.title || "N/A"}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">📊 Status:</span>
                      <span className={getStatusBadge(r.status)}>
                        {getStatusIcon(r.status)}
                        {r.status?.charAt(0)?.toUpperCase() + r.status?.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">💰 Amount:</span>
                      <span className="font-medium">
                        {r.paymentMethod === 'direct_transfer' && r.transferredAmount ? (
                          <span className="text-green-600">💰 ${r.transferredAmount.toFixed(2)}</span>
                        ) : r.course?.price ? (
                          <span className="text-blue-600">💰 ${r.course.price}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">💳 Payment:</span>
                      <span className={getPaymentMethodBadge(r.paymentMethod)}>
                        {getPaymentMethodIcon(r.paymentMethod)} {
                          r.paymentMethod === 'direct_transfer' ? 'Bank Transfer' :
                          r.paymentMethod === 'stripe' ? 'Credit Card' :
                          r.paymentMethod === 'paypal' ? 'PayPal' :
                          'Not Specified'
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">✅ Approved By:</span>
                      <div className="text-right">{getApprovedByDisplay(r)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                <button
                  disabled={r.status !== "pending" || updating || isProcessing}
                  onClick={() => handleDecision(r._id, "approved")}
                  className="flex-1 min-w-0 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  ✅ Approve
                </button>
                <button
                  disabled={r.status !== "pending" || updating || isProcessing}
                  onClick={() => handleDecision(r._id, "rejected")}
                  className="flex-1 min-w-0 inline-flex items-center justify-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  ❌ Reject
                </button>
                <button
                  onClick={() => handleDelete(r._id)}
                  disabled={isProcessing}
                  className="inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setSelectedRequestId(
                      selectedRequestId === r._id ? null : r._id
                    )
                  }
                  className="inline-flex items-center justify-center px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 text-sm font-medium"
                >
                  {selectedRequestId === r._id ? (
                    <><ChevronUp className="w-4 h-4 mr-1" /> 🔼 Hide</>
                  ) : (
                    <><ChevronDown className="w-4 h-4 mr-1" /> 🔽 Show</>
                  )}
                </button>
              </div>
              
              {/* Mobile Details */}
              {selectedRequestId === r._id && (
                <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg space-y-4">
                  {/* Bank Transfer Details */}
                  {r.paymentMethod === 'direct_transfer' && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        🏦 Bank Transfer Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Amount:</strong> 💰 ${r.transferredAmount?.toFixed(2) || 'N/A'}</p>
                        <p><strong>Bank:</strong> 🏛️ {r.transferDetails?.bankName || 'N/A'}</p>
                        <p><strong>Reference:</strong> 🔢 {r.transferDetails?.referenceNumber || 'N/A'}</p>
                        <p><strong>Transfer Date:</strong> 📅 {
                          r.transferDetails?.transferDate 
                            ? new Date(r.transferDetails.transferDate).toLocaleDateString()
                            : 'N/A'
                        }</p>
                      </div>
                      
                      {/* Bank Transfer Proof */}
                      {r.bankTransferProof && r.bankTransferProof.fileName && (
                        <div className="mt-4 pt-3 border-t border-blue-200">
                          <strong className="text-blue-800">Transfer Proof:</strong>
                          <div className="mt-2">
                            <ReceiptViewer 
                              requestId={r._id} 
                              fileName={r.bankTransferProof.fileName}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Add Note Section */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="block font-medium text-gray-700 mb-2">
                      📝 Add Note
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      value={adminNotes[r._id] || ""}
                      onChange={(e) =>
                        setAdminNotes((prev) => ({
                          ...prev,
                          [r._id]: e.target.value,
                        }))
                      }
                      placeholder="Add a note about this enrollment request..."
                    />
                    <button
                      onClick={() => handleAddNote(r._id)}
                      disabled={updating || isProcessing}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors duration-200 text-sm font-medium"
                    >
                      💾 Save Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  👤 Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  📚 Course
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  📊 Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  💰 Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  💳 Payment Method
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ✅ Approved By
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ⚡ Actions
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  📋 Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests?.map((r) => (
                <React.Fragment key={r._id}>
                  <tr className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {r.student?.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {r.student?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {r.student?.email || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {r.course?.title || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${r.course?.price || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(r.status)}>
                        {getStatusIcon(r.status)}
                        {r.status?.charAt(0)?.toUpperCase() + r.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {r.paymentMethod === 'direct_transfer' && r.transferredAmount ? (
                        <span className="font-medium text-green-600">
                          💰 ${r.transferredAmount.toFixed(2)}
                        </span>
                      ) : r.course?.price ? (
                        <span className="font-medium text-blue-600">
                          💰 ${r.course.price}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getPaymentMethodBadge(r.paymentMethod)}>
                        {getPaymentMethodIcon(r.paymentMethod)} {
                          r.paymentMethod === 'direct_transfer' ? 'Bank Transfer' :
                          r.paymentMethod === 'stripe' ? 'Credit Card' :
                          r.paymentMethod === 'paypal' ? 'PayPal' :
                          'Not Specified'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getApprovedByDisplay(r)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          disabled={r.status !== "pending" || updating || isProcessing}
                          onClick={() => handleDecision(r._id, "approved")}
                          className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                          title="Approve Request"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          ✅ Approve
                        </button>
                        <button
                          disabled={r.status !== "pending" || updating || isProcessing}
                          onClick={() => handleDecision(r._id, "rejected")}
                          className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                          title="Reject Request"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          ❌ Reject
                        </button>
                        <button
                          onClick={() => handleDelete(r._id)}
                          disabled={isProcessing}
                          className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          setSelectedRequestId(
                            selectedRequestId === r._id ? null : r._id
                          )
                        }
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                      >
                        {selectedRequestId === r._id ? (
                          <><ChevronUp className="w-4 h-4 mr-1" /> 🔼 Hide</>
                        ) : (
                          <><ChevronDown className="w-4 h-4 mr-1" /> 🔽 Show</>
                        )}
                      </button>
                    </td>
                  </tr>
                  {selectedRequestId === r._id && (
                    <tr>
                      <td colSpan={8} className="bg-gradient-to-r from-gray-50 to-blue-50 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                              <Users className="w-5 h-5 mr-2 text-blue-500" />
                              👤 Student Information
                            </h4>
                            <p><strong>Name:</strong> {r.student?.name || "Unknown"}</p>
                            <p><strong>Email:</strong> {r.student?.email || "No email"}</p>
                            <p><strong>Course:</strong> {r.course?.title || "N/A"}</p>
                            <p><strong>Status:</strong> 
                              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                                r.status === 'approved' ? 'bg-green-100 text-green-800' :
                                r.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {r.status || "Status not defined"}
                              </span>
                            </p>
                          </div>
                          
                          {/* Bank Transfer Details */}
                          {r.paymentMethod === 'direct_transfer' && (
                            <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
                              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                                <DollarSign className="w-5 h-5 mr-2" />
                                🏦 Bank Transfer Details
                              </h4>
                              <p><strong>Amount:</strong> 💰 ${r.transferredAmount?.toFixed(2) || 'N/A'}</p>
                              <p><strong>Bank:</strong> 🏛️ {r.transferDetails?.bankName || 'N/A'}</p>
                              <p><strong>Reference:</strong> 🔢 {r.transferDetails?.referenceNumber || 'N/A'}</p>
                              <p><strong>Transfer Date:</strong> 📅 {
                                r.transferDetails?.transferDate 
                                  ? new Date(r.transferDetails.transferDate).toLocaleDateString()
                                  : 'N/A'
                              }</p>
                              
                              {/* Bank Transfer Proof */}
                              {r.bankTransferProof && r.bankTransferProof.fileName && (
                                <div className="mt-4 pt-3 border-t border-blue-200">
                                  <strong className="text-blue-800">Transfer Proof:</strong>
                                  <div className="mt-2">
                                    <ReceiptViewer 
                                      requestId={r._id} 
                                      fileName={r.bankTransferProof.fileName}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Add Note Section */}
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <label className="block font-medium text-gray-700 mb-2">
                            📝 Add Note
                          </label>
                          <textarea
                            rows={3}
                            className="w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={adminNotes[r._id] || ""}
                            onChange={(e) =>
                              setAdminNotes((prev) => ({
                                ...prev,
                                [r._id]: e.target.value,
                              }))
                            }
                            placeholder="Add a note about this enrollment request..."
                          />
                          <button
                            onClick={() => handleAddNote(r._id)}
                            disabled={updating || isProcessing}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors duration-200 text-sm font-medium"
                          >
                            💾 Save Note
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

// Direct Transfers Tab Component  
const DirectTransfersTab = ({ transfers, handleApprove, isApproving }) => (
  <div className="max-w-7xl mx-auto">
    {transfers.length === 0 ? (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Transfers</h3>
        <p className="text-gray-600">Direct transfer payments will appear here for approval.</p>
      </div>
    ) : (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  👤 Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  📚 Course
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  💰 Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  📊 Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ⚡ Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfers.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {p.student?.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {p.student?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {p.student?.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {p.course?.title || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-green-600">
                      💰 ${p.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      ⏳ {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleApprove(p._id)}
                      disabled={isApproving}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                    >
                      {isApproving ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          ✅ Approve Payment
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);


export default InstructorPayments;
