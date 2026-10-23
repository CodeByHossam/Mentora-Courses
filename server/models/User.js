const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=200";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    accountType: {
      type: String,
      enum: ["free", "paid"],
      default: "paid",
      comment:
        "Account type for instructors - free gets 100k credits, paid gets 100 welcome bonus",
    },
    avatar: {
      type: String,
      default: DEFAULT_AVATAR,
    },
    bio: {
      type: String,
      default: "",
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    createdCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    // 🔗 RELATIONSHIP ARRAYS - Added for proper data linking
    liveSessions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LiveSession",
      },
    ],

    tests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
      },
    ],

    Comment: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],

    certificates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Certificate",
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Terms and Conditions acceptance
    termsAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
      default: null,
    },

    // 🔹 New section: Instructor Profile
    instructorProfile: {
      field: { type: String, trim: true },
      universityCertificate: { type: String }, // Cloudinary/file URL
      experienceCertificates: [{ type: String }], // array of files
      additionalInfo: { type: String }, // optional notes
    },

    // 🔹 Payment Details (separate from instructor profile)
    paymentDetails: {
      // Bank Details for Payment
      bankDetails: {
        bankName: {
          type: String,
          trim: true,
          default: "",
        },
        accountNumber: {
          type: String,
          trim: true,
          default: "",
        },
        accountHolder: {
          type: String,
          trim: true,
          default: "",
        },
        swift: {
          type: String,
          trim: true,
          default: "",
        },
        iban: {
          type: String,
          trim: true,
          default: "",
        },
        routingNumber: {
          type: String,
          trim: true,
          default: "",
        },
        branchCode: {
          type: String,
          trim: true,
          default: "",
        },
      },

      // Payment Preferences
      paymentPreferences: {
        preferredMethod: {
          type: String,
          enum: ["bank_transfer", "stripe", "paypal"],
          default: "bank_transfer",
        },
        minimumPayoutAmount: {
          type: Number,
          default: 50,
          min: [0, "Minimum payout amount cannot be negative"],
        },
        payoutFrequency: {
          type: String,
          enum: ["weekly", "monthly", "quarterly"],
          default: "monthly",
        },
        autoPayout: {
          type: Boolean,
          default: false,
        },
      },

      // Payment History Summary
      paymentSummary: {
        totalEarnings: {
          type: Number,
          default: 0,
          min: [0, "Total earnings cannot be negative"],
        },
        totalPayouts: {
          type: Number,
          default: 0,
          min: [0, "Total payouts cannot be negative"],
        },
        pendingAmount: {
          type: Number,
          default: 0,
          min: [0, "Pending amount cannot be negative"],
        },
        lastPayoutDate: {
          type: Date,
          default: null,
        },
      },

      // Verification Status
      isVerified: {
        type: Boolean,
        default: false,
      },

      verificationNotes: {
        type: String,
        default: "",
      },
    },

    // 🔹 Payment-related fields
    isFreeAccount: {
      type: Boolean,
      default: true,
    },

    // 🔹 Enhanced Billing System
    billingInfo: {
      // Total amount owed by user
      totalBills: {
        type: Number,
        default: 0,
        min: [0, "Total bills cannot be negative"],
      },

      // Credits available to user
      credits: {
        type: Number,
        default: 0,
        min: [0, "Credits cannot be negative"],
      },

      // Variance (credits - totalBills)
      variance: {
        type: Number,
        default: 0,
      },

      // Account creation date for annual fee calculation
      accountCreatedAt: {
        type: Date,
        default: Date.now,
      },

      // Last annual fee billing date
      lastAnnualBilling: {
        type: Date,
        default: null,
      },

      // Account status based on billing
      accountStatus: {
        type: String,
        enum: ["active", "suspended", "deactivated"],
        default: "active",
      },

      // Deactivation reason
      deactivationReason: {
        type: String,
        default: null,
      },
    },

    bills: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
          min: [0, "Amount cannot be negative"],
        },
        status: {
          type: String,
          enum: ["pending", "paid", "overdue", "cancelled"],
          default: "pending",
        },
        dueDate: {
          type: Date,
          required: true,
        },
        paidAt: {
          type: Date,
          default: null,
        },
        paymentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Payment",
          default: null,
        },
        // Enhanced bill tracking
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          default: null,
        },
        instructorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        adminProfitRatio: {
          type: Number,
          default: 0,
        },
        billType: {
          type: String,
          enum: ["course_payment", "annual_fee", "commission", "admin_fee"],
          default: "course_payment",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate and update billing variance
UserSchema.methods.updateBillingVariance = function () {
  this.billingInfo.variance =
    this.billingInfo.credits - this.billingInfo.totalBills;
  return this.billingInfo.variance;
};

// Add a bill to user account
UserSchema.methods.addBill = function (billData) {
  this.bills.push(billData);
  this.billingInfo.totalBills += billData.amount;
  this.updateBillingVariance();
  return this.save();
};

// Add credits to user account
UserSchema.methods.addCredits = function (amount) {
  this.billingInfo.credits += amount;
  this.updateBillingVariance();
  return this.save();
};

// Check if annual billing is due
UserSchema.methods.isAnnualBillingDue = function () {
  const now = new Date();
  const accountAge = now - this.billingInfo.accountCreatedAt;
  const oneYear = 365 * 24 * 60 * 60 * 1000; // milliseconds in a year

  if (accountAge < oneYear) return false;

  if (!this.billingInfo.lastAnnualBilling) return true;

  const timeSinceLastBilling = now - this.billingInfo.lastAnnualBilling;
  return timeSinceLastBilling >= oneYear;
};
//default avatar
UserSchema.pre("save", function (next) {
  if (!this.avatar) {
    this.avatar = DEFAULT_AVATAR;
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
