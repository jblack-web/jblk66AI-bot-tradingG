'use strict';

const mongoose = require('mongoose');

const referralBonusSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0
    },
    bonusPercentage: {
      type: Number,
      default: 10
    },
    bonusAmount: {
      type: Number,
      required: true,
      min: 0
    },
    bonusType: {
      type: String,
      enum: ['deposit_referral', 'trade_referral', 'subscription_referral'],
      default: 'deposit_referral'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending'
    },
    paidAt: {
      type: Date,
      default: null
    },
    depositTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DepositTransaction',
      default: null
    }
  },
  { timestamps: true }
);

referralBonusSchema.index({ referrerId: 1, status: 1 });
referralBonusSchema.index({ referredUserId: 1 });

module.exports = mongoose.model('ReferralBonus', referralBonusSchema);
