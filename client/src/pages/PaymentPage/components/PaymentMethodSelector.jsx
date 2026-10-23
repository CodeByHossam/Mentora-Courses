import React from 'react';

const PaymentMethodSelector = ({ 
  paymentMethod, 
  setPaymentMethod, 
  availableMethods = ['stripe', 'paypal', 'direct_transfer'],
  giftCardBalance = 0,
  coursePrice = 0,
  courseGiftCard = null
}) => {
  // Define all payment methods
  const allPaymentMethods = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      description: 'Visa, MasterCard',
      icon: '💳',
      available: availableMethods.includes('stripe')
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Secure PayPal payment',
      icon: '🅿️',
      available: availableMethods.includes('paypal')
    },
    {
      id: 'direct_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer',
      icon: '🏦',
      available: availableMethods.includes('direct_transfer')
    },
    {
      id: 'course_gift_card',
      name: '🎁 Course Gift Card',
      description: courseGiftCard ? `Amount: $${courseGiftCard.amount.toFixed(2)} - For this course` : 'Not available',
      icon: '🎁',
      available: availableMethods.includes('course_gift_card'),
      highlight: true
    },
    {
      id: 'gift_card',
      name: 'Gift Card Balance',
      description: giftCardBalance > 0 ? `Available: $${giftCardBalance.toFixed(2)}` : 'No balance available',
      icon: '🎁',
      available: availableMethods.includes('gift_card')
    }
  ];

  // Filter to show only available methods
  const visibleMethods = allPaymentMethods.filter(method => method.available);

  // Debug log
  console.log('Available Methods:', availableMethods);
  console.log('Visible Methods:', visibleMethods);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {visibleMethods.length > 0 ? (
        visibleMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => {
              console.log('Payment method clicked:', method.id);
              setPaymentMethod(method.id);
            }}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              paymentMethod === method.id
                ? method.highlight 
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                  : 'border-indigo-500 bg-indigo-50'
                : method.highlight
                  ? 'border-green-300 bg-green-50 hover:border-green-400'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
            }`}
            style={{ minHeight: '120px' }}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{method.icon}</div>
              <h3 className="font-semibold text-gray-900">{method.name}</h3>
              <p className="text-sm text-gray-600">{method.description}</p>
            </div>
          </button>
        ))
      ) : (
        <div className="col-span-3 text-center py-8 text-gray-500">
          <p>No payment methods available. Please contact support.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
