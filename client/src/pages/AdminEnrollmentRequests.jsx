import React, { useEffect, useState } from "react";
import { Trash2, Edit2, Save, X } from "lucide-react";
import {
  useGetEnrollmentRequestsQuery,
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

const AdminEnrollmentRequests = () => {
  const { confirm, ConfirmationModalWrapper } = useConfirm();
  const { data: requests, isLoading, error } = useGetEnrollmentRequestsQuery();
  const [updateStatus, { isLoading: updating }] =
    useUpdateEnrollmentRequestMutation();
  const [deleteRequest] = useDeleteEnrollmentRequestMutation();
  const [editAdminNote] = useEditAdminNoteMutation();
  const [deleteAdminNote] = useDeleteAdminNoteMutation();
  const [createPayment] = useCreatePaymentMutation();

  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [editingNotes, setEditingNotes] = useState({});
  const [paidStatus, setPaidStatus] = useState({});
  const [amounts, setAmounts] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper functions for payment method and approval display
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

  useEffect(() => {
    if (error) handleApiError(error);
  }, [error]);

  const handleAddNote = async (id) => {
    if (!adminNotes[id]) return handleApiError("Note cannot be empty");

    const request = requests.find((r) => r._id === id);
    if (!request) return handleApiError("Request not found");

    setIsProcessing(true);
    try {
      await updateStatus({
        id,
        status: request.status, // keep the current status
        adminNote: adminNotes[id],
      }).unwrap();

      handleApiSuccess("Note added successfully.");
      setAdminNotes((prev) => ({ ...prev, [id]: "" })); // clear note field
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecision = async (id, status) => {
    setIsProcessing(true);

    try {
      // Update request status - payment will be created automatically in backend if needed
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

  if (isLoading) return <ProgressLoader />;

  return (
    <div className="min-h-screen bg-primary p-4 sm:p-6 lg:p-8">
      <ConfirmationModalWrapper />
      
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">📋 Enrollment Requests</h1>
          <p className="text-gray-600">Manage student enrollment requests and approvals</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {requests?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No Enrollment Requests</h3>
            <p className="text-sm sm:text-base text-gray-600">Enrollment requests will appear here when submitted.</p>
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
                          <span className="px-2 py-1 rounded text-xs font-medium capitalize bg-gray-100 text-gray-800">
                            {r.status}
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
                      className="flex-1 min-w-0 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 text-sm font-medium"
                    >
                      ✅ Approve
                    </button>
                    <button
                      disabled={r.status !== "pending" || updating || isProcessing}
                      onClick={() => handleDecision(r._id, "rejected")}
                      className="flex-1 min-w-0 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 text-sm font-medium"
                    >
                      ❌ Reject
                    </button>
                    <button
                      onClick={() => handleDelete(r._id)}
                      disabled={isProcessing}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 text-sm font-medium"
                    >
                      🗑️ Delete
                    </button>
                    <button
                      onClick={() => setSelectedRequestId(selectedRequestId === r._id ? null : r._id)}
                      className="px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium"
                    >
                      {selectedRequestId === r._id ? "🔼 Hide" : "🔽 Show"}
                    </button>
                  </div>
                  
                  {/* Mobile Details */}
                  {selectedRequestId === r._id && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg space-y-4">
                      {/* Bank Transfer Details */}
                      {r.paymentMethod === 'direct_transfer' && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-blue-800 mb-3">🏦 Bank Transfer Details</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Amount:</strong> ${r.transferredAmount?.toFixed(2) || 'N/A'}</p>
                            <p><strong>Bank:</strong> {r.transferDetails?.bankName || 'N/A'}</p>
                            <p><strong>Reference:</strong> {r.transferDetails?.referenceNumber || 'N/A'}</p>
                            <p><strong>Transfer Date:</strong> {
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">👤 User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">📚 Course</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">📊 Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">💳 Payment Method</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">💰 Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">✅ Approved By</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">⚡ Actions</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">📋 Details</th>
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
                        </td>
                <td className="p-3 capitalize">{r.status}</td>
                <td className="p-3">
                  <span className={getPaymentMethodBadge(r.paymentMethod)}>
                    {getPaymentMethodIcon(r.paymentMethod)} {
                      r.paymentMethod === 'direct_transfer' ? 'Bank Transfer' :
                      r.paymentMethod === 'stripe' ? 'Credit Card' :
                      r.paymentMethod === 'paypal' ? 'PayPal' :
                      'Not Specified'
                    }
                  </span>
                </td>
                <td className="p-3">
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
                <td className="p-3">
                  {getApprovedByDisplay(r)}
                </td>
                <td className="p-3 flex gap-2">
                  <button
                    disabled={
                      r.status !== "pending" || updating || isProcessing
                    }
                    onClick={() => handleDecision(r._id, "approved")}
                    className="px-3 py-1 bg-green-600 text-white rounded disabled:bg-gray-300"
                  >
                    Approve
                  </button>
                  <button
                    disabled={
                      r.status !== "pending" || updating || isProcessing
                    }
                    onClick={() => handleDecision(r._id, "rejected")}
                    className="px-3 py-1 bg-yellow-600 text-white rounded disabled:bg-gray-300"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleDelete(r._id)}
                    disabled={isProcessing}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
                <td className="p-3">
                  <button
                    onClick={() =>
                      setSelectedRequestId(
                        selectedRequestId === r._id ? null : r._id
                      )
                    }
                    className="text-blue-600 hover:underline"
                  >
                    {selectedRequestId === r._id ? "▲" : "▼"}
                  </button>
                </td>
              </tr>
              {selectedRequestId === r._id && (
                <tr>
                  <td colSpan={8} className="bg-gray-50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p>
                          <strong>User:</strong> {r.student?.name || "Unknown"}
                        </p>
                        <p>
                          <strong>Course:</strong> {r.course?.title || "N/A"}
                        </p>
                        <p>
                          <strong>Current request status:</strong>{" "}
                          {r.status || "Status is not defined"}
                        </p>
                      </div>
                      
                      {/* Bank Transfer Details */}
                      {r.paymentMethod === 'direct_transfer' && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">Bank Transfer Details</h4>
                          <p><strong>Amount:</strong> ${r.transferredAmount?.toFixed(2) || 'N/A'}</p>
                          <p><strong>Bank:</strong> {r.transferDetails?.bankName || 'N/A'}</p>
                          <p><strong>Reference:</strong> {r.transferDetails?.referenceNumber || 'N/A'}</p>
                          <p><strong>Transfer Date:</strong> {
                            r.transferDetails?.transferDate 
                              ? new Date(r.transferDetails.transferDate).toLocaleDateString()
                              : 'N/A'
                          }</p>
                          
                          {/* Bank Transfer Proof */}
                          {r.bankTransferProof && r.bankTransferProof.fileName && (
                            <div className="mt-3 pt-2 border-t border-blue-200">
                              <strong className="text-blue-800">Transfer Proof:</strong>
                              <div className="mt-2">
                                <ReceiptViewer 
                                  requestId={r._id} 
                                  fileName={r.bankTransferProof.fileName}
                                />
                                <span className="text-sm text-gray-600 mt-1 block">
                                  ({r.bankTransferProof.fileName || 'No filename'})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <strong>Admin Notes:</strong>
                      {r.adminNotes && r.adminNotes.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {r.adminNotes.map((note, index) => {
                            const noteKey = `${r._id}-${note._id}`;
                            const isEditing = editingNotes.hasOwnProperty(noteKey);
                            
                            return (
                              <div key={index} className="bg-white p-3 rounded border-l-4 border-blue-500">
                                {isEditing ? (
                                  <div>
                                    <textarea
                                      rows={3}
                                      className="w-full px-2 py-1 border rounded text-sm"
                                      value={editingNotes[noteKey] || ''}
                                      onChange={(e) =>
                                        setEditingNotes(prev => ({
                                          ...prev,
                                          [noteKey]: e.target.value
                                        }))
                                      }
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => handleEditNote(r._id, note._id)}
                                        className="px-2 py-1 bg-green-600 text-white rounded text-xs flex items-center gap-1"
                                      >
                                        <Save size={12} /> Save
                                      </button>
                                      <button
                                        onClick={() => setEditingNotes(prev => {
                                          const newState = { ...prev };
                                          delete newState[noteKey];
                                          return newState;
                                        })}
                                        className="px-2 py-1 bg-gray-600 text-white rounded text-xs flex items-center gap-1"
                                      >
                                        <X size={12} /> Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm text-gray-800">{note.note}</p>
                                    <div className="flex justify-between items-center mt-2">
                                      <div className="text-xs text-gray-500">
                                        By: {note.admin?.name || 'Admin'} on {new Date(note.createdAt).toLocaleString()}
                                        {note.updatedAt && note.updatedAt !== note.createdAt && (
                                          <span className="ml-2">(edited: {new Date(note.updatedAt).toLocaleString()})</span>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => setEditingNotes(prev => ({
                                            ...prev,
                                            [noteKey]: note.note
                                          }))}
                                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs flex items-center gap-1"
                                        >
                                          <Edit2 size={12} /> Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteNote(r._id, note._id)}
                                          className="px-2 py-1 bg-red-600 text-white rounded text-xs flex items-center gap-1"
                                        >
                                          <Trash2 size={12} /> Delete
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 mt-1">No notes have been added</p>
                      )}
                    </div>
                    <label className="block mt-4 font-medium text-gray-700">
                      Admin Note
                    </label>
                    <textarea
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={adminNotes[r._id] || ""}
                      onChange={(e) =>
                        setAdminNotes((prev) => ({
                          ...prev,
                          [r._id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      onClick={() => handleAddNote(r._id)}
                      disabled={updating || isProcessing}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300"
                    >
                      Save Note
                    </button>
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
    </div>
  );
};

export default AdminEnrollmentRequests;
