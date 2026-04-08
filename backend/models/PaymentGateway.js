'use strict';

const mongoose = require('mongoose');

const paymentGatewaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'both'],
      required: true
    },
    fee: {
      type: Number,
      default: 0,
      min: 0
    },
    feeType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    minAmount: {
      type: Number,
      default: 10,
      min: 0
    },
    maxAmount: {
      type: Number,
      default: 100000
    },
    isActive: {
      type: Boolean,
      default: true
    },
    processingTime: {
      type: String,
      default: 'Instant'
    },
    supportedCurrencies: {
      type: [String],
      default: ['USD']
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    displayName: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: null
    },
    description: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

paymentGatewaySchema.index({ isActive: 1, type: 1 });

module.exports = mongoose.model('PaymentGateway', paymentGatewaySchema);
