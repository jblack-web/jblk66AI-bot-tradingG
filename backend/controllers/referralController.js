'use strict';

const User = require('../models/User');
const ReferralBonus = require('../models/ReferralBonus');
const Wallet = require('../models/Wallet');
const { paginate } = require('../utils/helpers');

const getReferralLink = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.json({
      success: true,
      referralCode: user.referralCode,
      referralLink: `${baseUrl}/register?ref=${user.referralCode}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getReferralStats = async (req, res) => {
  try {
    const [referrals, bonuses] = await Promise.all([
      User.find({ referredBy: req.user._id }).select('name email createdAt'),
      ReferralBonus.find({ referrerId: req.user._id })
    ]);

    const totalEarned = bonuses.filter((b) => b.status === 'paid').reduce((acc, b) => acc + b.bonusAmount, 0);
    const pendingEarnings = bonuses.filter((b) => b.status === 'pending').reduce((acc, b) => acc + b.bonusAmount, 0);

    res.json({
      success: true,
      stats: {
        totalReferrals: referrals.length,
        totalEarned: parseFloat(totalEarned.toFixed(2)),
        pendingEarnings: parseFloat(pendingEarnings.toFixed(2)),
        paidBonuses: bonuses.filter((b) => b.status === 'paid').length
      },
      referrals
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getReferralHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const [bonuses, total] = await Promise.all([
      ReferralBonus.find({ referrerId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate('referredUserId', 'name email'),
      ReferralBonus.countDocuments({ referrerId: req.user._id })
    ]);
    res.json({ success: true, bonuses, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const withdrawReferralBonus = async (req, res) => {
  try {
    const pendingBonuses = await ReferralBonus.find({ referrerId: req.user._id, status: 'pending' });
    if (pendingBonuses.length === 0) return res.status(400).json({ error: 'No pending referral bonuses.' });

    const totalBonus = pendingBonuses.reduce((acc, b) => acc + b.bonusAmount, 0);

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

    await wallet.credit(totalBonus, 'referral_bonus', `Referral bonus withdrawal: ${pendingBonuses.length} bonus(es)`);

    await ReferralBonus.updateMany(
      { _id: { $in: pendingBonuses.map((b) => b._id) } },
      { $set: { status: 'paid', paidAt: new Date() } }
    );

    res.json({ success: true, message: `$${totalBonus.toFixed(2)} referral bonus added to your wallet.`, totalBonus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const applyReferralBonus = async (referrerId, referredUserId, depositAmount, depositTransactionId) => {
  try {
    const referrer = await User.findById(referrerId);
    if (!referrer) return;

    const bonusPercentage = 10;
    const bonusAmount = (depositAmount * bonusPercentage) / 100;

    await ReferralBonus.create({
      referrerId,
      referredUserId,
      depositAmount,
      bonusPercentage,
      bonusAmount,
      depositTransactionId
    });
  } catch (err) {
    console.error('applyReferralBonus error:', err.message);
  }
};

module.exports = { getReferralLink, getReferralStats, getReferralHistory, withdrawReferralBonus, applyReferralBonus };
