import React, { useState } from "react";
import { toast } from "react-toastify";

const PaymentMethodSelector = ({
  paymentMethod,
  setPaymentMethod,
  availableMethods = ["stripe", "direct_transfer"],
}) => {
  const [showDirectLink, setShowDirectLink] = useState(false);

  const allPaymentMethods = [
    {
      id: "stripe",
      name: "Credit/Debit Card",
      description: "Visa, MasterCard",
      icon: "\u{1F4B3}",
      available: availableMethods.includes("stripe"),
      disabled: true,
    },
    {
      id: "direct_transfer",
      name: "Bank Transfer",
      description: "Direct bank transfer",
      icon: "\u{1F3E6}",
      available: availableMethods.includes("direct_transfer"),
      disabled: false,
    },
  ];

  const visibleMethods = allPaymentMethods.filter((m) => m.available);

  const handleCardClick = () => {
    toast.info("card payment is not available please contact your instructor");
    toast.info(
      "This payment method is not available. Direct payment is available \u2014 please click to go to the direct payment page."
    );
    setShowDirectLink(true);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {visibleMethods.length > 0 ? (
          visibleMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => {
                if (method.disabled) {
                  handleCardClick();
                  return;
                }
                setShowDirectLink(false);
                setPaymentMethod(method.id);
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                method.disabled
                  ? "cursor-pointer opacity-60 border-gray-200 bg-gray-50 hover:border-gray-300"
                  : paymentMethod === method.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"
              }`}
              style={{ minHeight: "120px" }}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{method.icon}</div>
                <h3 className="font-semibold text-gray-900">{method.name}</h3>
                <p className="text-sm text-gray-600">{method.description}</p>
                {method.disabled && (
                  <p className="text-xs text-red-500 mt-1">Not available</p>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-gray-500">
            <p>No payment methods available. Please contact support.</p>
          </div>
        )}
      </div>

      {showDirectLink && (
        <div className="mb-4 text-center">
          <button
            onClick={() => {
              setPaymentMethod("direct_transfer");
              setShowDirectLink(false);
            }}
            className="text-indigo-600 hover:text-indigo-800 font-medium underline"
          >
            Go to Direct Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;