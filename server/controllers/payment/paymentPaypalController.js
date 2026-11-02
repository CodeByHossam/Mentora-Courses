// PayPal payment confirmation. Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const { sanitizeHtml, sanitizeText, sanitizeObjectId, sanitizeNumber } = require("../../utils/sanitizer");
const { autoEnrollStudent, processInstructorCommission, finalizeEnrollmentAndBills } = require("./paymentHelpers");

// @desc    Confirm PayPal payment (idempotent, robust)
// @route   POST /api/payments/paypal/confirm
// @access  Private
const confirmPayPalPayment = asyncHandler(async (req, res) => {
  // Inputs: prefer orderId; paymentId optional for backward compatibility
  const orderId = sanitizeText(req.body.orderId, 50);
  const paymentIdOptional = req.body.paymentId
    ? sanitizeObjectId(req.body.paymentId)
    : null;

  if (!orderId) {
    res.status(400);
    throw new Error("Order ID is required");
  }

  // Load PayPal order state first
  let order;
  try {
    const getReq = new paypal.orders.OrdersGetRequest(orderId);
    order = await paypalClient.execute(getReq);
  } catch (err) {
    logger.error("PayPal OrdersGetRequest failed:", err?.result || err);
    res.status(404);
    throw new Error("PayPal order not found");
  }

  const orderStatus = order?.result?.status;
  const purchaseUnit = order?.result?.purchase_units?.[0];
  const existingCaptureId = purchaseUnit?.payments?.captures?.[0]?.id;

  // Find our payment document by paypalOrderId (preferred) or provided paymentId
  let payment = null;
  if (paymentIdOptional) {
    payment = await Payment.findById(paymentIdOptional)
      .populate("userId", "name email")
      .populate("course", "title price");
  }
  if (!payment) {
    payment = await Payment.findOne({ paypalOrderId: orderId })
      .populate("userId", "name email")
      .populate("course", "title price");
  }
  if (!payment) {
    res.status(404);
    throw new Error("Local payment record not found");
  }
  if (payment.userId._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Unauthorized to confirm this payment");
  }

  // Idempotent: if already paid, return success
  if (payment.status === "paid") {
    return res.status(200).json({
      success: true,
      message: "PayPal payment already confirmed",
      data: { payment, enrolled: true },
    });
  }

  // If order already COMPLETED, skip capture and finalize locally
  if (orderStatus === "COMPLETED") {
    payment.status = "paid";
    payment.paidAt = new Date();
    if (existingCaptureId) payment.paypalPaymentId = existingCaptureId;
    payment.paymentGatewayResponse = order.result;
    await payment.save();

    // Authoritative finalization
    await payment.completePayment();

    // Auto-enroll after completion
    let enrollmentResult = null;
    if (payment.course) {
      enrollmentResult = await autoEnrollStudent(
        payment.userId._id || payment.userId,
        payment.course._id || payment.course,
        payment._id
      );
    }

    return res.status(200).json({
      success: true,
      message: "PayPal order already completed; confirmed locally",
      data: { payment, finalizedBy: "completePayment", enrollment: enrollmentResult },
    });
  }

  // Only APPROVED orders can be captured
  if (orderStatus !== "APPROVED") {
    res.status(409);
    throw new Error(`Order is not in APPROVED state (current: ${orderStatus})`);
  }

  // Capture now
  try {
    const capReq = new paypal.orders.OrdersCaptureRequest(orderId);
    capReq.requestBody({});
    const capture = await paypalClient.execute(capReq);

    const capStatus = capture?.result?.status;
    const captureId =
      capture?.result?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const payerId = capture?.result?.payer?.payer_id;

    if (capStatus === "COMPLETED") {
      // Update local payment
      payment.status = "paid";
      payment.paidAt = new Date();
      if (captureId) payment.paypalPaymentId = captureId;
      if (payerId) payment.paypalPayerId = payerId;
      payment.paymentGatewayResponse = capture.result;
      await payment.save();

      // Authoritative finalization
      await payment.completePayment();

      // Auto-enroll after completion
      let enrollmentResult = null;
      if (payment.course) {
        enrollmentResult = await autoEnrollStudent(
          payment.userId._id || payment.userId,
          payment.course._id || payment.course,
          payment._id
        );
      }

      return res.status(200).json({
        success: true,
        message: "PayPal payment confirmed successfully",
        data: { payment, finalizedBy: "completePayment", enrollment: enrollmentResult },
      });
    }

    // Pending states (e.g., PENDING, PENDING_REVIEW)
    if (
      capStatus === "PENDING" ||
      capStatus === "PENDING_REVIEW" ||
      capStatus === "PAYER_ACTION_REQUIRED"
    ) {
      payment.status = "pending";
      payment.failureReason = undefined;
      payment.paymentGatewayResponse = capture.result;
      await payment.save();
      return res.status(202).json({
        success: true,
        message: `PayPal capture pending (${capStatus}). We will finalize once PayPal completes the review.`,
        data: { payment, pending: true },
      });
    }

    // Any other status treated as failure
    payment.status = "failed";
    payment.failureReason = `PayPal capture failed: ${capStatus}`;
    payment.paymentGatewayResponse = capture.result;
    await payment.save();
    return res.status(400).json({
      success: false,
      message: `PayPal capture failed with status: ${capStatus}`,
      data: { status: capStatus },
    });
  } catch (err) {
    // Deduplicate captures: if order is now COMPLETED, treat as success
    if (err?.statusCode === 422) {
      try {
        const getReq2 = new paypal.orders.OrdersGetRequest(orderId);
        const order2 = await paypalClient.execute(getReq2);
        if (order2?.result?.status === "COMPLETED") {
          const captureId2 =
            order2?.result?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
          payment.status = "paid";
          payment.paidAt = new Date();
          if (captureId2) payment.paypalPaymentId = captureId2;
          payment.paymentGatewayResponse = order2.result;
          await payment.save();
          await payment.completePayment();
          // Auto-enroll after completion
          let enrollmentResult = null;
          if (payment.course) {
            enrollmentResult = await autoEnrollStudent(
              payment.userId._id || payment.userId,
              payment.course._id || payment.course,
              payment._id
            );
          }
          return res.status(200).json({
            success: true,
            message: "PayPal order already captured; confirmed locally",
            data: { payment, finalizedBy: "completePayment", enrollment: enrollmentResult },
          });
        }
      } catch (_) {}
    }
    logger.error("PayPal capture error:", err?.result || err);
    res.status(500);
    throw new Error("Failed to confirm PayPal payment");
  }
});

/**
 * Finalize enrollment and update user bills idempotently
 */

module.exports = {
  confirmPayPalPayment
};
