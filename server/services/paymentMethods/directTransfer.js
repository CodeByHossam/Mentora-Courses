// Minimal reference implementation for the direct_transfer payment method.
// Real handling lives in paymentController's direct branch; this module documents
// the contract future methods must follow.
module.exports = {
  id: "direct_transfer",
  enabled: true,
  async initiate(payment, ctx) {
    // Direct transfer requires no gateway call; controller returns bank details.
    return { paymentId: payment._id, method: "direct_transfer" };
  },
  async confirm(payment, payload) {
    return { success: true };
  },
};
