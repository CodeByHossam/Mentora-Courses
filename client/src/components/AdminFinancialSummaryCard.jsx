import React from "react";
import { useGetAdminFinancialSummaryQuery } from "../store/services/billingApi";

const AdminFinancialSummaryCard = () => {
  const { data, isLoading, isError } = useGetAdminFinancialSummaryQuery();

  if (isLoading) {
    return <div className="mb-6 rounded-xl bg-white p-4 shadow">Loading payment summary...</div>;
  }

  if (isError || !data?.data) {
    return null;
  }

  const summary = data.data;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
      <div className="rounded-xl bg-white p-4 shadow">
        <p className="text-sm text-gray-500">Revenue (payments)</p>
        <p className="text-xl font-bold text-gray-900">{summary.totalRevenue ?? 0}</p>
      </div>
      <div className="rounded-xl bg-white p-4 shadow">
        <p className="text-sm text-gray-500">Commission</p>
        <p className="text-xl font-bold text-gray-900">{summary.totalCommission ?? 0}</p>
      </div>
      <div className="rounded-xl bg-white p-4 shadow">
        <p className="text-sm text-gray-500">Instructor share</p>
        <p className="text-xl font-bold text-gray-900">{summary.totalInstructorAmount ?? 0}</p>
      </div>
      <div className="rounded-xl bg-white p-4 shadow">
        <p className="text-sm text-gray-500">Sales</p>
        <p className="text-xl font-bold text-gray-900">{summary.totalSales ?? 0}</p>
      </div>
    </div>
  );
};

export default AdminFinancialSummaryCard;