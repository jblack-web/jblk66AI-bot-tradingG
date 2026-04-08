const mongoose = require('mongoose');

const dedicatedAccountManagerServiceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountManager', required: true },
  serviceType: { type: String, enum: ['daily', 'monthly'], required: true },
  dailyFee: { type: Number, default: 19.99 },
  monthlyFee: { type: Number, default: 499.99 },
  status: { type: String, enum: ['active', 'cancelled', 'expired', 'suspended', 'failed'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  nextRenewalDate: Date,
  autoRenew: { type: Boolean, default: true },
  totalPaid: { type: Number, default: 0 },
  meetings: [{
    scheduledAt: Date,
    duration: Number,
    notes: String,
    recordingUrl: String,
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  }],
  performanceMetrics: {
    totalTrades: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    avgReturn: { type: Number, default: 0 },
    bestTrade: { type: Number, default: 0 },
    worstTrade: { type: Number, default: 0 },
  },
  clientRating: Number,
  clientReview: String,
}, { timestamps: true });

module.exports = mongoose.model('DedicatedAccountManagerService', dedicatedAccountManagerServiceSchema);
