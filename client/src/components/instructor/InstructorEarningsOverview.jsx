import React from "react";
import { useNavigate } from "react-router-dom";

const InstructorEarningsOverview = ({ instructorAccount }) => {
  const navigate = useNavigate();
  return (
    <>
        {/* 💰 Instructor Earnings Overview */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.656 0-3 .895-3 2s1.344 2 3 2 3 .895 3 2-1.344 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            💰 Your Earnings & Balance
          </h2>

          {accountLoading ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-300 h-12 w-12"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {/* Available Balance */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V9z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    AVAILABLE
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Balance</h3>
                <p className="text-2xl font-bold text-emerald-600">
                  ${instructorAccount?.availableBalance?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Ready for withdrawal</p>
              </div>

              {/* Total Commissions */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    EARNED
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Commissions</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${instructorAccount?.totalCommissionEarned?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Lifetime earnings</p>
              </div>

              {/* Welcome Credits */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 0v1m-2 0V6a2 2 0 00-2 0v1m2 0V4H9m3 0a2 2 0 012 2M9 8a2 2 0 000 4h6a2 2 0 100-4H9z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    PENDING
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Commissions</h3>
                <p className="text-2xl font-bold text-purple-600">
                  ${instructorAccount?.pendingCommissions?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Unpaid commissions</p>
              </div>

              {/* Outstanding Balance */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    FEES
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Annual Fees</h3>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-orange-600">
                    ${instructorAccount?.annualFees?.toLocaleString() || '0'}
                  </p>
                  {(instructorAccount?.annualFees || 0) > 0 && (
                    <div className="text-xs text-gray-500">
                      <p>Yearly platform fee</p>
                      <p className="text-orange-600">Due: Annual subscription</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">Yearly platform fee</p>
              </div>

              {/* Approved Payouts removed - using direct payout system now */}
            </div>
          )}

          {/* Course Sales Summary */}
          {instructorAccount?.courseSales && instructorAccount.courseSales.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Recent Course Sales
              </h3>
              <div className="space-y-3">
                {instructorAccount.courseSales.slice(0, 5).map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Course Sale - {sale.paymentMethod === 'direct_transfer' ? 'Direct Transfer' : 'Card Payment'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        +${sale.commissionAmount?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        From ${sale.saleAmount?.toLocaleString()} sale
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <a href="/instructor/payments" className="text-emerald-600 hover:text-emerald-800 font-medium">
                  View All Earnings & Payments →
                </a>
              </div>
            </div>
          )}

          {/* Quick Billing Actions */}
          <div className="mt-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/instructor/payments')}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Reports
              </button>
              <button
                onClick={() => navigate('/billing')}
                className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Billing Settings
              </button>
              <button
                onClick={() => navigate('/instructor/refunds')}
                className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 0v1m-2 0V6a2 2 0 00-2 0v1m2 0V4H9m3 0a2 2 0 012 2M9 8a2 2 0 000 4h6a2 2 0 100-4H9z" />
                </svg>
                Request Refund
              </button>
            </div>
          </div>
        </div>
    </>
  );
};

export default InstructorEarningsOverview;
