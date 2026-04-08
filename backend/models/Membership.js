const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tier: {
      type: String,
      enum: ['free', 'basic', 'advanced', 'premium'],
      default: 'free',
    },
    miningPower: { type: Number },
    dailyEarningsMin: { type: Number },
    dailyEarningsMax: { type: Number },
    price: { type: Number },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    autoRenewal: { type: Boolean, default: false },
    promoCode: { type: String },
    discountApplied: { type: Number },
    upgradeSource: { type: String },
    paymentMethod: { type: String },
    trialStartDate: { type: Date },
    trialEndDate: { type: Date },
    trialExtensionCount: { type: Number, default: 0 },
    conversionStatus: {
      type: String,
      enum: ['trial', 'converted', 'expired', 'cancelled'],
    },
  },
  { timestamps: true }
);

membershipSchema.statics.getTierConfig = function (tier) {
  const configs = {
    free: {
      miningPower: 10,
      dailyEarningsMin: 1,
      dailyEarningsMax: 3,
      price: 0,
      trialDays: 7,
    },
    basic: {
      miningPower: 50,
      dailyEarningsMin: 5,
      dailyEarningsMax: 15,
      price: 9.99,
    },
    advanced: {
      miningPower: 200,
      dailyEarningsMin: 30,
      dailyEarningsMax: 75,
      price: 49.99,
    },
    premium: {
      miningPower: 500,
      dailyEarningsMin: 150,
      dailyEarningsMax: 375,
      price: 199.99,
    },
  };
  return configs[tier] || null;
};

module.exports = mongoose.model('Membership', membershipSchema);
