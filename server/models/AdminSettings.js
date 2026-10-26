const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema(
  {
    // Payment Configuration
    paymentSettings: {
      // Annual fees for instructors
      instructorAnnualFee: {
        type: Number,
        default: 0,
        min: [0, "Instructor annual fee cannot be negative"],
      },

      // Admin fees for students
      studentAdminFee: {
        type: Number,
        default: 0,
        min: [0, "Student admin fee cannot be negative"],
      },

      // Global deduction percentage (applied on all payments)
      globalDeductionPercentage: {
        type: Number,
        default: 0,
        min: [0, "Global deduction percentage cannot be negative"],
        max: [100, "Global deduction percentage cannot exceed 100%"],
      },

      // Payment gateway settings
      stripeEnabled: {
        type: Boolean,
        default: false,
      },

      paypalEnabled: {
        type: Boolean,
        default: false,
      },

      directTransferEnabled: {
        type: Boolean,
        default: true,
      },

      // Enabled payment methods (scalable registry)
      enabledMethods: {
        type: [String],
        default: ["direct_transfer"],
      },

      // Minimum payment amounts
      minimumPaymentAmount: {
        type: Number,
        default: 1,
        min: [0, "Minimum payment amount cannot be negative"],
      },

      // Currency settings
      currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "CAD", "AUD"],
      },

      // Auto-enrollment settings
      autoEnrollOnCardPayment: {
        type: Boolean,
        default: true,
      },

      autoEnrollOnPaypalPayment: {
        type: Boolean,
        default: true,
      },

      // Direct transfer requires admin approval
      requireAdminApprovalForDirectTransfer: {
        type: Boolean,
        default: true,
      },

      // Credit limits for account deactivation
      creditLimits: {
        student: {
          type: Number,
          default: -200, // Students can go $200 in debt
          max: [0, "Credit limit cannot be positive"],
        },
        instructor: {
          type: Number,
          default: -500, // Instructors can go $500 in debt
          max: [0, "Credit limit cannot be positive"],
        },
        admin: {
          type: Number,
          default: -1000, // Admins can go $1000 in debt
          max: [0, "Credit limit cannot be positive"],
        },
      },
    },

    // System-wide settings
    systemSettings: {
      siteName: {
        type: String,
        default: "Mentora",
      },

      supportEmail: {
        type: String,
        default: "support@mentora.com",
      },

      maintenanceMode: {
        type: Boolean,
        default: false,
      },
    },

    // Notification settings
    notificationSettings: {
      emailNotificationsEnabled: {
        type: Boolean,
        default: true,
      },

      paymentNotificationsEnabled: {
        type: Boolean,
        default: true,
      },

      enrollmentNotificationsEnabled: {
        type: Boolean,
        default: true,
      },
    },

    // Last updated by admin
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Ensure only one settings document exists
adminSettingsSchema.index({}, { unique: true });

// Static method to get or create settings
adminSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();

  if (!settings) {
    settings = await this.create({});
  }

  return settings;
};

// Static method to update settings
adminSettingsSchema.statics.updateSettings = async function (updates, adminId) {
  let settings = await this.findOne();

  if (!settings) {
    settings = new this(updates);
  } else {
    Object.assign(settings, updates);
  }

  settings.lastUpdatedBy = adminId;
  return await settings.save();
};

module.exports =
  mongoose.models.AdminSettings ||
  mongoose.model("AdminSettings", adminSettingsSchema);
