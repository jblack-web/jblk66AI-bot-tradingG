'use strict';

const mongoose = require('mongoose');

const withdrawalTransactionSchema = new mongoose.Schema(
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
      enum: ['bank_transfer', 'crypto', 'wire', 'paypal', 'card']
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
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending'
    },
    destinationAddress: {
      type: String,
      default: null
    },
    destinationDetails: {
      accountName: { type: String, default: null },
      accountNumber: { type: String, default: null },
      bankName: { type: String, default: null },
      swiftCode: { type: String, default: null },
      routingNumber: { type: String, default: null },
      cryptoNetwork: { type: String, default: null },
      memo: { type: String, default: null }
    },
    approvalType: {
      type: String,
      enum: ['manual', 'auto'],
      default: 'manual'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: null
    },
    rejectReason: {
      type: String,
      default: null
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date,
      default: null
    },
    transactionHash: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

withdrawalTransactionSchema.index({ userId: 1, status: 1 });
withdrawalTransactionSchema.index({ status: 1, requestedAt: -1 });

module.exports = mongoose.model('WithdrawalTransaction', withdrawalTransactionSchema);
