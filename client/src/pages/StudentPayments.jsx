import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Filter,
  Receipt,
  RefreshCw,
  ExternalLink,
  Eye,
  Search,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { useGetPaymentHistoryQuery } from "../store/services/paymentApi";
import { selectCurrentUser } from "../store/slices/authSlice";

const StudentPayments = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  
  // Fetch real payment data
  const { 
    data: paymentData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useGetPaymentHistoryQuery();

  const payments = paymentData?.data || [];

  const getStatusBadge = (status) => {
    const badges = {
      paid: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, text: "Paid" },
      completed: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, text: "Completed" },
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock, text: "Pending" },
      failed: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle, text: "Failed" },
      processing: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock, text: "Processing" }
    };
    
    const badge = badges[status] || badges.pending;
    const IconComponent = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}>
        <IconComponent className="w-4 h-4 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    switch (method.toLowerCase()) {
      case 'credit card':
        return '💳';
      case 'paypal':
        return '🅿️';
      case 'bank transfer':
        return '🏦';
      default:
        return '💰';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const courseTitle = payment.course?.title || payment.courseTitle || '';
    const transactionId = payment.stripePaymentIntentId || payment.paypalOrderId || payment.transactionId || '';
    const instructor = payment.course?.instructor?.name || payment.instructor || '';
    
    const matchesSearch = courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instructor.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && payment.status === filterStatus;
  });

  const totalPaid = payments
    .filter(p => p.status === "paid" || p.status === "completed")
    .reduce((sum, p) => sum + (p.finalAmount || p.amount), 0);

  const pendingAmount = payments
    .filter(p => p.status === "pending" || p.status === "processing")
    .reduce((sum, p) => sum + (p.finalAmount || p.amount), 0);

  // Note: Download functionality removed for students - they can only view payment details
  // Admin and instructors retain download functionality in their respective pages

  const handleRetryPayment = (payment) => {
    // Redirect to payment page for the course
    if (payment.course?._id) {
      navigate(`/payment/${payment.course._id}`);
    } else {
      console.error("No course ID found for payment retry");
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading your payment history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Payments
            </h3>
            <p className="text-gray-600 mb-6">
              {error?.data?.message || "Failed to load payment history. Please try again."}
            </p>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💳 Payment History
          </h1>
          <p className="text-gray-600">
            View your payment history and transaction details
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="processing">Processing</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {payments.length === 0 ? "No Payment History" : "No Matching Payments"}
            </h3>
            <p className="text-gray-600 mb-6">
              {payments.length === 0 
                ? "You haven't made any payments yet. Enroll in courses to see your payment history here!"
                : "No payments match your current search or filter criteria."
              }
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div
                key={payment._id || payment.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {payment.course?.title || payment.courseTitle || 'Unknown Course'}
                        </h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span className="font-medium">${payment.finalAmount || payment.amount}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getPaymentMethodIcon(payment.method || payment.paymentMethod)}</span>
                          <span className="capitalize">{payment.method || payment.paymentMethod}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{format(new Date(payment.createdAt || payment.date), "MMM dd, yyyy")}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Receipt className="w-4 h-4 mr-2" />
                          <span className="font-mono text-xs">
                            {payment.stripePaymentIntentId || payment.paypalOrderId || payment.transactionId || payment._id}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-2">
                        Instructor: {payment.course?.instructor?.name || payment.instructor || 'Unknown'}
                      </p>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {payment.description || `Payment for ${payment.course?.title || 'course'}`}
                      </p>
                    </div>
                    
                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        ${payment.finalAmount || payment.amount}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(payment.createdAt || payment.date), "h:mm a")}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-3">
                      {payment.status === "failed" && (
                        <button
                          onClick={() => handleRetryPayment(payment)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry Payment
                        </button>
                      )}
                      
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                    </div>
                    
                    {(payment.status === "pending" || payment.status === "processing") && (
                      <div className="text-sm text-yellow-600 font-medium">
                        {payment.status === "processing" ? "Processing..." : "Pending..."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment Methods Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Payment Information</h4>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  We accept credit cards, PayPal, and bank transfers
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  All payments are processed securely with industry-standard encryption
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Payment details are available for all completed transactions
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Contact support if you have any payment-related questions
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Payment Detail Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Course</label>
                  <p className="text-gray-900">{selectedPayment.course?.title || selectedPayment.courseTitle || 'Unknown Course'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Amount</label>
                  <p className="text-gray-900 font-semibold">${selectedPayment.finalAmount || selectedPayment.amount}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Method</label>
                  <p className="text-gray-900 capitalize">{selectedPayment.method || selectedPayment.paymentMethod}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                  <p className="text-gray-900 font-mono text-sm">
                    {selectedPayment.stripePaymentIntentId || selectedPayment.paypalOrderId || selectedPayment.transactionId || selectedPayment._id}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="text-gray-900">{format(new Date(selectedPayment.createdAt || selectedPayment.date), "MMMM dd, yyyy 'at' h:mm a")}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Instructor</label>
                  <p className="text-gray-900">{selectedPayment.course?.instructor?.name || selectedPayment.instructor || 'Unknown'}</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPayments;
