'use strict';

const mongoose = require('mongoose');

const userTierPackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ['basic', 'advanced', 'premium'],
      required: true,
      unique: true
    },
    displayName: {
      type: String,
      required: true
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0
    },
    yearlyPrice: {
      type: Number,
      required: true,
      min: 0
    },
    maxDailyTrades: {
      type: Number,
      required: true
    },
    tradingPairs: {
      type: [String],
      default: []
    },
    futuresTradingAllowed: {
      type: Boolean,
      default: false
    },
    maxLeverage: {
      type: Number,
      default: 1
    },
    advancedAnalyticsAccess: {
      type: Boolean,
      default: false
    },
    dedicatedAccountManager: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    automatedTradingPerDay: {
      type: Number,
      default: 0
    },
    referralBonusPercentage: {
      type: Number,
      default: 10
    },
    annualInterestRate: {
      type: Number,
      default: 0,
      comment: 'Percentage annual interest on balance'
    },
    minDeposit: {
      type: Number,
      default: 100
    },
    maxWithdrawalPerDay: {
      type: Number,
      default: 5000
    },
    optionsTradingAllowed: {
      type: Boolean,
      default: false
    },
    goldTradingAllowed: {
      type: Boolean,
      default: true
    },
    features: {
      type: [String],
      default: []
    },
    limitations: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    color: {
      type: String,
      default: '#007bff'
    },
    icon: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

userTierPackageSchema.index({ name: 1 });
userTierPackageSchema.index({ isActive: 1 });

module.exports = mongoose.model('UserTierPackage', userTierPackageSchema);
