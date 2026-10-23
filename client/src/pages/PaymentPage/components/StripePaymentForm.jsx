import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useConfirmStripePaymentMutation } from "../../../store/services/paymentApi";
import { useAddBillingChargeMutation } from "../../../store/services/billingApi";

const StripePaymentForm = ({ course, paymentData, onInitiate, loading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const [confirmStripePayment] = useConfirmStripePaymentMutation();
  const [addBillingCharge] = useAddBillingChargeMutation();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!paymentData) {
      onInitiate();
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: course.title,
            },
          },
        }
      );

      if (error) {
        toast.error(error.message);
        setProcessing(false);
      } else {
        // Confirm payment on backend
        const result = await confirmStripePayment({
          paymentIntentId: paymentIntent.id,
        }).unwrap();

        if (result.success) {
          toast.success("Payment successful! You are now enrolled.");
          navigate(`/courses/${course._id}`);
        } else {
          toast.error("Payment verification failed");
        }
        setProcessing(false);
      }
    } catch (error) {
      console.error("Payment confirmation error:", error);
      toast.error("Payment verification failed");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold mb-4">💳 Card Details</h3>
        <div className="border rounded-lg p-3 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading || processing}
        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading || processing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Pay $${course.finalPrice}`
        )}
      </button>
    </form>
  );
};

export default StripePaymentForm;
