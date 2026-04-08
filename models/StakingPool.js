const mongoose = require('mongoose');

const StakingPoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    blockchain: { type: String, required: true, default: 'Bitcoin' },
    minimumStake: { type: Number, required: true }, // in BTC
    maximumStake: { type: Number, required: true }, // in BTC
    annualYieldMin: { type: Number, required: true }, // APY % min
    annualYieldMax: { type: Number, required: true }, // APY % max
    lockPeriodOptions: { type: [Number], default: [7, 30, 60, 90, 180, 365] }, // days
    fee: { type: Number, required: true }, // percentage
    riskLevel: {
      type: String,
      enum: ['Very Low', 'Low', 'Low-Medium', 'Medium', 'High'],
      required: true,
    },
    capacity: { type: Number, required: true }, // maximum TVL in BTC
    currentTVL: { type: Number, default: 0 }, // total value locked in BTC
    participants: { type: Number, default: 0 },
    tier: {
      type: String,
      enum: ['Starter', 'Advanced', 'Professional', 'Elite', 'DeFi', 'Liquid'],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    isLiquid: { type: Boolean, default: false },
    earlyWithdrawalFee: { type: Number, default: 5 }, // percentage
  },
  { timestamps: true }
);

StakingPoolSchema.virtual('utilizationPercent').get(function () {
  if (this.capacity === 0) return 0;
  return Math.min(100, Math.round((this.currentTVL / this.capacity) * 100));
});

StakingPoolSchema.set('toJSON', { virtuals: true });
StakingPoolSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('StakingPool', StakingPoolSchema);
