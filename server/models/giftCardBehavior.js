module.exports = function (schema) {
// 🧮 VIRTUAL PROPERTIES
schema.virtual('remainingAmount').get(function() {
  const totalUsed = this.usageHistory.reduce((sum, usage) => sum + usage.usedAmount, 0);
  return Math.max(0, this.originalAmount - totalUsed);
});

schema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

schema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

schema.virtual('usagePercentage').get(function() {
  if (this.originalAmount === 0) return 100;
  const totalUsed = this.usageHistory.reduce((sum, usage) => sum + usage.usedAmount, 0);
  return Math.round((totalUsed / this.originalAmount) * 100);
});

// 🔧 INSTANCE METHODS
schema.methods.generateCardNumber = function() {
  // Generate a 16-digit card number
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return timestamp + random;
};

schema.methods.useGiftCard = function(amount, usedFor, relatedTransaction = null) {
  if (!this.isActive || this.isExpired || this.isRedeemed) {
    throw new Error('Gift card is not available for use');
  }
  
  const remaining = this.remainingAmount;
  if (amount > remaining) {
    throw new Error(`Insufficient gift card balance. Available: $${remaining}`);
  }
  
  // Add usage record
  this.usageHistory.push({
    usedAmount: amount,
    usedFor,
    relatedTransaction,
    remainingBalance: remaining - amount
  });
  
  // Update amount (current balance)
  this.amount = remaining - amount;
  
  // Mark as redeemed and inactive if fully used
  if (this.amount === 0) {
    this.isRedeemed = true;
    this.isActive = false; // Also mark as inactive
  }
  
  return this.save();
};

schema.methods.deactivate = function(reason = 'Deactivated by admin') {
  this.isActive = false;
  this.adminNotes = (this.adminNotes || '') + `\n${new Date().toISOString()}: ${reason}`;
  return this.save();
};

schema.methods.extend = function(newExpiryDate) {
  if (new Date(newExpiryDate) <= new Date()) {
    throw new Error('New expiry date must be in the future');
  }
  this.expiryDate = newExpiryDate;
  return this.save();
};

// 🔄 PRE-SAVE MIDDLEWARE
schema.pre('save', function(next) {
  // Auto-deactivate if expired
  if (this.isExpired && this.isActive) {
    this.isActive = false;
  }
  
  // Validate expiry date
  if (this.expiryDate <= this.issuedDate) {
    return next(new Error('Expiry date must be after issued date'));
  }
  
  next();
});
};
