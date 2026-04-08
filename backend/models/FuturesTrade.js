'use strict';

const mongoose = require('mongoose');

const futuresTradeSchema = new mongoose.Schema(
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
      enum: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XAUUSD', 'EURUSD', 'GBPUSD', 'XAGUSD']
    },
    direction: {
      type: String,
      enum: ['long', 'short'],
      required: true
    },
    entryPrice: {
      type: Number,
      required: true,
      min: 0
    },
    markPrice: {
      type: Number,
      default: null
    },
    liquidationPrice: {
      type: Number,
      default: null
    },
    size: {
      type: Number,
      required: true,
      min: 0
    },
    leverage: {
      type: Number,
      required: true,
      min: 1,
      max: 20
    },
    margin: {
      type: Number,
      required: true,
      min: 0
    },
    unrealizedPnl: {
      type: Number,
      default: 0
    },
    realizedPnl: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'liquidated'],
      default: 'open'
    },
    stopLoss: {
      type: Number,
      default: null
    },
    takeProfit: {
      type: Number,
      default: null
    },
    fundingRate: {
      type: Number,
      default: 0
    },
    fundingFeeAccumulated: {
      type: Number,
      default: 0
    },
    exitPrice: {
      type: Number,
      default: null
    },
    fees: {
      type: Number,
      default: 0
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

futuresTradeSchema.virtual('marginRatio').get(function () {
  if (!this.margin || this.margin === 0) return 0;
  return ((this.unrealizedPnl + this.margin) / this.margin) * 100;
});

futuresTradeSchema.index({ userId: 1, status: 1 });
futuresTradeSchema.index({ asset: 1, status: 1 });

module.exports = mongoose.model('FuturesTrade', futuresTradeSchema);
