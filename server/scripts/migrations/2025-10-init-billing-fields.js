/*
Migration: Initialize new billing fields and compute pendingEarnings
- Sets default commission fields on Payment
- Computes InstructorBillingAccount.pendingEarnings as sum of (instructorAmount - commissionPaidAmount) for completed payments per instructor
- Initializes previousCarryover to existing pendingEarnings (first run) if missing

Usage:
  NODE_ENV=development MONGODB_URI="mongodb://localhost:27017/mentora" node server/scripts/migrations/2025-10-init-billing-fields.js
*/

require("dotenv").config();
const mongoose = require("mongoose");

const Payment = require("../../models/Payment");
const InstructorBillingAccount = require("../../models/InstructorBillingAccount");
const Course = require("../../models/Course");

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(uri, { autoIndex: false });
  console.log("Connected to MongoDB");
}

async function backfillPaymentCommissionFields() {
  const res = await Payment.updateMany(
    {
      $or: [
        { commissionPaidAmount: { $exists: false } },
        { isCommissionSettled: { $exists: false } },
      ],
    },
    {
      $set: { commissionPaidAmount: 0, isCommissionSettled: false },
    },
  );
  console.log(`Payments backfilled commission fields: ${res.modifiedCount}`);
}

async function computeInstructorPendingEarnings() {
  const instructors = await InstructorBillingAccount.find(
    {},
    { instructorId: 1, pendingEarnings: 1, previousCarryover: 1 },
  );
  let updated = 0;
  for (const acc of instructors) {
    // Find all completed payments for courses taught by this instructor
    const payments = await Payment.find({ status: "completed" }).populate({
      path: "course",
      select: "instructor",
    });

    let pending = 0;
    for (const p of payments) {
      const courseInstructor = p.course?.instructor?.toString();
      if (
        courseInstructor &&
        courseInstructor === acc.instructorId.toString()
      ) {
        const total = Number(p.instructorAmount || 0);
        const paid = Number(p.commissionPaidAmount || 0);
        pending += Math.max(0, total - paid);
      }
    }

    const setOps = { pendingEarnings: pending };
    if (acc.previousCarryover == null) {
      setOps.previousCarryover = pending; // first-time baseline
    }
    await InstructorBillingAccount.updateOne(
      { _id: acc._id },
      { $set: setOps },
    );
    updated += 1;
  }
  console.log(`Instructor accounts updated with pendingEarnings: ${updated}`);
}

async function run() {
  try {
    await connect();
    await backfillPaymentCommissionFields();
    await computeInstructorPendingEarnings();
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
