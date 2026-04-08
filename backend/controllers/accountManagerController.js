'use strict';

const AccountManager = require('../models/AccountManager');
const User = require('../models/User');
const { paginate } = require('../utils/helpers');

const registerManager = async (req, res) => {
  try {
    const existing = await AccountManager.findOne({ userId: req.user._id });
    if (existing) return res.status(409).json({ error: 'Already registered as account manager.' });

    const manager = await AccountManager.create({
      userId: req.user._id,
      bio: req.body.bio,
      specialization: req.body.specialization,
      communicationChannels: req.body.communicationChannels,
      languages: req.body.languages,
      yearsExperience: req.body.yearsExperience,
      certifications: req.body.certifications
    });

    await User.findByIdAndUpdate(req.user._id, { role: 'accountManager' });
    res.status(201).json({ success: true, manager });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateManagerProfile = async (req, res) => {
  try {
    const allowedFields = ['bio', 'specialization', 'communicationChannels', 'languages', 'yearsExperience', 'certifications', 'isAvailable', 'responseTime', 'maxClients'];
    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const manager = await AccountManager.findOneAndUpdate({ userId: req.user._id }, updates, { new: true }).populate('userId', 'name email profileImage');
    if (!manager) return res.status(404).json({ error: 'Manager profile not found.' });
    res.json({ success: true, manager });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getManagers = async (req, res) => {
  try {
    const { page = 1, limit = 20, specialization } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const filter = { isAvailable: true };
    if (specialization) filter.specialization = { $in: [specialization] };
    const [managers, total] = await Promise.all([
      AccountManager.find(filter).sort({ rating: -1 }).skip(skip).limit(lim).populate('userId', 'name email profileImage'),
      AccountManager.countDocuments(filter)
    ]);
    res.json({ success: true, managers, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getManagerById = async (req, res) => {
  try {
    const manager = await AccountManager.findById(req.params.id).populate('userId', 'name email profileImage');
    if (!manager) return res.status(404).json({ error: 'Manager not found.' });
    res.json({ success: true, manager });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const rateManager = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const manager = await AccountManager.findById(req.params.id);
    if (!manager) return res.status(404).json({ error: 'Manager not found.' });
    const alreadyReviewed = manager.reviews.some((r) => r.userId.toString() === req.user._id.toString());
    if (alreadyReviewed) return res.status(400).json({ error: 'You have already rated this manager.' });
    manager.addReview(req.user._id, parseInt(rating), comment);
    await manager.save();
    res.json({ success: true, rating: manager.rating, totalReviews: manager.totalReviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTopManagers = async (req, res) => {
  try {
    const managers = await AccountManager.find({ isAvailable: true }).sort({ rating: -1, totalReviews: -1 }).limit(10).populate('userId', 'name email profileImage');
    res.json({ success: true, managers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const DedicatedAccountManagerService = require('../models/DedicatedAccountManagerService');
    const manager = await AccountManager.findOne({ userId: req.user._id });
    if (!manager) return res.status(404).json({ error: 'Manager profile not found.' });
    const services = await DedicatedAccountManagerService.find({ managerId: manager._id });
    const active = services.filter((s) => s.status === 'active');
    res.json({
      success: true,
      stats: {
        totalClients: manager.currentClients,
        activeServices: active.length,
        rating: manager.rating,
        totalReviews: manager.totalReviews,
        totalRevenue: manager.totalRevenue,
        successRate: manager.successRate
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { registerManager, updateManagerProfile, getManagers, getManagerById, rateManager, getTopManagers, getDashboardStats };
