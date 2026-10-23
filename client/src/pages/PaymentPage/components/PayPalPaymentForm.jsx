import React from 'react';

const PayPalPaymentForm = ({ course, paymentData, onInitiate, loading }) => {
  if (!paymentData) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-xl text-center">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="font-semibold mb-2">PayPal Payment</h3>
          <p className="text-gray-600">Pay securely with your PayPal account</p>
        </div>

        <button
          onClick={onInitiate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Loading...
            </div>
          ) : (
            'Pay with PayPal'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">PayPal Payment</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Amount:</span>
              <span className="text-xl font-bold text-blue-600">${paymentData.amount}</span>
            </div>
          </div>
          
          {paymentData.approvalUrl ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Click the button below to complete payment with PayPal</p>
              <a
                href={paymentData.approvalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Complete PayPal Payment
              </a>
            </div>
          ) : (
            <div className="text-center text-gray-600">
              <p>Preparing PayPal payment...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayPalPaymentForm;
