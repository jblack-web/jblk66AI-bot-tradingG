'use strict';

const mongoose = require('mongoose');

const goldTradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tradeType: {
      type: String,
      enum: ['spot', 'futures', 'options'],
      required: true
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
      min: 0,
      comment: 'Quantity in troy ounces'
    },
    contractSize: {
      type: Number,
      default: 100,
      comment: 'Standard gold futures contract = 100 troy oz'
    },
    leverage: {
      type: Number,
      default: 1,
      min: 1,
      max: 20
    },
    margin: {
      type: Number,
      default: null
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
      enum: ['open', 'closed', 'cancelled', 'liquidated'],
      default: 'open'
    },
    goldSymbol: {
      type: String,
      default: 'XAUUSD'
    },
    stopLoss: {
      type: Number,
      default: null
    },
    takeProfit: {
      type: Number,
      default: null
    },
    optionDetails: {
      optionType: { type: String, enum: ['call', 'put'], default: null },
      strikePrice: { type: Number, default: null },
      expiryDate: { type: Date, default: null },
      premium: { type: Number, default: null }
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

goldTradeSchema.index({ userId: 1, status: 1 });
goldTradeSchema.index({ openedAt: -1 });

module.exports = mongoose.model('GoldTrade', goldTradeSchema);
