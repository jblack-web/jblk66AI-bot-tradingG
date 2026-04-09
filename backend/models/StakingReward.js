const mongoose = require('mongoose');

const StakingRewardSchema = new mongoose.Schema(
  {
    stakeId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserStake', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    poolId: { type: mongoose.Schema.Types.ObjectId, ref: 'StakingPool', required: true },
    amount: { type: Number, required: true }, // in BTC
    earnedDate: { type: Date, required: true, default: Date.now },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Claimed', 'Compounded'],
      default: 'Pending',
    },
    compoundedAmount: { type: Number, default: 0 },
    transactionHash: { type: String },
    rewardType: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Bonus', 'Referral', 'Promotional'],
      default: 'Daily',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StakingReward', StakingRewardSchema);
