import { useState } from 'react';
import { useGetAllInstructorsQuery } from '../store/services/userApi';
import { useProcessInstructorPayoutMutation } from '../store/services/payoutApi';
import { DollarSign, Upload, X, CheckCircle, AlertCircle, RefreshCw, Send } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminInstructorPayouts = () => {
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch all instructors with their billing data
  const { data: instructorsData, isLoading, refetch } = useGetAllInstructorsQuery();
  const [processPayout, { isLoading: isProcessing }] = useProcessInstructorPayoutMutation();

  const instructors = instructorsData?.users || [];

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!receiptFile) {
      toast.error('Please upload a payment receipt');
      return;
    }

    if (parseFloat(payoutAmount) <= 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }

    // Calculate maximum payable amount
    const pendingCommissions = selectedInstructor.billingAccount?.pendingCommissions || 0;
    const annualFees = selectedInstructor.billingAccount?.annualFees || 0;
    const maxPayableAmount = Math.max(0, pendingCommissions - annualFees);

    if (parseFloat(payoutAmount) > maxPayableAmount) {
      toast.error(`Payout amount cannot exceed $${maxPayableAmount.toFixed(2)} (Pending Commissions: $${pendingCommissions} - Annual Fees: $${annualFees})`);
      return;
    }

    const formData = new FormData();
    formData.append('instructorId', selectedInstructor._id);
    formData.append('amount', payoutAmount);
    formData.append('transactionReference', transactionReference);
    formData.append('notes', notes);
    formData.append('receipt', receiptFile);

    try {
      await processPayout(formData).unwrap();
      toast.success('Payout processed successfully!');
      setShowPaymentModal(false);
      setSelectedInstructor(null);
      setPayoutAmount('');
      setReceiptFile(null);
      setTransactionReference('');
      setNotes('');
      refetch();
    } catch (error) {
      console.error('Payout error:', error);
      toast.error(error?.data?.message || 'Failed to process payout');
    }
  };

  const openPaymentModal = (instructor) => {
    setSelectedInstructor(instructor);
    // Calculate payable amount: pending commissions - annual fees
    const pendingCommissions = instructor.billingAccount?.pendingCommissions || 0;
    const annualFees = instructor.billingAccount?.annualFees || 0;
    const payableAmount = Math.max(0, pendingCommissions - annualFees);
    setPayoutAmount(payableAmount.toString());
    setShowPaymentModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💰 Instructor Payouts
          </h1>
          <p className="text-gray-600">
            Process direct transfer payments to instructors for their pending commissions
          </p>
        </div>

        {/* Instructors List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 border-b">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <DollarSign className="w-6 h-6 mr-2" />
              Instructors with Pending Commissions
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Earned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending Commissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Already Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {instructors.filter(instructor => instructor.billingAccount?.pendingCommissions > 0).map((instructor) => (
                  <tr key={instructor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-emerald-600 font-semibold">
                              {instructor.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {instructor.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instructor.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${instructor.billingAccount?.totalCommissionEarned?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                        ${instructor.billingAccount?.pendingCommissions?.toLocaleString() || '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${instructor.billingAccount?.totalPayoutsReceived?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openPaymentModal(instructor)}
                        className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
                {instructors.filter(instructor => instructor.billingAccount?.pendingCommissions > 0).length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p className="text-lg font-medium">No pending payouts</p>
                      <p className="text-sm">All instructors have been paid!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedInstructor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 border-b flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <DollarSign className="w-6 h-6 mr-2" />
                  Process Payout - {selectedInstructor.name}
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handlePaymentSubmit} className="p-6">
                {/* Instructor Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Instructor</p>
                      <p className="font-semibold text-gray-900">{selectedInstructor.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{selectedInstructor.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pending Commissions</p>
                      <p className="font-semibold text-orange-600">
                        ${selectedInstructor.billingAccount?.pendingCommissions?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Annual Fees</p>
                      <p className="font-semibold text-red-600">
                        -${selectedInstructor.billingAccount?.annualFees?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-gray-300">
                      <p className="text-sm text-gray-600">Maximum Payable Amount</p>
                      <p className="font-bold text-emerald-600 text-lg">
                        ${Math.max(0, (selectedInstructor.billingAccount?.pendingCommissions || 0) - (selectedInstructor.billingAccount?.annualFees || 0)).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        (Pending Commissions - Annual Fees)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payout Amount */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                    max={Math.max(0, (selectedInstructor.billingAccount?.pendingCommissions || 0) - (selectedInstructor.billingAccount?.annualFees || 0))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: ${Math.max(0, (selectedInstructor.billingAccount?.pendingCommissions || 0) - (selectedInstructor.billingAccount?.annualFees || 0)).toFixed(2)}
                  </p>
                </div>

                {/* Transaction Reference */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Reference *
                  </label>
                  <input
                    type="text"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    placeholder="e.g., TXN123456789"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Receipt Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Receipt * (Image or PDF)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-emerald-500 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*,.pdf"
                            onChange={(e) => setReceiptFile(e.target.files[0])}
                            required
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                      {receiptFile && (
                        <p className="text-sm text-emerald-600 font-medium mt-2">
                          ✓ {receiptFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    placeholder="Add any additional notes about this payout..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Process Payout
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInstructorPayouts;
