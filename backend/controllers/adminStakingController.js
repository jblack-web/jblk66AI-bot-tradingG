const crypto = require('crypto');
const StakingPool = require('../models/StakingPool');
const UserStake = require('../models/UserStake');
const StakingReward = require('../models/StakingReward');
const User = require('../models/User');
const { toObjectId } = require('../utils/sanitize');

/** Generate a cryptographically secure transaction hash. */
function generateTxHash() {
  return crypto.randomBytes(32).toString('hex');
}

const { BTC_USD_PRICE } = require('../utils/priceConfig');

// ─── GET /api/admin/staking/dashboard ────────────────────────────────────────

exports.getDashboard = async (req, res) => {
  try {
    const [pools, totalStakers, newStakersToday, totalRewardsAgg, pendingRewardsAgg, activeStakesAgg] =
      await Promise.all([
        StakingPool.find({}),
        UserStake.distinct('userId', { status: 'Active' }),
        UserStake.countDocuments({
          status: 'Active',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
        StakingReward.aggregate([{ $match: { status: { $in: ['Paid', 'Claimed'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        StakingReward.aggregate([{ $match: { status: 'Pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        UserStake.aggregate([{ $match: { status: 'Active' } }, { $group: { _id: '$poolId', tvl: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      ]);

    const totalTVL = pools.reduce((s, p) => s + p.currentTVL, 0);
    const avgAPY = pools.length
      ? pools.reduce((s, p) => s + (p.annualYieldMin + p.annualYieldMax) / 2, 0) / pools.length
      : 0;

    const poolBreakdown = pools.map((p) => ({
      id: p._id,
      name: p.name,
      tvl: p.currentTVL,
      tvlUSD: p.currentTVL * BTC_USD_PRICE,
      participants: p.participants,
      apy: (p.annualYieldMin + p.annualYieldMax) / 2,
    }));

    res.json({
      success: true,
      data: {
        totalTVL,
        totalTVLUSD: totalTVL * BTC_USD_PRICE,
        avgAPY,
        activeStakers: totalStakers.length,
        newStakersToday,
        totalDistributed: totalRewardsAgg[0]?.total || 0,
        totalDistributedUSD: (totalRewardsAgg[0]?.total || 0) * BTC_USD_PRICE,
        pendingPayouts: pendingRewardsAgg[0]?.total || 0,
        pendingPayoutsUSD: (pendingRewardsAgg[0]?.total || 0) * BTC_USD_PRICE,
        poolBreakdown,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/staking/pools ─────────────────────────────────────────────

exports.getPools = async (req, res) => {
  try {
    const pools = await StakingPool.find({}).sort({ createdAt: 1 });
    res.json({ success: true, data: pools });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/staking/pools ────────────────────────────────────────────

exports.createPool = async (req, res) => {
  try {
    const pool = await StakingPool.create(req.body);
    res.status(201).json({ success: true, data: pool, message: 'Pool created successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/admin/staking/pools/:id ─────────────────────────────────────────

exports.updatePool = async (req, res) => {
  try {
    const poolId = toObjectId(req.params.id);
    if (!poolId) {
      return res.status(400).json({ success: false, message: 'Invalid pool ID' });
    }

    // Whitelist allowed fields and cast each value to its expected primitive type
    // to prevent NoSQL operator injection from req.body values.
    const allowedRiskLevels = ['Very Low', 'Low', 'Low-Medium', 'Medium', 'High'];
    const allowedTiers = ['Starter', 'Advanced', 'Professional', 'Elite', 'DeFi', 'Liquid'];
    const { body } = req;
    const updates = {};

    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.description === 'string') updates.description = body.description.trim();
    if (typeof body.blockchain === 'string') updates.blockchain = body.blockchain.trim();
    if (typeof body.minimumStake === 'number' || typeof body.minimumStake === 'string') {
      const v = parseFloat(body.minimumStake);
      if (!isNaN(v) && v >= 0) updates.minimumStake = v;
    }
    if (typeof body.maximumStake === 'number' || typeof body.maximumStake === 'string') {
      const v = parseFloat(body.maximumStake);
      if (!isNaN(v) && v >= 0) updates.maximumStake = v;
    }
    if (typeof body.annualYieldMin === 'number' || typeof body.annualYieldMin === 'string') {
      const v = parseFloat(body.annualYieldMin);
      if (!isNaN(v) && v >= 0) updates.annualYieldMin = v;
    }
    if (typeof body.annualYieldMax === 'number' || typeof body.annualYieldMax === 'string') {
      const v = parseFloat(body.annualYieldMax);
      if (!isNaN(v) && v >= 0) updates.annualYieldMax = v;
    }
    if (typeof body.fee === 'number' || typeof body.fee === 'string') {
      const v = parseFloat(body.fee);
      if (!isNaN(v) && v >= 0) updates.fee = v;
    }
    if (typeof body.earlyWithdrawalFee === 'number' || typeof body.earlyWithdrawalFee === 'string') {
      const v = parseFloat(body.earlyWithdrawalFee);
      if (!isNaN(v) && v >= 0) updates.earlyWithdrawalFee = v;
    }
    if (typeof body.capacity === 'number' || typeof body.capacity === 'string') {
      const v = parseFloat(body.capacity);
      if (!isNaN(v) && v >= 0) updates.capacity = v;
    }
    if (Array.isArray(body.lockPeriodOptions)) {
      updates.lockPeriodOptions = body.lockPeriodOptions
        .map(d => parseInt(d, 10))
        .filter(d => !isNaN(d) && d > 0);
    }
    if (typeof body.riskLevel === 'string' && allowedRiskLevels.includes(body.riskLevel)) {
      updates.riskLevel = body.riskLevel;
    }
    if (typeof body.tier === 'string' && allowedTiers.includes(body.tier)) {
      updates.tier = body.tier;
    }
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive;
    if (typeof body.isLiquid === 'boolean') updates.isLiquid = body.isLiquid;

    const pool = await StakingPool.findByIdAndUpdate(poolId, { $set: updates }, {
      new: true,
      runValidators: true,
    });
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }
    res.json({ success: true, data: pool, message: 'Pool updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/staking/stakers ───────────────────────────────────────────

exports.getStakers = async (req, res) => {
  try {
    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build a clean, non-tainted query filter using only validated values.
    // Use explicit $eq operators to make it clear to static analyzers that
    // user input is not treated as a query operator.
    const filter = {};
    const allowedStatuses = ['Active', 'Completed', 'Withdrawn', 'Paused'];
    if (req.query.status && allowedStatuses.includes(req.query.status)) {
      filter.status = { $eq: req.query.status };
    }
    if (req.query.poolId) {
      const poolId = toObjectId(req.query.poolId);
      if (!poolId) {
        return res.status(400).json({ success: false, message: 'Invalid pool ID' });
      }
      filter.poolId = { $eq: poolId };
    }

    const [stakes, total] = await Promise.all([
      UserStake.find(filter)
        .populate('userId', 'username email role createdAt')
        .populate('poolId', 'name tier')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      UserStake.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: stakes,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/staking/stakers/:id ───────────────────────────────────────

exports.getStakerDetails = async (req, res) => {
  try {
    const userId = toObjectId(req.params.id);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [stakes, rewards] = await Promise.all([
      UserStake.find({ userId }).populate('poolId'),
      StakingReward.find({ userId }).sort({ createdAt: -1 }).limit(50),
    ]);

    const totalStaked = stakes.filter((s) => s.status === 'Active').reduce((sum, s) => sum + s.amount, 0);
    const totalEarned = stakes.reduce((sum, s) => sum + s.totalEarned, 0);

    res.json({
      success: true,
      data: {
        user,
        stakes,
        rewards,
        summary: {
          totalStaked,
          totalStakedUSD: totalStaked * BTC_USD_PRICE,
          totalEarned,
          totalEarnedUSD: totalEarned * BTC_USD_PRICE,
          activeStakes: stakes.filter((s) => s.status === 'Active').length,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/staking/payout ───────────────────────────────────────────

exports.manualPayout = async (req, res) => {
  try {
    const { userId: userIdRaw, stakeId: stakeIdRaw, amount, note } = req.body;
    if (!userIdRaw || !stakeIdRaw || !amount) {
      return res.status(400).json({ success: false, message: 'userId, stakeId and amount are required' });
    }
    const userId = toObjectId(userIdRaw);
    const stakeId = toObjectId(stakeIdRaw);
    if (!userId || !stakeId) {
      return res.status(400).json({ success: false, message: 'Invalid userId or stakeId' });
    }
    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number' });
    }

    const stake = await UserStake.findOne({ _id: stakeId, userId });
    if (!stake) {
      return res.status(404).json({ success: false, message: 'Stake not found for this user' });
    }

    const reward = await StakingReward.create({
      stakeId,
      userId,
      poolId: stake.poolId,
      amount: payoutAmount,
      earnedDate: new Date(),
      paidDate: new Date(),
      status: 'Paid',
      rewardType: 'Bonus',
      transactionHash: generateTxHash(),
    });

    stake.totalEarned += payoutAmount;
    stake.withdrawnRewards += payoutAmount;
    await stake.save();

    res.json({ success: true, data: reward, message: `Manual payout of ${payoutAmount} BTC processed` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/staking/bonus ────────────────────────────────────────────

exports.issueBonus = async (req, res) => {
  try {
    const { userId: userIdRaw, amount, bonusType, note } = req.body;
    if (!userIdRaw || !amount) {
      return res.status(400).json({ success: false, message: 'userId and amount are required' });
    }
    const userId = toObjectId(userIdRaw);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }
    const bonusAmount = parseFloat(amount);
    if (isNaN(bonusAmount) || bonusAmount <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number' });
    }
    // Whitelist bonus types
    const allowedBonusTypes = ['Bonus', 'Referral', 'Promotional'];
    const safeType = allowedBonusTypes.includes(bonusType) ? bonusType : 'Bonus';

    // Find an active stake to attach reward to (or first stake)
    const stake = await UserStake.findOne({ userId, status: 'Active' }) ||
      await UserStake.findOne({ userId });

    if (!stake) {
      return res.status(404).json({ success: false, message: 'No stakes found for this user' });
    }

    const reward = await StakingReward.create({
      stakeId: stake._id,
      userId,
      poolId: stake.poolId,
      amount: bonusAmount,
      earnedDate: new Date(),
      paidDate: new Date(),
      status: 'Paid',
      rewardType: safeType,
      transactionHash: generateTxHash(),
    });

    res.json({ success: true, data: reward, message: `Bonus of ${bonusAmount} BTC issued successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/staking/analytics ────────────────────────────────────────

exports.getAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      newStakers30d,
      activeStakerCount,
      churnedStakers,
      avgStakeSizeAgg,
      avgHoldPeriodAgg,
      tierDistributionAgg,
      revenueByPool,
      topPools,
    ] = await Promise.all([
      UserStake.distinct('userId', { createdAt: { $gte: thirtyDaysAgo } }),
      UserStake.distinct('userId', { status: 'Active' }),
      UserStake.distinct('userId', { status: 'Withdrawn', updatedAt: { $gte: thirtyDaysAgo } }),
      UserStake.aggregate([{ $match: { status: 'Active' } }, { $group: { _id: null, avg: { $avg: '$amount' } } }]),
      UserStake.aggregate([{ $match: { status: { $in: ['Completed', 'Withdrawn'] } } }, { $group: { _id: null, avg: { $avg: '$lockPeriodDays' } } }]),
      UserStake.aggregate([{ $match: { status: 'Active' } }, { $lookup: { from: 'stakingpools', localField: 'poolId', foreignField: '_id', as: 'pool' } }, { $unwind: '$pool' }, { $group: { _id: '$pool.tier', count: { $sum: 1 }, tvl: { $sum: '$amount' } } }]),
      StakingReward.aggregate([{ $match: { status: { $in: ['Paid', 'Claimed'] } } }, { $group: { _id: '$poolId', total: { $sum: '$amount' } } }]),
      StakingPool.find({ isActive: true }).sort({ currentTVL: -1 }).limit(5),
    ]);

    res.json({
      success: true,
      data: {
        newStakers30d: newStakers30d.length,
        activeStakers: activeStakerCount.length,
        churnRate: activeStakerCount.length > 0
          ? ((churnedStakers.length / (activeStakerCount.length + churnedStakers.length)) * 100).toFixed(2)
          : 0,
        avgStakeSize: avgStakeSizeAgg[0]?.avg || 0,
        avgHoldPeriod: avgHoldPeriodAgg[0]?.avg || 0,
        tierDistribution: tierDistributionAgg,
        revenueByPool,
        topPools: topPools.map((p) => ({ name: p.name, tvl: p.currentTVL, participants: p.participants })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/staking/reports ───────────────────────────────────────────

exports.getReports = async (req, res) => {
  try {
    const { type = 'daily', startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [rewards, stakes, pools] = await Promise.all([
      StakingReward.find({ createdAt: { $gte: start, $lte: end } }).populate('userId', 'username email').populate('poolId', 'name'),
      UserStake.find({ createdAt: { $gte: start, $lte: end } }).populate('userId', 'username email').populate('poolId', 'name'),
      StakingPool.find({}),
    ]);

    const totalPaid = rewards.filter((r) => ['Paid', 'Claimed'].includes(r.status)).reduce((s, r) => s + r.amount, 0);
    const totalFees = stakes.reduce((s, st) => {
      const pool = pools.find((p) => p._id.toString() === st.poolId?.toString());
      return s + (pool ? st.amount * (pool.fee / 100) : 0);
    }, 0);

    res.json({
      success: true,
      data: {
        reportType: type,
        period: { start, end },
        summary: {
          totalStakesCreated: stakes.length,
          totalRewardsPaid: totalPaid,
          totalRewardsPaidUSD: totalPaid * BTC_USD_PRICE,
          totalFeesCollected: totalFees,
          totalFeesCollectedUSD: totalFees * BTC_USD_PRICE,
        },
        rewards,
        stakes,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/staking/campaigns ────────────────────────────────────────

exports.createCampaign = async (req, res) => {
  try {
    const { name, poolId: poolIdRaw, apyBoost, durationDays, targetSegment, description } = req.body;
    if (!name || !poolIdRaw || !apyBoost || !durationDays) {
      return res.status(400).json({ success: false, message: 'name, poolId, apyBoost and durationDays are required' });
    }
    const poolId = toObjectId(poolIdRaw);
    if (!poolId) {
      return res.status(400).json({ success: false, message: 'Invalid pool ID' });
    }
    const boost = parseFloat(apyBoost);
    const days = parseInt(durationDays, 10);
    if (isNaN(boost) || boost <= 0) {
      return res.status(400).json({ success: false, message: 'apyBoost must be a positive number' });
    }
    if (isNaN(days) || days <= 0) {
      return res.status(400).json({ success: false, message: 'durationDays must be a positive integer' });
    }

    const pool = await StakingPool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }

    // Apply APY boost to pool temporarily
    const originalYieldMin = pool.annualYieldMin;
    const originalYieldMax = pool.annualYieldMax;
    pool.annualYieldMin = originalYieldMin + boost;
    pool.annualYieldMax = originalYieldMax + boost;
    await pool.save();

    res.status(201).json({
      success: true,
      data: {
        name,
        pool: pool.name,
        apyBoost: boost,
        durationDays: days,
        targetSegment,
        description,
        startDate: new Date(),
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        previousAPYRange: `${originalYieldMin}-${originalYieldMax}%`,
        newAPYRange: `${pool.annualYieldMin}-${pool.annualYieldMax}%`,
      },
      message: 'Campaign created and APY boost applied to pool',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/staking/revenue ───────────────────────────────────────────

exports.getRevenue = async (req, res) => {
  try {
    const pools = await StakingPool.find({});
    const rewards = await StakingReward.find({ status: { $in: ['Paid', 'Claimed'] } });

    const totalTVL = pools.reduce((s, p) => s + p.currentTVL, 0);

    // Estimate fee revenue: TVL * avg fee / 365 * days operating
    const feeRevenue = pools.reduce((s, p) => s + p.currentTVL * (p.fee / 100), 0);

    const dailyRevenue = feeRevenue / 365;
    const monthlyRevenue = dailyRevenue * 30;
    const annualRevenue = feeRevenue;

    const revenueByPool = pools.map((p) => ({
      poolName: p.name,
      tvl: p.currentTVL,
      tvlUSD: p.currentTVL * BTC_USD_PRICE,
      fee: p.fee,
      annualFeeRevenue: p.currentTVL * (p.fee / 100),
      annualFeeRevenueUSD: p.currentTVL * (p.fee / 100) * BTC_USD_PRICE,
    }));

    res.json({
      success: true,
      data: {
        totalTVL,
        totalTVLUSD: totalTVL * BTC_USD_PRICE,
        feeRevenue,
        feeRevenueUSD: feeRevenue * BTC_USD_PRICE,
        dailyRevenue,
        dailyRevenueUSD: dailyRevenue * BTC_USD_PRICE,
        monthlyRevenue,
        monthlyRevenueUSD: monthlyRevenue * BTC_USD_PRICE,
        annualRevenue,
        annualRevenueUSD: annualRevenue * BTC_USD_PRICE,
        revenueByPool,
        totalRewardsPaid: rewards.reduce((s, r) => s + r.amount, 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
