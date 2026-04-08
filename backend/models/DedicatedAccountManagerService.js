'use strict';

const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  platform: { type: String, default: 'zoom' },
  meetingLink: { type: String, default: null },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  notes: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const dedicatedAccountManagerServiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccountManager',
      required: true
    },
    serviceType: {
      type: String,
      enum: ['daily', 'monthly'],
      required: true
    },
    dailyFee: {
      type: Number,
      default: 19.99
    },
    monthlyFee: {
      type: Number,
      default: 499.99
    },
    currentFee: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'pending'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    meetings: [meetingSchema],
    performanceMetrics: {
      totalTrades: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      totalPnl: { type: Number, default: 0 },
      bestTrade: { type: Number, default: 0 },
      worstTrade: { type: Number, default: 0 }
    },
    lastBillingDate: {
      type: Date,
      default: Date.now
    },
    nextBillingDate: {
      type: Date,
      required: true
    },
    totalPaid: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

dedicatedAccountManagerServiceSchema.index({ userId: 1, status: 1 });
dedicatedAccountManagerServiceSchema.index({ managerId: 1, status: 1 });

module.exports = mongoose.model('DedicatedAccountManagerService', dedicatedAccountManagerServiceSchema);
