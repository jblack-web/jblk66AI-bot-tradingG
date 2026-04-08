'use strict';

const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'singleton',
      unique: true
    },
    withdrawalMode: {
      type: String,
      enum: ['manual', 'auto'],
      default: 'manual'
    },
    autoWithdrawalMinAccountAge: {
      type: Number,
      default: 30,
      comment: 'Minimum account age in days for auto-withdrawal'
    },
    autoWithdrawalRequireKyc: {
      type: Boolean,
      default: true
    },
    autoWithdrawalMaxAmount: {
      type: Number,
      default: 1000
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    tradingEnabled: {
      type: Boolean,
      default: true
    },
    maintenanceMessage: {
      type: String,
      default: 'Platform is under maintenance. Please try again later.'
    },
    depositEnabled: {
      type: Boolean,
      default: true
    },
    withdrawalEnabled: {
      type: Boolean,
      default: true
    },
    registrationEnabled: {
      type: Boolean,
      default: true
    },
    referralProgramEnabled: {
      type: Boolean,
      default: true
    },
    defaultReferralBonus: {
      type: Number,
      default: 10,
      comment: 'Percentage of referred user first deposit'
    },
    minDepositAmount: {
      type: Number,
      default: 100
    },
    minWithdrawalAmount: {
      type: Number,
      default: 50
    },
    maxWithdrawalPerDay: {
      type: Number,
      default: 10000
    },
    platformFee: {
      type: Number,
      default: 1.5,
      comment: 'Trading fee percentage'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
