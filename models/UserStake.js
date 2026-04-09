const mongoose = require('mongoose');

const UserStakeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    poolId: { type: mongoose.Schema.Types.ObjectId, ref: 'StakingPool', required: true },
    amount: { type: Number, required: true }, // in BTC
    startDate: { type: Date, required: true, default: Date.now },
    lockPeriodDays: { type: Number, required: true },
    lockEndDate: { type: Date, required: true },
    currentAPY: { type: Number, required: true }, // effective APY assigned at creation
    totalEarned: { type: Number, default: 0 }, // cumulative BTC earned
    earnedRewards: { type: Number, default: 0 }, // pending/unclaimed rewards in BTC
    withdrawnRewards: { type: Number, default: 0 }, // total withdrawn rewards in BTC
    compoundEnabled: { type: Boolean, default: false },
    autoReinvestEnabled: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Withdrawn', 'Paused'],
      default: 'Active',
    },
    lastRewardCalculation: { type: Date, default: Date.now },
    extendedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

// Virtual: days remaining in lock period
UserStakeSchema.virtual('daysRemaining').get(function () {
  if (this.status !== 'Active') return 0;
  const now = new Date();
  const diff = this.lockEndDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual: is lock period complete
UserStakeSchema.virtual('isLockComplete').get(function () {
  return new Date() >= this.lockEndDate;
});

// Virtual: progress percentage through lock period
UserStakeSchema.virtual('lockProgressPercent').get(function () {
  const total = this.lockPeriodDays * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - this.startDate.getTime();
  return Math.min(100, Math.round((elapsed / total) * 100));
});

UserStakeSchema.set('toJSON', { virtuals: true });
UserStakeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserStake', UserStakeSchema);
