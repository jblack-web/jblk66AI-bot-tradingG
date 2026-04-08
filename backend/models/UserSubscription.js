const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tier: { type: mongoose.Schema.Types.ObjectId, ref: 'UserTierPackage', required: true },
  tierSlug: { type: String, enum: ['free', 'basic', 'advanced', 'premium'] },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  status: { type: String, enum: ['active', 'expired', 'cancelled', 'suspended', 'trial'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  nextBillingDate: Date,
  autoRenew: { type: Boolean, default: true },
  amountPaid: Number,
  promoCodeUsed: String,
  discountApplied: Number,
  paymentMethod: String,

  // Usage tracking
  dailyTradesUsed: { type: Number, default: 0 },
  monthlyTradesUsed: { type: Number, default: 0 },
  lastTradeReset: { type: Date, default: Date.now },
  lastMonthlyReset: { type: Date, default: Date.now },
  withdrawalsMade: { type: Number, default: 0 },
  signalsUsed: { type: Number, default: 0 },

  // Tier change history
  changeHistory: [{
    fromTier: String,
    toTier: String,
    changedAt: Date,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
