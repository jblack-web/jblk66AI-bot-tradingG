'use strict';

const mongoose = require('mongoose');

const automatedTradeScheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    strategy: {
      type: String,
      enum: ['momentum', 'meanReversion', 'trendFollowing', 'aiSignal'],
      default: 'momentum'
    },
    tradingPairs: {
      type: [String],
      default: ['BTCUSDT', 'ETHUSDT']
    },
    maxDailyTrades: {
      type: Number,
      default: 5,
      min: 1,
      max: 20
    },
    tradesExecutedToday: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: false
    },
    riskPercentage: {
      type: Number,
      default: 2,
      min: 0.5,
      max: 10
    },
    stopLossPercentage: {
      type: Number,
      default: 2,
      min: 0.5,
      max: 20
    },
    takeProfitPercentage: {
      type: Number,
      default: 4,
      min: 1,
      max: 50
    },
    totalTrades: {
      type: Number,
      default: 0
    },
    totalWins: {
      type: Number,
      default: 0
    },
    totalLosses: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0
    },
    totalPnl: {
      type: Number,
      default: 0
    },
    lastTradeAt: {
      type: Date,
      default: null
    },
    scheduleConfig: {
      runTimes: {
        type: [String],
        default: ['06:00', '09:00', '12:00', '15:00', '18:00']
      }
    }
  },
  { timestamps: true }
);

automatedTradeScheduleSchema.methods.resetDailyCounterIfNeeded = function () {
  const today = new Date();
  const lastReset = new Date(this.lastResetDate);
  if (today.toDateString() !== lastReset.toDateString()) {
    this.tradesExecutedToday = 0;
    this.lastResetDate = today;
  }
};

automatedTradeScheduleSchema.index({ userId: 1 });
automatedTradeScheduleSchema.index({ isActive: 1 });

module.exports = mongoose.model('AutomatedTradeSchedule', automatedTradeScheduleSchema);
