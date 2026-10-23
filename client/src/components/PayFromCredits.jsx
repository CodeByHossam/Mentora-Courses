import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { CreditCard, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

const PayFromCredits = ({ 
  availableCredits = 0, 
  outstandingBalance = 0, 
  onPaymentSuccess,
  onCancel 
}) => {
  const maxPayableAmount = Math.min(availableCredits, outstandingBalance);
  const [paymentAmount, setPaymentAmount] = useState(maxPayableAmount > 0 ? maxPayableAmount : 10);
  const [loading, setLoading] = useState(false);

  // Debug logging
  console.log('PayFromCredits Debug:', {
    availableCredits,
    outstandingBalance,
    maxPayableAmount,
    paymentAmount
  });

  const handlePayFromCredits = async () => {
    if (paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (paymentAmount > maxPayableAmount) {
      toast.error(`Maximum payable amount is $${maxPayableAmount.toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      // Get token from localStorage or Redux store
      const token = localStorage.getItem('token');
      
      // Create a billing payment record for admin approval
      const response = await fetch('/api/billing/pay-from-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: paymentAmount,
          description: `Payment from credits - Outstanding balance settlement`
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment request submitted for admin approval');
        onPaymentSuccess?.(data.data);
      } else {
        toast.error(data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const suggestedAmounts = [
    Math.min(25, maxPayableAmount),
    Math.min(50, maxPayableAmount),
    Math.min(100, maxPayableAmount),
    maxPayableAmount
  ].filter((amount, index, arr) => amount > 0 && arr.indexOf(amount) === index);

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pay from Credits</h2>
        <p className="text-gray-600">Use your available credits to pay outstanding balance</p>
      </div>

      {/* Account Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Available Credits:</span>
          <span className="font-semibold text-green-600">${availableCredits.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Outstanding Balance:</span>
          <span className="font-semibold text-red-600">${outstandingBalance.toFixed(2)}</span>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Max Payable:</span>
          <span className="font-bold text-blue-600">${maxPayableAmount.toFixed(2)}</span>
        </div>
      </div>

      {maxPayableAmount <= 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {availableCredits <= 0 
              ? "You don't have enough credits to make a payment"
              : "You don't have any outstanding balance to pay"
            }
          </p>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          {/* Payment Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                max={maxPayableAmount}
                min={0}
                step="0.01"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Suggested Amounts */}
          {suggestedAmounts.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Select
              </label>
              <div className="grid grid-cols-2 gap-2">
                {suggestedAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setPaymentAmount(amount)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      paymentAmount === amount
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ${amount.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Payment Process:</p>
                <p>Your payment will be submitted for admin approval. Once approved, the amount will be deducted from your credits and your outstanding balance will be reduced.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handlePayFromCredits}
              disabled={loading || paymentAmount <= 0 || paymentAmount > maxPayableAmount || maxPayableAmount <= 0}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              title={maxPayableAmount <= 0 ? 'No credits or outstanding balance available' : ''}
            >
              {loading ? 'Processing...' : `Pay $${(paymentAmount || 0).toFixed(2)}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PayFromCredits;
