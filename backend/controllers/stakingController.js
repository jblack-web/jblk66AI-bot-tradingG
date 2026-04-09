const crypto = require('crypto');
const StakingPool = require('../models/StakingPool');
const UserStake = require('../models/UserStake');
const StakingReward = require('../models/StakingReward');
const { toObjectId, sanitizeString } = require('../utils/sanitize');

/** Generate a cryptographically secure transaction hash. */
function generateTxHash() {
  return crypto.randomBytes(32).toString('hex');
}

// ─── Helper ────────────────────────────────────────────────────────────────────

/** Calculate accrued rewards for a stake since last calculation. Returns BTC. */
function calcAccruedRewards(stake) {
  const now = new Date();
  const lastCalc = stake.lastRewardCalculation || stake.startDate;
  const elapsedDays = (now - lastCalc) / (1000 * 60 * 60 * 24);
  const dailyRate = stake.currentAPY / 100 / 365;
  return stake.amount * dailyRate * elapsedDays;
}

/** Assign APY from pool (midpoint of min/max yield). */
function assignAPY(pool) {
  return (pool.annualYieldMin + pool.annualYieldMax) / 2;
}

/** BTC price stub — in production connect to live feed. */
const { BTC_USD_PRICE } = require('../utils/priceConfig');

// ─── GET /api/staking/pools ────────────────────────────────────────────────────

