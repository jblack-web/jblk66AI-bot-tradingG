'use strict';

const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Trade = require('../models/Trade');
const DepositTransaction = require('../models/DepositTransaction');
const WithdrawalTransaction = require('../models/WithdrawalTransaction');
const UserSubscription = require('../models/UserSubscription');
const SiteSettings = require('../models/SiteSettings');
const { paginate } = require('../utils/helpers');

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, tier, isActive, search } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const filter = {};
    if (role) filter.role = role;
    if (tier) filter.tier = tier;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      User.countDocuments(filter)
    ]);
    res.json({ success: true, users, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const [wallet, subscription] = await Promise.all([
      Wallet.findOne({ userId: user._id }),
      UserSubscription.findOne({ userId: user._id }).populate('tierId')
    ]);
    res.json({ success: true, user: user.toPublicJSON(), wallet, subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const allowedFields = ['name', 'email', 'role', 'tier', 'kycVerified', 'isActive', 'phone'];
    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'User deactivated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: true, banReason: reason || 'Banned by admin' }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, message: 'User banned.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const unbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: false, banReason: null }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, message: 'User unbanned.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const forceVerifyKyc = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { kycVerified: true }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, message: 'KYC verified.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const changeUserTier = async (req, res) => {
  try {
    const { tier } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { tier }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, message: `User tier changed to ${tier}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers, activeUsers, totalTrades, openTrades,
      totalDeposits, totalWithdrawals, activeSubscriptions
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true, isBanned: false }),
      Trade.countDocuments({}),
      Trade.countDocuments({ status: 'open' }),
      DepositTransaction.aggregate([{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      WithdrawalTransaction.aggregate([{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      UserSubscription.countDocuments({ status: 'active' })
    ]);

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, active: activeUsers },
        trades: { total: totalTrades, open: openTrades },
        deposits: totalDeposits[0] || { total: 0, count: 0 },
        withdrawals: totalWithdrawals[0] || { total: 0, count: 0 },
        activeSubscriptions
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRevenueStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [recentDeposits, recentWithdrawals, subRevenue] = await Promise.all([
      DepositTransaction.aggregate([
        { $match: { status: 'completed', completedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' }, fees: { $sum: '$fee' } } }
      ]),
      WithdrawalTransaction.aggregate([
        { $match: { status: 'completed', processedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' }, fees: { $sum: '$fee' } } }
      ]),
      UserSubscription.aggregate([
        { $group: { _id: '$tierName', revenue: { $sum: '$price' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      revenue: {
        last30Days: {
          deposits: recentDeposits[0] || { total: 0, fees: 0 },
          withdrawals: recentWithdrawals[0] || { total: 0, fees: 0 }
        },
        subscriptionRevenue: subRevenue
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({ key: 'singleton' });
    if (!settings) {
      settings = await SiteSettings.create({ key: 'singleton' });
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSiteSettings = async (req, res) => {
  try {
    const allowedFields = ['withdrawalMode', 'autoWithdrawalMinAccountAge', 'autoWithdrawalRequireKyc', 'autoWithdrawalMaxAmount', 'maintenanceMode', 'tradingEnabled', 'maintenanceMessage', 'depositEnabled', 'withdrawalEnabled', 'registrationEnabled', 'referralProgramEnabled', 'defaultReferralBonus', 'minDepositAmount', 'minWithdrawalAmount', 'maxWithdrawalPerDay', 'platformFee'];
    const updates = { updatedBy: req.user._id, updatedAt: new Date() };
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const settings = await SiteSettings.findOneAndUpdate({ key: 'singleton' }, updates, { new: true, upsert: true });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleWithdrawalMode = async (req, res) => {
  try {
    const settings = await SiteSettings.findOne({ key: 'singleton' });
    const currentMode = settings ? settings.withdrawalMode : 'manual';
    const newMode = currentMode === 'manual' ? 'auto' : 'manual';

    await SiteSettings.findOneAndUpdate({ key: 'singleton' }, { withdrawalMode: newMode, updatedBy: req.user._id }, { upsert: true });
    res.json({ success: true, message: `Withdrawal mode changed to ${newMode}.`, mode: newMode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers, getUserById, updateUser, deleteUser, banUser, unbanUser,
  forceVerifyKyc, changeUserTier, getSystemStats, getRevenueStats,
  getSiteSettings, updateSiteSettings, toggleWithdrawalMode
};
