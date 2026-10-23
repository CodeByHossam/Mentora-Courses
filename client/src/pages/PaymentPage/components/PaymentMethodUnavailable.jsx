import React from 'react';

const PaymentMethodUnavailable = ({ method, availableMethods }) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="font-semibold text-yellow-800 mb-2">{method} Not Available</h3>
      {availableMethods.length > 0 ? (
        <div>
          <p className="text-yellow-700 mb-3">Please use one of the available payment methods:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {availableMethods.map((availableMethod, index) => (
              <span key={index} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {availableMethod}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-yellow-700 mb-2">No payment methods are currently available for this course.</p>
          <p className="text-yellow-600 text-sm">Please contact the administration for assistance.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodUnavailable;
