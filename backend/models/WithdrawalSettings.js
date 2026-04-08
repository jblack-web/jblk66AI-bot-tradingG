const mongoose = require('mongoose');

const withdrawalSettingsSchema = new mongoose.Schema({
  // Global switch - manual or auto
  withdrawalMode: {
    type: String,
    enum: ['manual', 'auto'],
    default: 'manual',
  },

  // Auto withdrawal settings
  autoWithdrawalThreshold: { type: Number, default: 100 },
  autoWithdrawalMaxAmount: { type: Number, default: 10000 },
  autoWithdrawalMinAmount: { type: Number, default: 10 },
  autoWithdrawalCooldownHours: { type: Number, default: 24 },
  autoApprovedTiers: {
    type: [String],
    enum: ['free', 'basic', 'advanced', 'premium'],
    default: ['premium'],
  },

  // Manual approval settings
  requireAdminApproval: { type: Boolean, default: true },
  autoApproveBelow: { type: Number, default: 0 },
  maxPendingWithdrawals: { type: Number, default: 5 },

  // Fee settings
  withdrawalFeePercent: { type: Number, default: 1.5 },
  withdrawalFeeFixed: { type: Number, default: 2 },
  minWithdrawalAmount: { type: Number, default: 20 },
  maxWithdrawalAmount: { type: Number, default: 50000 },
  maxDailyWithdrawal: { type: Number, default: 10000 },
  maxMonthlyWithdrawal: { type: Number, default: 100000 },

  // Processing hours
  processingDays: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
  processingStartHour: { type: Number, default: 9 },
  processingEndHour: { type: Number, default: 17 },

  // Supported methods
  supportedMethods: {
    crypto: { type: Boolean, default: true },
    bankTransfer: { type: Boolean, default: true },
    paypal: { type: Boolean, default: false },
    card: { type: Boolean, default: false },
  },

  // KYC requirements
  requireKYC: { type: Boolean, default: true },
  kycLimitWithout: { type: Number, default: 500 },

  // Updated by admin
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('WithdrawalSettings', withdrawalSettingsSchema);
