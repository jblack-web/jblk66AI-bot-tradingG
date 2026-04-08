const mongoose = require('mongoose');

const miningEarningSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'MiningContract', required: true },
    rigId: { type: mongoose.Schema.Types.ObjectId, ref: 'MiningRig', required: true },
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    hashRate: { type: Number, required: true },
    difficulty: { type: Number, default: 0 },
    fees: { type: Number, default: 0 },
    electricityCost: { type: Number, default: 0 },
    maintenanceFee: { type: Number, default: 0 },
    netEarning: { type: Number, required: true },
    currency: { type: String, default: 'BTC' },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    txHash: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MiningEarning', miningEarningSchema);
