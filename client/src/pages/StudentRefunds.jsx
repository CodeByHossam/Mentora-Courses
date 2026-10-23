import React from 'react';
import { useSelector } from 'react-redux';
import StudentRefundRequest from '../components/refunds/StudentRefundRequest';
import { selectCurrentUser } from '../store/slices/authSlice';

const StudentRefunds = () => {
  const user = useSelector(selectCurrentUser);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Course Refund Requests
          </h1>
          <p className="mt-2 text-gray-600">
            Request refunds for courses that don't meet your expectations. 
            All approved refunds will be processed as gift cards for future use.
          </p>
        </div>

        {/* Refund Request Component */}
        <StudentRefundRequest />
      </div>
    </div>
  );
};

export default StudentRefunds;
