const mongoose = require('mongoose');

const userTierPackageSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, enum: ['free', 'basic', 'advanced', 'premium'] },
  displayName: String,
  description: String,
  color: String,
  icon: String,
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },

  // Pricing
  monthlyPrice: { type: Number, default: 0 },
  yearlyPrice: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  trialDays: { type: Number, default: 0 },

  // Trading limits
  maxDailyTrades: { type: Number, default: 5 },
  maxTradingPairs: { type: Number, default: 5 },
  maxLeverage: { type: Number, default: 1 },
  automatedTradesPerDay: { type: Number, default: 0 },
  annualInterestRate: { type: Number, default: 0 },
  referralBonusPercent: { type: Number, default: 5 },
  promoCodes: { type: Number, default: 1 },

  // Feature flags
  features: {
    futuresTradingAllowed: { type: Boolean, default: false },
    advancedAnalyticsAccess: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    dedicatedAccountManager: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    customTradingRules: { type: Boolean, default: false },
    portfolioRebalancing: { type: Boolean, default: false },
    backtestingAccess: { type: Boolean, default: false },
    multiAccountManagement: { type: Boolean, default: false },
    whiteLabelSolutions: { type: Boolean, default: false },
    botOptimizationAccess: { type: Boolean, default: false },
    aiSignalsAccess: { type: Boolean, default: false },
    riskManagementSuite: { type: Boolean, default: false },
    templateLibraryAccess: { type: Boolean, default: true },
    advancedTemplates: { type: Boolean, default: false },
  },

  // Benefits & limitations text
  benefits: [String],
  limitations: [String],

  // Support
  supportLevel: { type: String, enum: ['email', 'priority_email', 'priority_email_chat', '24_7_all_channels'], default: 'email' },
  responseTime: { type: String, default: '48 hours' },
}, { timestamps: true });

module.exports = mongoose.model('UserTierPackage', userTierPackageSchema);
