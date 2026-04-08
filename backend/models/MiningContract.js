const mongoose = require('mongoose');

const miningContractSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rigId: { type: mongoose.Schema.Types.ObjectId, ref: 'MiningRig', required: true },
    hashRate: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'paused', 'expired', 'cancelled'], default: 'active' },
    contractDuration: { type: Number, required: true },
    contractDurationUnit: { type: String, enum: ['month', 'year'], default: 'month' },
    paymentAmount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    selectedPool: { type: String, default: 'Antpool' },
    totalEarned: { type: Number, default: 0 },
    powerLimit: { type: Number, default: 100 },
    autoReinvest: { type: Boolean, default: false },
    pausedAt: { type: Date, default: null },
    pauseDurationDays: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MiningContract', miningContractSchema);
