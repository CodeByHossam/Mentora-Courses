import React from 'react';
import { useSelector } from 'react-redux';
import RefundApproval from '../components/admin/RefundApproval';
import { selectCurrentUser } from '../store/slices/authSlice';

const AdminRefundManagement = () => {
  const user = useSelector(selectCurrentUser);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Refund Request Management
          </h1>
          <p className="mt-2 text-gray-600">
            Review and approve refund requests from students and instructors. 
            All approved refunds will be processed as gift cards.
          </p>
        </div>

        {/* Refund Approval Component */}
        <RefundApproval />
      </div>
    </div>
  );
};

export default AdminRefundManagement;