exports.getPools = async (req, res) => {
  try {
    const pools = await StakingPool.find({ isActive: true }).sort({ minimumStake: 1 });
    res.json({ success: true, data: pools });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/staking/pools/:id ───────────────────────────────────────────────

exports.getPool = async (req, res) => {
  try {
    const poolId = toObjectId(req.params.id);
    if (!poolId) {
      return res.status(400).json({ success: false, message: 'Invalid pool ID' });
    }
    const pool = await StakingPool.findById(poolId);
    if (!pool || !pool.isActive) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }
    res.json({ success: true, data: pool });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/staking/stakes ──────────────────────────────────────────────────

exports.getUserStakes = async (req, res) => {
  try {
    const stakes = await UserStake.find({ userId: req.user._id })
      .populate('poolId')
      .sort({ createdAt: -1 });

    // Refresh pending rewards estimate without saving
    const enriched = stakes.map((s) => {
      const obj = s.toObject();
      obj.pendingRewards = s.earnedRewards + calcAccruedRewards(s);
      return obj;
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/staking/stakes/:id ─────────────────────────────────────────────

exports.getStake = async (req, res) => {
  try {
    const stakeId = toObjectId(req.params.id);
    if (!stakeId) {
      return res.status(400).json({ success: false, message: 'Invalid stake ID' });
    }
    const stake = await UserStake.findOne({
      _id: stakeId,
      userId: req.user._id,
    }).populate('poolId');

    if (!stake) {
      return res.status(404).json({ success: false, message: 'Stake not found' });
    }

    const obj = stake.toObject();
    obj.pendingRewards = stake.earnedRewards + calcAccruedRewards(stake);
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/staking/earnings ────────────────────────────────────────────────

exports.getEarnings = async (req, res) => {
  try {
    const rewards = await StakingReward.find({ userId: req.user._id })
      .populate('stakeId')
      .populate('poolId')
      .sort({ earnedDate: -1 });

    const totalEarned = rewards.reduce((sum, r) => sum + r.amount, 0);
    const totalPending = rewards
      .filter((r) => r.status === 'Pending')
      .reduce((sum, r) => sum + r.amount, 0);
    const totalClaimed = rewards
      .filter((r) => ['Paid', 'Claimed'].includes(r.status))
      .reduce((sum, r) => sum + r.amount, 0);
    const totalCompounded = rewards
      .filter((r) => r.status === 'Compounded')
      .reduce((sum, r) => sum + r.compoundedAmount, 0);

    res.json({
      success: true,
      data: {
        rewards,
        summary: {
          totalEarned,
          totalPending,
          totalClaimed,
          totalCompounded,
          totalEarnedUSD: totalEarned * BTC_USD_PRICE,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/staking/create ─────────────────────────────────────────────────

exports.createStake = async (req, res) => {
  try {
    const { poolId: poolIdRaw, amount, lockPeriodDays, compoundEnabled, autoReinvestEnabled } = req.body;

    if (!poolIdRaw || !amount || !lockPeriodDays) {
      return res.status(400).json({ success: false, message: 'poolId, amount and lockPeriodDays are required' });
    }

    const poolId = toObjectId(poolIdRaw);
    if (!poolId) {
      return res.status(400).json({ success: false, message: 'Invalid pool ID' });
    }

    const amountNum = parseFloat(amount);
    const lockDays = parseInt(lockPeriodDays, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number' });
    }
    if (isNaN(lockDays) || lockDays <= 0) {
      return res.status(400).json({ success: false, message: 'lockPeriodDays must be a positive integer' });
    }

    const pool = await StakingPool.findById(poolId);
    if (!pool || !pool.isActive) {
      return res.status(404).json({ success: false, message: 'Staking pool not found or inactive' });
    }

    if (amountNum < pool.minimumStake) {
      return res.status(400).json({
        success: false,
        message: `Minimum stake for this pool is ${pool.minimumStake} BTC`,
      });
    }
    if (amountNum > pool.maximumStake) {
      return res.status(400).json({
        success: false,
        message: `Maximum stake for this pool is ${pool.maximumStake} BTC`,
      });
    }
    if (!pool.lockPeriodOptions.includes(lockDays)) {
      return res.status(400).json({
        success: false,
        message: `Valid lock periods (days): ${pool.lockPeriodOptions.join(', ')}`,
      });
    }
    if (pool.currentTVL + amountNum > pool.capacity) {
      return res.status(400).json({ success: false, message: 'Pool capacity reached' });
    }

    const startDate = new Date();
    const lockEndDate = new Date(startDate.getTime() + lockDays * 24 * 60 * 60 * 1000);

    const stake = await UserStake.create({
      userId: req.user._id,
      poolId,
      amount: amountNum,
      startDate,
      lockPeriodDays: lockDays,
      lockEndDate,
      currentAPY: assignAPY(pool),
      compoundEnabled: compoundEnabled === true || compoundEnabled === 'true',
      autoReinvestEnabled: autoReinvestEnabled === true || autoReinvestEnabled === 'true',
    });

    // Update pool stats
    pool.currentTVL += amountNum;
    pool.participants += 1;
    await pool.save();

    const populated = await stake.populate('poolId');
    res.status(201).json({ success: true, data: populated, message: 'Stake created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/staking/claim ──────────────────────────────────────────────────

exports.claimRewards = async (req, res) => {
  try {
    const { stakeId: stakeIdRaw } = req.body;
    if (!stakeIdRaw) {
      return res.status(400).json({ success: false, message: 'stakeId is required' });
    }
    const stakeId = toObjectId(stakeIdRaw);
    if (!stakeId) {
      return res.status(400).json({ success: false, message: 'Invalid stake ID' });
    }

    const stake = await UserStake.findOne({ _id: stakeId, userId: req.user._id });
    if (!stake) {
      return res.status(404).json({ success: false, message: 'Stake not found' });
    }
    if (stake.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Stake is not active' });
    }

    // Accrue pending rewards
    const newRewards = calcAccruedRewards(stake);
    const totalClaimable = stake.earnedRewards + newRewards;

    if (totalClaimable <= 0) {
      return res.status(400).json({ success: false, message: 'No rewards available to claim' });
    }

    // Create reward record
    const reward = await StakingReward.create({
      stakeId: stake._id,
      userId: req.user._id,
      poolId: stake.poolId,
      amount: totalClaimable,
      earnedDate: new Date(),
      paidDate: new Date(),
      status: 'Claimed',
      transactionHash: generateTxHash(),
    });

    // Update stake
    stake.totalEarned += totalClaimable;
    stake.withdrawnRewards += totalClaimable;
    stake.earnedRewards = 0;
    stake.lastRewardCalculation = new Date();
    await stake.save();

    res.json({
      success: true,
      data: { reward, claimedAmount: totalClaimable, claimedUSD: totalClaimable * BTC_USD_PRICE },
      message: 'Rewards claimed successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/staking/compound ───────────────────────────────────────────────

exports.compoundRewards = async (req, res) => {
  try {
    const { stakeId: stakeIdRaw } = req.body;
    if (!stakeIdRaw) {
      return res.status(400).json({ success: false, message: 'stakeId is required' });
    }
    const stakeId = toObjectId(stakeIdRaw);
    if (!stakeId) {
      return res.status(400).json({ success: false, message: 'Invalid stake ID' });
    }

    const stake = await UserStake.findOne({ _id: stakeId, userId: req.user._id });
    if (!stake) {
      return res.status(404).json({ success: false, message: 'Stake not found' });
    }
    if (stake.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Stake is not active' });
    }

    const newRewards = calcAccruedRewards(stake);
    const totalCompound = stake.earnedRewards + newRewards;

    if (totalCompound <= 0) {
      return res.status(400).json({ success: false, message: 'No rewards available to compound' });
    }

    // Create reward record
    const reward = await StakingReward.create({
      stakeId: stake._id,
      userId: req.user._id,
      poolId: stake.poolId,
      amount: totalCompound,
      earnedDate: new Date(),
      paidDate: new Date(),
      status: 'Compounded',
      compoundedAmount: totalCompound,
    });

    // Add rewards back to stake principal
    stake.amount += totalCompound;
    stake.totalEarned += totalCompound;
    stake.earnedRewards = 0;
    stake.lastRewardCalculation = new Date();
    await stake.save();

    // Update pool TVL
    await StakingPool.findByIdAndUpdate(stake.poolId, { $inc: { currentTVL: totalCompound } });

    res.json({
      success: true,
      data: { reward, compoundedAmount: totalCompound, newStakeAmount: stake.amount },
      message: 'Rewards compounded into stake successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/staking/withdraw ───────────────────────────────────────────────

exports.withdrawStake = async (req, res) => {
  try {
    const { stakeId: stakeIdRaw, destinationWallet } = req.body;
    if (!stakeIdRaw || !destinationWallet) {
      return res.status(400).json({ success: false, message: 'stakeId and destinationWallet are required' });
    }
    const stakeId = toObjectId(stakeIdRaw);
    if (!stakeId) {
      return res.status(400).json({ success: false, message: 'Invalid stake ID' });
    }
    const wallet = sanitizeString(destinationWallet);
    if (!wallet) {
      return res.status(400).json({ success: false, message: 'Invalid destination wallet' });
    }

    const stake = await UserStake.findOne({ _id: stakeId, userId: req.user._id }).populate('poolId');
    if (!stake) {
      return res.status(404).json({ success: false, message: 'Stake not found' });
    }
    if (stake.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Stake is not active' });
    }

    // Accrue final rewards
    const newRewards = calcAccruedRewards(stake);
    const totalRewards = stake.earnedRewards + newRewards;

    // Determine early withdrawal fee
    const pool = stake.poolId;
    let withdrawalFee = 0;
    if (!stake.isLockComplete) {
      withdrawalFee = pool.earlyWithdrawalFee / 100;
    }

    const principalAfterFee = stake.amount * (1 - withdrawalFee);
    const totalWithdrawn = principalAfterFee + totalRewards;
    const feeAmount = stake.amount * withdrawalFee;

    // Mark stake as withdrawn
    stake.status = 'Withdrawn';
    stake.totalEarned += totalRewards;
    stake.withdrawnRewards += totalRewards;
    stake.earnedRewards = 0;
    stake.lastRewardCalculation = new Date();
    await stake.save();

    // Update pool stats
    await StakingPool.findByIdAndUpdate(pool._id, {
      $inc: { currentTVL: -stake.amount, participants: -1 },
    });

    // Record final reward payout
    if (totalRewards > 0) {
      await StakingReward.create({
        stakeId: stake._id,
        userId: req.user._id,
        poolId: pool._id,
        amount: totalRewards,
        earnedDate: new Date(),
        paidDate: new Date(),
        status: 'Paid',
        transactionHash: generateTxHash(),
      });
    }

    res.json({
      success: true,
      data: {
        principalReturned: principalAfterFee,
        rewardsIncluded: totalRewards,
        feeDeducted: feeAmount,
        totalWithdrawn,
        totalWithdrawnUSD: totalWithdrawn * BTC_USD_PRICE,
        destinationWallet: wallet,
        earlyWithdrawalApplied: withdrawalFee > 0,
      },
      message: 'Stake withdrawn successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/staking/extend ─────────────────────────────────────────────────

exports.extendLockPeriod = async (req, res) => {
  try {
    const { stakeId: stakeIdRaw, newLockPeriodDays } = req.body;
    if (!stakeIdRaw || !newLockPeriodDays) {
      return res.status(400).json({ success: false, message: 'stakeId and newLockPeriodDays are required' });
    }
    const stakeId = toObjectId(stakeIdRaw);
    if (!stakeId) {
      return res.status(400).json({ success: false, message: 'Invalid stake ID' });
    }
    const newDays = parseInt(newLockPeriodDays, 10);
    if (isNaN(newDays) || newDays <= 0) {
      return res.status(400).json({ success: false, message: 'newLockPeriodDays must be a positive integer' });
    }

    const stake = await UserStake.findOne({ _id: stakeId, userId: req.user._id }).populate('poolId');
    if (!stake) {
      return res.status(404).json({ success: false, message: 'Stake not found' });
    }
    if (stake.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Stake is not active' });
    }

    const pool = stake.poolId;
    if (!pool.lockPeriodOptions.includes(newDays)) {
      return res.status(400).json({
        success: false,
        message: `Valid lock periods (days): ${pool.lockPeriodOptions.join(', ')}`,
      });
    }
    if (newDays <= stake.lockPeriodDays) {
      return res.status(400).json({ success: false, message: 'New lock period must be longer than current' });
    }

    const newLockEndDate = new Date(stake.startDate.getTime() + newDays * 24 * 60 * 60 * 1000);

    stake.lockPeriodDays = newDays;
    stake.lockEndDate = newLockEndDate;
    stake.extendedAt = new Date();
    await stake.save();

    res.json({
      success: true,
      data: {
        stakeId: stake._id,
        newLockPeriodDays: newDays,
        newLockEndDate,
        currentAPY: stake.currentAPY,
      },
      message: 'Lock period extended successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/staking/history ─────────────────────────────────────────────────

exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [rewards, total] = await Promise.all([
      StakingReward.find({ userId: req.user._id })
        .populate('stakeId')
        .populate('poolId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StakingReward.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      success: true,
      data: rewards,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/staking/calculator ──────────────────────────────────────────────

exports.calculateReturns = async (req, res) => {
  try {
    const { amount, annualYield, lockPeriodDays, compound } = req.query;

    if (!amount || !annualYield || !lockPeriodDays) {
      return res.status(400).json({ success: false, message: 'amount, annualYield and lockPeriodDays are required' });
    }

    const principal = parseFloat(amount);
    const apy = parseFloat(annualYield) / 100;
    const days = parseInt(lockPeriodDays);
    const useCompound = compound === 'true';

    let finalAmount;
    if (useCompound) {
      finalAmount = principal * Math.pow(1 + apy / 365, days);
    } else {
      finalAmount = principal * (1 + apy * (days / 365));
    }

    const earned = finalAmount - principal;
    const dailyReturn = principal * (apy / 365);
    const weeklyReturn = dailyReturn * 7;
    const monthlyReturn = dailyReturn * 30;
    const annualReturn = principal * apy;

    res.json({
      success: true,
      data: {
        principal,
        finalAmount,
        earned,
        earnedUSD: earned * BTC_USD_PRICE,
        dailyReturn,
        weeklyReturn,
        monthlyReturn,
        annualReturn,
        roi: (earned / principal) * 100,
        effectiveAPY: useCompound ? (Math.pow(1 + apy / 365, 365) - 1) * 100 : apy * 100,
        compoundEnabled: useCompound,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/staking/recommendations ────────────────────────────────────────

exports.getRecommendations = async (req, res) => {
  try {
    const pools = await StakingPool.find({ isActive: true }).sort({ annualYieldMax: -1 });
    const userStakes = await UserStake.find({ userId: req.user._id, status: 'Active' });

    const totalStaked = userStakes.reduce((s, x) => s + x.amount, 0);

    // Simple AI-style recommendation logic
    const recommendations = pools.map((pool) => {
      let score = 0;
      let reasons = [];

      // Yield score
      const yieldScore = ((pool.annualYieldMin + pool.annualYieldMax) / 2) * 2;
      score += yieldScore;

      // Risk preference (lower risk = higher score for conservative)
      const riskScores = { 'Very Low': 20, Low: 15, 'Low-Medium': 10, Medium: 5, High: 0 };
      score += riskScores[pool.riskLevel] || 0;

      // Capacity availability
      const utilizationPercent = pool.capacity > 0 ? (pool.currentTVL / pool.capacity) * 100 : 0;
      if (utilizationPercent < 70) { score += 10; reasons.push('Pool has good availability'); }
      if (utilizationPercent > 90) { score -= 10; reasons.push('Pool is near capacity'); }

      if (pool.riskLevel === 'Very Low' || pool.riskLevel === 'Low') {
        reasons.push('Low risk investment');
      }
      if (pool.annualYieldMin >= 16) {
        reasons.push('High yield potential');
      }
      if (pool.isLiquid) {
        reasons.push('Liquid — withdraw anytime');
      }

      return {
        pool,
        score,
        reasons,
        suggestedAllocation: totalStaked > 0 ? `${Math.round(100 / pools.length)}%` : 'First stake recommended',
      };
    });

    recommendations.sort((a, b) => b.score - a.score);

    res.json({ success: true, data: recommendations.slice(0, 3) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/staking/automation ─────────────────────────────────────────────

exports.setAutomation = async (req, res) => {
  try {
    const { stakeId: stakeIdRaw, compoundEnabled, autoReinvestEnabled } = req.body;
    if (!stakeIdRaw) {
      return res.status(400).json({ success: false, message: 'stakeId is required' });
    }
    const stakeId = toObjectId(stakeIdRaw);
    if (!stakeId) {
      return res.status(400).json({ success: false, message: 'Invalid stake ID' });
    }

    const stake = await UserStake.findOneAndUpdate(
      { _id: stakeId, userId: req.user._id, status: 'Active' },
      {
        compoundEnabled: compoundEnabled === true || compoundEnabled === 'true',
        autoReinvestEnabled: autoReinvestEnabled === true || autoReinvestEnabled === 'true',
      },
      { new: true }
    );

    if (!stake) {
      return res.status(404).json({ success: false, message: 'Active stake not found' });
    }

    res.json({
      success: true,
      data: { stakeId: stake._id, compoundEnabled: stake.compoundEnabled, autoReinvestEnabled: stake.autoReinvestEnabled },
      message: 'Automation settings updated',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
