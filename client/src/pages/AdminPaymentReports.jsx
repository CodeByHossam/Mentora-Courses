import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPaymentReportsQuery } from '../store/services/paymentApi';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  CreditCard, 
  Calendar,
  Download,
  Filter,
  Eye,
  FileText,
  PieChart,
  BarChart3
} from 'lucide-react';

const AdminPaymentReports = () => {
  const navigate = useNavigate();
  const { data: reportsData, isLoading, error } = useGetPaymentReportsQuery();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedPayment, setSelectedPayment] = useState(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <h2 className="text-2xl font-bold mb-2">Error Loading Reports</h2>
          <p>{error?.data?.message || 'Failed to load payment reports'}</p>
        </div>
      </div>
    );
  }

  const { overview, payments, analytics, settings } = reportsData?.data || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings?.paymentSettings?.currency || settings?.currency || 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      submitted: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getMethodIcon = (method) => {
    const icons = {
      stripe: '💳',
      paypal: '🅿️',
      direct_transfer: '🏦',
      card: '💳',
      bank: '🏦',
      cash: '💵'
    };
    return icons[method] || '💰';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'payments', label: 'All Payments', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Profit Settings', icon: DollarSign }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <TrendingUp className="mr-3" />
              Payment Reports & Analytics
            </h1>
            <p className="text-blue-100 mt-2">
              Comprehensive payment insights, profit analysis, and financial reporting
            </p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600">↗ {overview?.profitMargin?.toFixed(1)}% profit margin</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admin Profit</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.totalAdminProfit)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-4">
                <span className="text-sm text-blue-600">{settings?.paymentSettings?.globalDeductionPercentage || settings?.globalDeductionPercentage || 0}% deduction rate</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Instructor Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.totalInstructorEarnings)}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-4">
                <span className="text-sm text-purple-600">Paid to instructors</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{overview?.totalPayments}</p>
                </div>
                <CreditCard className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-4">
                <span className="text-sm text-orange-600">Avg: {formatCurrency(overview?.averagePayment)}</span>
              </div>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              Monthly Revenue Trend (Last 12 Months)
            </h3>
            <div className="space-y-4">
              {analytics?.monthlyData?.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{month.month}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-green-600 font-semibold">{formatCurrency(month.revenue)}</span>
                    <span className="text-blue-600 text-sm">({month.count} payments)</span>
                    <span className="text-purple-600 text-sm">Profit: {formatCurrency(month.profit)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(analytics?.paymentMethodStats || {}).map(([method, stats]) => (
                <div key={method} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700 flex items-center">
                      <span className="mr-2">{getMethodIcon(method)}</span>
                      {method.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">{stats.count} payments</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'payments' && (
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">All Payment Transactions</h3>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex items-center hover:bg-gray-50">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </button>
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments?.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {payment._id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.student?.name}</div>
                      <div className="text-sm text-gray-500">{payment.student?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.course?.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</div>
                      {payment.originalAmount !== payment.amount && (
                        <div className="text-xs text-gray-500">Original: {formatCurrency(payment.originalAmount)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">{formatCurrency(payment.adminFee)}</div>
                      <div className="text-xs text-gray-500">{payment.adminPercentage}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{formatCurrency(payment.instructorAmount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center text-sm text-gray-900">
                        <span className="mr-2">{getMethodIcon(payment.method)}</span>
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(payment.createdAt)}</div>
                      {payment.paidAt && (
                        <div className="text-xs text-green-600">Paid: {formatDate(payment.paidAt)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'analytics' && (
        <div className="space-y-8">
          {/* Course Performance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Courses</h3>
            <div className="space-y-4">
              {analytics?.coursePerformance?.slice(0, 10).map((course, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{course.courseTitle}</h4>
                    <p className="text-sm text-gray-500">Instructor: {course.instructor}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(course.totalRevenue)}</p>
                    <p className="text-sm text-green-600">Profit: {formatCurrency(course.totalProfit)}</p>
                    <p className="text-xs text-gray-500">{course.enrollmentCount} enrollments</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Fee Analytics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Annual User Fees Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analytics?.userFeeData?.map((userData) => (
                <div key={userData._id} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 capitalize">{userData._id}s</h4>
                  <p className="text-2xl font-bold text-gray-900">{userData.count}</p>
                  <p className="text-sm text-green-600">Annual Fees: {formatCurrency(userData.totalAnnualFees)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics?.statusBreakdown || {}).map(([status, data]) => (
                <div key={status} className="p-4 bg-gray-50 rounded-lg text-center">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(status)} mb-2`}>
                    {status}
                  </span>
                  <p className="text-xl font-bold text-gray-900">{data.count}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(data.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'settings' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Profit & Fee Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="font-medium text-gray-900 border-b pb-2">Payment Profit Settings</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Global Deduction Percentage</span>
                  <span className="text-lg font-bold text-blue-600">{settings?.paymentSettings?.globalDeductionPercentage || settings?.globalDeductionPercentage || 0}%</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Currency</span>
                  <span className="text-lg font-bold text-gray-900">{settings?.paymentSettings?.currency || settings?.currency || 'USD'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-medium text-gray-900 border-b pb-2">Annual User Fees</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Instructor Annual Fee</span>
                  <span className="text-lg font-bold text-purple-600">{formatCurrency(settings?.paymentSettings?.instructorAnnualFee || settings?.instructorAnnualFee)}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Student Admin Fee</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(settings?.paymentSettings?.studentAdminFee || settings?.studentAdminFee)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These settings control how profits are calculated and distributed. 
              The global deduction percentage is applied to all course payments to determine admin profit. 
              Annual fees are charged based on user roles.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => navigate('/admin/settings?tab=payments')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Modify Settings
            </button>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment ID</label>
                  <p className="font-mono text-sm">{selectedPayment._id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                    {selectedPayment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Student</label>
                  <p className="font-medium">{selectedPayment.student?.name}</p>
                  <p className="text-sm text-gray-500">{selectedPayment.student?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Course</label>
                  <p className="font-medium">{selectedPayment.course?.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Amount</label>
                  <p className="text-lg font-bold">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Fee ({selectedPayment.adminPercentage}%)</label>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(selectedPayment.adminFee)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Instructor Amount</label>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedPayment.instructorAmount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Method</label>
                  <p className="flex items-center">
                    <span className="mr-2">{getMethodIcon(selectedPayment.method)}</span>
                    {selectedPayment.method}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p>{formatDate(selectedPayment.createdAt)}</p>
                </div>
              </div>

              {selectedPayment.transferDetails && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Transfer Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-500">Bank Name</label>
                      <p>{selectedPayment.transferDetails.bankName}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-500">Reference Number</label>
                      <p>{selectedPayment.transferDetails.referenceNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedPayment.receiptUrl && (
                <div className="border-t pt-4">
                  <button className="text-blue-600 hover:text-blue-800 flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentReports;
