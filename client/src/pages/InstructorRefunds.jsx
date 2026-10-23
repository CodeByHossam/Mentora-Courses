import React from 'react';
import { useSelector } from 'react-redux';
import InstructorRefundRequest from '../components/refunds/InstructorRefundRequest';
import { selectCurrentUser } from '../store/slices/authSlice';

const InstructorRefunds = () => {
  const user = useSelector(selectCurrentUser);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Fee Refund Requests
          </h1>
          <p className="mt-2 text-gray-600">
            Request refunds for admin fee overpayments. 
            All approved refunds will be processed as gift cards that can be used for platform services.
          </p>
        </div>

        {/* Refund Request Component */}
        <InstructorRefundRequest />
      </div>
    </div>
  );
};

export default InstructorRefunds;
