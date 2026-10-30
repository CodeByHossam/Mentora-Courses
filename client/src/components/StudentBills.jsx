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
import StudentBillsView from "./StudentBillsView";
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

  return <StudentBillsView />;
};

export default StudentBills;
