'use strict';

const mongoose = require('mongoose');

const depositTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    method: {
      type: String,
      required: true,
      enum: ['stripe', 'bank_transfer', 'crypto', 'wire', 'paypal', 'card']
    },
    fee: {
      type: Number,
      default: 0
    },
    netAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    promoCode: {
      type: String,
      default: null
    },
    promoCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PromoCode',
      default: null
    },
    bonusAmount: {
      type: Number,
      default: 0
    },
    referralBonus: {
      type: Number,
      default: 0
    },
    stripePaymentIntentId: {
      type: String,
      default: null
    },
    stripeClientSecret: {
      type: String,
      default: null,
      select: false
    },
    transactionReference: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    failedReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

depositTransactionSchema.index({ userId: 1, status: 1 });
depositTransactionSchema.index({ createdAt: -1 });
depositTransactionSchema.index({ stripePaymentIntentId: 1 });

module.exports = mongoose.model('DepositTransaction', depositTransactionSchema);
