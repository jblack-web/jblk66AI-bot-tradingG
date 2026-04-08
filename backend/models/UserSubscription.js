'use strict';

const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema({
  amount: Number,
  date: { type: Date, default: Date.now },
  method: String,
  transactionId: String
});

const tierChangeSchema = new mongoose.Schema({
  fromTier: String,
  toTier: String,
  changedAt: { type: Date, default: Date.now },
  reason: String
});

const userSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    tierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserTierPackage',
      required: true
    },
    tierName: {
      type: String,
      enum: ['basic', 'advanced', 'premium'],
      required: true
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'free'],
      default: 'monthly'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'active'
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    price: {
      type: Number,
      default: 0
    },
    paymentHistory: [paymentRecordSchema],
    tierChanges: [tierChangeSchema],
    cancelledAt: {
      type: Date,
      default: null
    },
    cancelReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

userSubscriptionSchema.methods.isActive = function () {
  return this.status === 'active' && new Date() < new Date(this.endDate);
};

userSubscriptionSchema.index({ userId: 1 });
userSubscriptionSchema.index({ status: 1, endDate: 1 });

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
