/**
 * Student Bills Component
 * 
 * Displays student's billing information including:
 * - Outstanding bills and payment status
 * - Payment history
 * - Quick payment actions
 * - Bill details and due dates
 * 
 * @author Mentora Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react';
import Card from './Card';
import Button from './Button';

const StudentBills = ({ userId }) => {
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = useSelector(selectCurrentToken);

  useEffect(() => {
    fetchBillsAndPayments();
  }, [userId]);

  const fetchBillsAndPayments = async () => {
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token');
      
      if (!authToken) {
        console.warn('No authentication token available');
        setBills([]);
        setPayments([]);
        return;
      }

      const response = await fetch('http://localhost:5000/api/payments/user/bills', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('API returned non-JSON response:', response.status, response.statusText);
        // If it's HTML (error page), treat as no data available
        setBills([]);
        setPayments([]);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setBills(data.data?.bills || []);
        setPayments(data.data?.payments || []);
      } else {
        // Try to parse error response
        try {
          const errorData = await response.json();
          console.error('API Error:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response');
        }
        
        // Only show error for actual server errors, not for users with no billing data
        if (response.status === 500) {
          toast.error('Failed to load billing information');
        }
        // For 404 or other errors, just set empty arrays (user has no billing data)
        setBills([]);
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      
      // Check if it's a JSON parsing error (HTML response)
      if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
        console.warn('Received HTML response instead of JSON - endpoint may not exist');
        setBills([]);
        setPayments([]);
        return;
      }
      
      // Only show error for network issues, not for missing data
      if (error.name === 'NetworkError' || error.message.includes('fetch')) {
        toast.error('Network error loading billing information');
      }
      
      // Set empty arrays as fallback
      setBills([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentMethodBadge = (method) => {
    const methodConfig = {
      stripe: { color: 'bg-purple-100 text-purple-800', label: 'Card' },
      paypal: { color: 'bg-blue-100 text-blue-800', label: 'PayPal' },
      direct_transfer: { color: 'bg-green-100 text-green-800', label: 'Bank Transfer' }
    };

    const config = methodConfig[method] || { color: 'bg-gray-100 text-gray-800', label: method };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const outstandingBills = bills.filter(bill => bill.status !== 'paid');
  const paidBills = bills.filter(bill => bill.status === 'paid');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    );
  }

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
  );
};

export default StudentBills;
