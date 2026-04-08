'use strict';

const UserTierPackage = require('../models/UserTierPackage');
const UserSubscription = require('../models/UserSubscription');
const User = require('../models/User');

const getTiers = async (req, res) => {
  try {
    const tiers = await UserTierPackage.find({ isActive: true }).sort({ monthlyPrice: 1 });
    res.json({ success: true, tiers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTierById = async (req, res) => {
  try {
    const tier = await UserTierPackage.findById(req.params.id);
    if (!tier) return res.status(404).json({ error: 'Tier not found.' });
    res.json({ success: true, tier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const compareTiers = async (req, res) => {
  try {
    const tiers = await UserTierPackage.find({ isActive: true }).sort({ monthlyPrice: 1 });
    const comparison = tiers.map((t) => ({
      name: t.name,
      displayName: t.displayName,
      monthlyPrice: t.monthlyPrice,
      yearlyPrice: t.yearlyPrice,
      features: {
        maxDailyTrades: t.maxDailyTrades,
        futuresTradingAllowed: t.futuresTradingAllowed,
        optionsTradingAllowed: t.optionsTradingAllowed,
        maxLeverage: t.maxLeverage,
        automatedTradingPerDay: t.automatedTradingPerDay,
        advancedAnalyticsAccess: t.advancedAnalyticsAccess,
        dedicatedAccountManager: t.dedicatedAccountManager,
        apiAccess: t.apiAccess,
        annualInterestRate: t.annualInterestRate,
        referralBonusPercentage: t.referralBonusPercentage
      }
    }));
    res.json({ success: true, comparison });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTier = async (req, res) => {
  try {
    const tier = await UserTierPackage.create(req.body);
    res.status(201).json({ success: true, tier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTier = async (req, res) => {
  try {
    const tier = await UserTierPackage.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tier) return res.status(404).json({ error: 'Tier not found.' });
    res.json({ success: true, tier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTier = async (req, res) => {
  try {
    await UserTierPackage.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Tier deactivated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTierStats = async (req, res) => {
  try {
    const stats = await UserSubscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$tierName', count: { $sum: 1 }, revenue: { $sum: '$price' } } }
    ]);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTiers, getTierById, compareTiers, createTier, updateTier, deleteTier, getTierStats };
