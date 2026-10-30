import React from "react";

const StudentBillsView = (props) => {
  return (
    <>
  return (
    <div className="space-y-6">
      {/* Outstanding Bills */}
      {outstandingBills.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
              Outstanding Bills ({outstandingBills.length})
            </h3>
          </div>

          <div className="space-y-4">
            {outstandingBills.map((bill) => (
              <div
                key={bill._id || `${bill.description}-${bill.dueDate}`}
                className={`p-4 border rounded-lg ${
                  isOverdue(bill.dueDate) ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900">{bill.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-600 flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            ${bill.amount?.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Due: {new Date(bill.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(isOverdue(bill.dueDate) ? 'overdue' : bill.status)}
                    {bill.paymentId && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate(`/payment/${bill.paymentId}`)}
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Payments */}
      {payments.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Recent Payments
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.slice(0, 5).map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.course?.title || payment.description || 'Course Payment'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${payment.amount?.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentMethodBadge(payment.method)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments.length > 5 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Navigate to full payment history page
                  toast.info('Full payment history page coming soon');
                }}
              >
                View All Payments ({payments.length})
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Paid Bills Summary */}
      {paidBills.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Paid Bills ({paidBills.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paidBills.slice(0, 6).map((bill) => (
              <div key={bill._id || `${bill.description}-${bill.paidAt}`} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-gray-900 text-sm">{bill.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold text-green-700">
                    ${bill.amount?.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(bill.paidAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {paidBills.length > 6 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Show all paid bills
                  toast.info('Full bill history coming soon');
                }}
              >
                View All ({paidBills.length})
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* No Bills Message */}
      {bills.length === 0 && payments.length === 0 && (
        <Card className="p-6 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Bills or Payments</h3>
          <p className="text-gray-600 mb-4">
            You don't have any bills or payment history yet. When you enroll in paid courses,
            your billing information will appear here.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              onClick={() => navigate('/courses')}
            >
              Browse Courses
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
            >
              Manage Payment Info
            </Button>
          </div>
        </Card>
      )}
    </div>
    </>
  );
};

export default StudentBillsView;
