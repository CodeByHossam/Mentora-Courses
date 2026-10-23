/**
 * Fix Admin Billing Account Data
 * 
 * This script recalculates the admin billing account data based on actual transactions
 */

const mongoose = require('mongoose');
require('dotenv').config();

const AdminBillingAccount = require('../models/AdminBillingAccount');
const InstructorBillingAccount = require('../models/InstructorBillingAccount');
const BillingTransaction = require('../models/BillingTransaction');
const Payment = require('../models/Payment');

async function fixAdminBillingData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get admin billing account
    const adminAccount = await AdminBillingAccount.findOne();
    
    if (!adminAccount) {
      console.log('❌ No admin billing account found');
      return;
    }

    console.log('\n📊 Current Admin Account Data:');
    console.log(`   Total Revenue: $${adminAccount.totalRevenue}`);
    console.log(`   Total Instructor Payouts: $${adminAccount.totalInstructorPayouts}`);
    console.log(`   Platform Balance: $${adminAccount.platformBalance}`);
    console.log(`   Total Transactions: ${adminAccount.statistics?.totalTransactions || 0}`);

    // Calculate actual total instructor payouts from instructor accounts
    const instructorAccounts = await InstructorBillingAccount.find();
    const actualTotalPayouts = instructorAccounts.reduce((sum, account) => {
      return sum + (account.totalPayoutsReceived || 0);
    }, 0);

    console.log('\n🔍 Calculated from Instructor Accounts:');
    console.log(`   Actual Total Payouts: $${actualTotalPayouts}`);

    // Calculate total revenue from completed payments
    const completedPayments = await Payment.find({ status: 'completed' });
    const actualTotalRevenue = completedPayments.reduce((sum, payment) => {
      return sum + (payment.adminFee || 0);
    }, 0);

    console.log(`   Actual Total Revenue (from payments): $${actualTotalRevenue}`);

    // Count transactions
    const transactionCount = await BillingTransaction.countDocuments();
    console.log(`   Actual Transaction Count: ${transactionCount}`);

    // Update admin account
    console.log('\n🔧 Updating Admin Account...');
    adminAccount.totalInstructorPayouts = actualTotalPayouts;
    adminAccount.totalRevenue = actualTotalRevenue;
    adminAccount.platformBalance = adminAccount.calculateNetProfit();
    adminAccount.statistics.totalTransactions = transactionCount;
    
    await adminAccount.save();

    console.log('\n✅ Admin Account Updated:');
    console.log(`   Total Revenue: $${adminAccount.totalRevenue}`);
    console.log(`   Total Instructor Payouts: $${adminAccount.totalInstructorPayouts}`);
    console.log(`   Platform Balance: $${adminAccount.platformBalance}`);
    console.log(`   Total Transactions: ${adminAccount.statistics.totalTransactions}`);

    console.log('\n✨ Fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAdminBillingData();
