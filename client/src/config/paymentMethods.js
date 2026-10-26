// Client-side payment method catalog. Add a new entry to support a new method.
export const PAYMENT_METHODS = [
  {
    id: "stripe",
    label: "Credit/Debit Card",
    icon: "\u{1F4B3}",
    available: false,
    disabled: true,
    message:
      "card payment is not available please contact your instructor",
  },
  {
    id: "direct_transfer",
    label: "Bank Transfer",
    icon: "\u{1F3E6}",
    available: true,
    disabled: false,
    component: "DirectBankTransfer",
  },
];
