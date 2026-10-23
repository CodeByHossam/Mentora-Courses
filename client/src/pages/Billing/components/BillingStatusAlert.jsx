import React, { useState } from "react";
import {
  AlertTriangle,
  XCircle,
  CreditCard,
  X,
  Clock,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetBillingAccountQuery } from "../../../store/services/billingApi";

const BillingStatusAlert = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const { data: billingData, isLoading, error } = useGetBillingAccountQuery();

  const billingAccount = billingData?.billingAccount;

  // Don't show if loading, error, or dismissed
  if (isLoading || error || dismissed || !billingAccount) {
    return null;
  }

  // Check if account needs attention
  const balance = billingAccount.balance;
  const isOverLimit = billingAccount.isOverLimit;
  const isActive = billingAccount.isActive;
  const outstandingPayments = billingAccount.outstandingPayments;
  const creditLimit = billingData?.config?.creditLimit || -100;

  // Account suspended
  if (!isActive) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Account Suspended
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Your account has been suspended due to outstanding payments of{" "}
                <span className="font-semibold">
                  ${(outstandingPayments || 0).toFixed(2)}
                </span>
                . Please make a payment to reactivate your account and restore
                access to all features.
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigate("/billing")}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Pay Now
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Over credit limit (critical)
  if (isOverLimit) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Credit Limit Exceeded
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Your account balance of{" "}
                <span className="font-semibold">${(balance || 0).toFixed(2)}</span> has
                exceeded your credit limit of{" "}
                <span className="font-semibold">${(creditLimit || 0).toFixed(2)}</span>
                . Your account may be suspended if payment is not received soon.
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigate("/billing")}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Make Payment
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Approaching credit limit (warning)
  if (balance < creditLimit * 0.8 && balance < 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Low Account Balance
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Your account balance is{" "}
                <span className="font-semibold">${(balance || 0).toFixed(2)}</span>.
                Consider adding funds to avoid service interruption. Credit
                limit: ${(creditLimit || 0).toFixed(2)}
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigate("/billing")}
                className="bg-yellow-100 px-3 py-2 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200 transition-colors flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Add Funds
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="bg-yellow-100 px-3 py-2 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={() => setDismissed(true)}
              className="inline-flex rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Upcoming billing (info)
  const nextBillingDate = new Date(billingAccount.nextBillingDate);
  const daysUntilBilling = Math.ceil(
    (nextBillingDate - new Date()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilBilling <= 30 && daysUntilBilling > 0) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Upcoming Billing
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Your next billing date is in {daysUntilBilling} days (
                {nextBillingDate.toLocaleDateString()}). Annual fee: $
                {(billingData?.config?.annualFee || 0).toFixed(2)}
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigate("/billing")}
                className="bg-blue-100 px-3 py-2 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-200 transition-colors"
              >
                View Billing
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="bg-blue-100 px-3 py-2 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={() => setDismissed(true)}
              className="inline-flex rounded-md p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default BillingStatusAlert;
