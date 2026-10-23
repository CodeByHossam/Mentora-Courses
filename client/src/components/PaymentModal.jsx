import React, { useState } from 'react';
import Modal from './Modal';
import { CardElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { X } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY);

const PaymentModal = ({ isOpen, onClose, onPayment, isLoading, paymentData, title, description, suggestedAmounts, minAmount, maxAmount, amount }) => {
  const [inputAmount, setInputAmount] = useState(amount || minAmount);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [error, setError] = useState(null);

  const handleSubmit = async (e, stripe, elements) => {
    e.preventDefault();
    setError(null);

    try {
      if (!paymentData) {
        await onPayment({ amount: parseFloat(inputAmount), method: paymentMethod });
        return;
      }

      if (paymentMethod === 'stripe' && stripe && elements) {
        const cardElement = elements.getElement(CardElement);
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          paymentData.clientSecret,
          { payment_method: { card: cardElement, billing_details: { name: 'Billing Payment' } } }
        );

        if (stripeError) throw stripeError;

        await onPayment({ confirmed: true, paymentIntentId: paymentIntent.id });
      }

    } catch (err) {
      setError(err.message || 'Payment failed.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-xl p-4 sm:p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <p className="mb-4 text-sm sm:text-base text-gray-600">{description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {suggestedAmounts.map((amt) => (
            <button key={amt} onClick={() => setInputAmount(amt)} className={`px-4 py-2 rounded ${inputAmount === amt ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              ${amt}
            </button>
          ))}
        </div>

        <input
          type="number"
          min={minAmount}
          max={maxAmount}
          value={inputAmount}
          onChange={(e) => setInputAmount(Number(e.target.value))}
          className="w-full mb-4 border border-gray-300 rounded px-3 py-2"
        />

        <div className="flex gap-4 mb-4">
          <button onClick={() => setPaymentMethod('stripe')} className={`flex-1 py-2 rounded ${paymentMethod === 'stripe' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Stripe</button>
          <button onClick={() => setPaymentMethod('direct')} className={`flex-1 py-2 rounded ${paymentMethod === 'direct' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Direct</button>
        </div>

        {paymentMethod === 'stripe' && (
          <Elements stripe={stripePromise}>
            <StripeForm inputAmount={inputAmount} onSubmit={handleSubmit} isLoading={isLoading} paymentData={paymentData} />
          </Elements>
        )}

        {paymentMethod === 'direct' && (
          <button
            onClick={() => onPayment({ amount: parseFloat(inputAmount), method: 'direct' })}
            disabled={isLoading}
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : `Pay $${inputAmount} Directly`}
          </button>
        )}

        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </Modal>
  );
};

const StripeForm = ({ inputAmount, onSubmit, isLoading, paymentData }) => {
  const { stripe, elements } = React.useContext(require('@stripe/react-stripe-js').ElementsContext);

  return (
    <form onSubmit={(e) => onSubmit(e, stripe, elements)}>
      <div className="mb-4 border p-3 rounded">
        <CardElement />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : `Pay $${inputAmount}`}
      </button>
    </form>
  );
};

export default PaymentModal;
