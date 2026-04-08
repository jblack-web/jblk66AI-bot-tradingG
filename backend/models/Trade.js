'use strict';

const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['spot', 'options', 'futures', 'gold'],
      required: true
    },
    asset: {
      type: String,
      required: true,
      uppercase: true
    },
    direction: {
      type: String,
      enum: ['buy', 'sell'],
      required: true
    },
    entryPrice: {
      type: Number,
      required: true,
      min: 0
    },
    exitPrice: {
      type: Number,
      default: null
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    pnl: {
      type: Number,
      default: 0
    },
    pnlPercentage: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'cancelled'],
      default: 'open'
    },
    strategy: {
      type: String,
      enum: ['manual', 'momentum', 'meanReversion', 'trendFollowing', 'aiSignal'],
      default: 'manual'
    },
    stopLoss: {
      type: Number,
      default: null
    },
    takeProfit: {
      type: Number,
      default: null
    },
    fees: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: null,
      maxlength: 500
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

tradeSchema.index({ userId: 1, status: 1 });
tradeSchema.index({ userId: 1, type: 1 });
tradeSchema.index({ openedAt: -1 });

module.exports = mongoose.model('Trade', tradeSchema);
