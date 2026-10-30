import React from "react";

const StudentRecentPayments = ({ recentTransactions }) => {
  if (!recentTransactions || recentTransactions.length === 0) return null;
  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        Recent Payment Activity
      </h3>
      <div className="space-y-3">
        {recentTransactions.slice(0, 5).map((transaction, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 rounded-lg mr-3 bg-gray-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={transaction.type === "credit" ? "M12 6v6m0 0v6m0-6h6m-6 0H6" : "M20 12H4"} />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">{transaction.description}</p>
                <p className="text-sm text-gray-500">{new Date(transaction.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{transaction.type === "credit" ? "+" : "-"}${transaction.amount?.toLocaleString()}</p>
              <p className="text-sm text-gray-500 capitalize">{transaction.status}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <a href="/billing" className="text-sky-600 hover:text-sky-800 font-medium">View All Payment History</a>
      </div>
    </div>
  );
};

export default StudentRecentPayments;