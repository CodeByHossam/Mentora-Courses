/**
 * Payment method registry.
 *
 * Each entry: { id, enabled, initiate(payment, ctx), confirm?(payment, payload), handleWebhook?(req) }
 * Adding a future method = add a module here + register in PAYMENT_METHODS + enable in AdminSettings.
 */
const directTransfer = require("./directTransfer");

const PAYMENT_METHODS = {
  direct_transfer: directTransfer,
};

function getMethod(id) {
  return PAYMENT_METHODS[id] || null;
}

function listMethods() {
  return Object.keys(PAYMENT_METHODS);
}

module.exports = { PAYMENT_METHODS, getMethod, listMethods };
