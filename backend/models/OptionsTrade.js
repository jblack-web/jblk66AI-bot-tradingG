'use strict';

const mongoose = require('mongoose');

const optionsTradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    asset: {
      type: String,
      required: true,
      uppercase: true,
      enum: ['BTC', 'ETH', 'BNB', 'SOL', 'GOLD', 'XAUUSD', 'SPY', 'AAPL', 'TSLA', 'NVDA']
    },
    optionType: {
      type: String,
      enum: ['call', 'put'],
      required: true
    },
    strikePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0
    },
    expiryDate: {
      type: Date,
      required: true
    },
    premium: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    contractSize: {
      type: Number,
      default: 1
    },
    totalCost: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'exercised', 'closed'],
      default: 'active'
    },
    pnl: {
      type: Number,
      default: 0
    },
    pnlPercentage: {
      type: Number,
      default: 0
    },
    greeks: {
      delta: { type: Number, default: 0 },
      gamma: { type: Number, default: 0 },
      theta: { type: Number, default: 0 },
      vega: { type: Number, default: 0 },
      rho: { type: Number, default: 0 }
    },
    impliedVolatility: {
      type: Number,
      default: 0
    },
    riskFreeRate: {
      type: Number,
      default: 0.05
    },
    exitPrice: {
      type: Number,
      default: null
    },
    exitPremium: {
      type: Number,
      default: null
    },
    openedAt: {
      type: Date,
      default: Date.now
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

optionsTradeSchema.index({ userId: 1, status: 1 });
optionsTradeSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('OptionsTrade', optionsTradeSchema);
