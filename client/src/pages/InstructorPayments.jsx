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
  return <InstructorPaymentsView />;
  return <InstructorPaymentsView />;

};

export default InstructorPayments;
