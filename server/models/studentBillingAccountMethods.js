const mongoose = require("mongoose");
const logger = require("../utils/logger");

module.exports = function (schema) {
/**
 * getAvailableGiftCards - Get unused gift cards
 * Returns array of unused, non-expired gift cards
 */
schema.methods.getAvailableGiftCards = function () {
  const now = new Date();
  return this.giftCards.filter(card => 
    !card.isUsed && 
    (!card.expiryDate || card.expiryDate > now)
  );
};

/**
 * getGiftCardForCourse - Check if student has gift card for specific course
 */
schema.methods.getGiftCardForCourse = function (courseId) {
  const now = new Date();
  return this.giftCards.find(card => 
    card.courseId.toString() === courseId.toString() &&
    !card.isUsed && 
    (!card.expiryDate || card.expiryDate > now)
  );
};

/**
 * calculateCurrentBalance - SIMPLIFIED
 * Students don't have balance, only track purchases and annual fees
 */
schema.methods.calculateCurrentBalance = function () {
  // Students don't maintain a balance in the simplified system
  // They pay for courses directly, no credits or outstanding amounts
  return 0;
};

/**
 * addCoursePurchase - SIMPLIFIED
 * Just add to permanent box and update statistics
 */
schema.methods.addCoursePurchase = function (purchaseData = {}) {
  const now = new Date();
  const prevLastPurchase = this.statistics.lastPurchaseDate;

  logger.info(`📊 [STUDENT] Adding purchase - Amount: $${purchaseData.purchaseAmount || 0}`);
  logger.info(`   Before: totalCoursePurchases=$${this.totalCoursePurchases}`);

  // Add to purchase history
  this.coursePurchases.push(Object.assign({ purchaseDate: now }, purchaseData));
  
  // 📦 ADD TO PERMANENT BOX
  this.totalCoursePurchases += (purchaseData.purchaseAmount || 0);
  
  logger.info(`   After: totalCoursePurchases=$${this.totalCoursePurchases}`);
  
  // Update statistics
  this.statistics.totalCoursesEnrolled = (this.statistics.totalCoursesEnrolled || 0) + 1;

  // Monthly/yearly spending
  if (!prevLastPurchase || prevLastPurchase.getMonth() !== now.getMonth() || prevLastPurchase.getFullYear() !== now.getFullYear()) {
    this.statistics.monthlySpending = 0;
  }
  if (!prevLastPurchase || prevLastPurchase.getFullYear() !== now.getFullYear()) {
    this.statistics.yearlySpending = 0;
  }
  this.statistics.monthlySpending += (purchaseData.purchaseAmount || 0);
  this.statistics.yearlySpending += (purchaseData.purchaseAmount || 0);
  this.statistics.lastPurchaseDate = now;

  this.recalculateAll();
};

/**
 * addAnnualFee:
 *  - Adds annual fee to outstanding admin fees
 */
schema.methods.addAnnualFee = function (annualFeeAmount, year = new Date().getFullYear()) {
  // Ensure annualFeeAmount is a valid number
  const feeAmount = Number(annualFeeAmount) || 0;
  
  this.annualFees = (this.annualFees || 0) + feeAmount;
  
  // Log the annual fee transaction
  this.creditTransactions.push({
    type: 'deduction', // Use valid enum value
    amount: feeAmount,
    description: `Annual fee for ${year}`,
    date: new Date(),
    balanceBefore: this.currentBalance || 0,
    balanceAfter: (this.currentBalance || 0) - feeAmount
  });
  
  this.recalculateAll();
};

/**
 * payAnnualFee:
 *  - Pays outstanding annual fees via external payment only (bank transfer with receipt)
 *  - No longer allows paying from internal balance for security and audit purposes
 */
schema.methods.payAnnualFee = function (paymentAmount, receiptUrl, description = 'Annual fee payment') {
  if (!receiptUrl) {
    throw new Error('Receipt is required for all fee payments');
  }
  
  const paidAmount = Math.min(paymentAmount, this.annualFees);
  
  this.annualFees -= paidAmount;
  this.totalAdminFeesPaid += paidAmount;
  
  // Record the payment with receipt
  this.feePayments = this.feePayments || [];
  this.feePayments.push({
    amount: paidAmount,
    paymentMethod: 'bank_transfer',
    receiptUrl,
    paidAt: new Date(),
    description: `${description} - $${paidAmount}`
  });
  
  this.recalculateAll();
  return paidAmount;
};


/**
 * addGiftAmount - SIMPLIFIED
 * Add to permanent gift box and history array
 */
schema.methods.addGiftAmount = function (amount, description, giftType = 'gift_card', issuedBy = null, customNote = null, expiryDate = null) {
  // 📦 ADD TO PERMANENT BOX
  this.totalGiftAmount += amount;
  
  // Add to history array
  this.giftAmount = this.giftAmount || [];
  this.giftAmount.push({
    amount,
    description,
    type: giftType,
    issuedBy,
    issuedAt: new Date(),
    expiryDate,
    isActive: true,
    customNote
  });

  this.recalculateAll();
  return this.giftAmount[this.giftAmount.length - 1];
};

/**
 * useGiftCard - Mark gift card as used
 */
schema.methods.useGiftCard = function (giftCardId) {
  const card = this.giftCards.find(c => c.giftCardId.toString() === giftCardId.toString());
  if (card) {
    card.isUsed = true;
    card.usedAt = new Date();
  }
  return card;
};


/**
 * requestRefund:
 *  - push refund request and return id. Validation should be handled by controller
 */
schema.methods.requestRefund = function (courseId, originalPaymentId, refundAmount, reason) {
  const refundRequest = {
    requestId: new mongoose.Types.ObjectId(),
    courseId,
    originalPaymentId,
    refundAmount,
    reason,
    status: "pending",
    requestDate: new Date()
  };

  this.refundRequests.push(refundRequest);
  return refundRequest.requestId;
};

/**
 * recalculateAll:
 *  - updates currentBalance, average spending, unique instructors and account age
 */
schema.methods.recalculateAll = function () {
  this.currentBalance = this.calculateCurrentBalance();

  if (this.statistics.totalCoursesEnrolled > 0) {
    this.statistics.averageSpendingPerCourse = this.totalCoursePurchases / this.statistics.totalCoursesEnrolled;
  }

  // unique instructors
  try {
    const uniqueInstructors = new Set((this.coursePurchases || []).map(p => p.instructorId ? p.instructorId.toString() : null).filter(Boolean));
    this.statistics.totalInstructorsSupported = uniqueInstructors.size;
  } catch (e) {
    this.statistics.totalInstructorsSupported = this.statistics.totalInstructorsSupported || 0;
  }

  // account age (days since first purchase)
  if ((this.coursePurchases || []).length > 0) {
    const firstPurchase = (this.coursePurchases || []).reduce((earliest, p) => {
      if (!earliest) return p;
      return new Date(p.purchaseDate) < new Date(earliest.purchaseDate) ? p : earliest;
    }, null);
    if (firstPurchase) {
      const daysDiff = Math.floor((new Date() - new Date(firstPurchase.purchaseDate)) / (1000 * 60 * 60 * 24));
      this.statistics.accountAge = daysDiff;
    }
  }

  // delinquent check
  if (this.currentBalance < -this.creditLimit) {
    this.status = "delinquent";
  } else if (this.status === "delinquent" && this.currentBalance >= -this.creditLimit) {
    this.status = "active";
  }
};
};
