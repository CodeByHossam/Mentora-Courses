import { useState } from 'react';
import { useGetAllInstructorsQuery } from '../store/services/userApi';
import { useProcessInstructorPayoutMutation } from '../store/services/payoutApi';
import { DollarSign, Upload, X, CheckCircle, AlertCircle, RefreshCw, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminInstructorPayoutsView from "./AdminInstructorPayoutsView";

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

  return <AdminInstructorPayoutsView />;
};

export default AdminInstructorPayouts;
