const Referral = require('../models/Referral');
const User = require('../models/User');

exports.getReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({ referrerId: req.user._id })
      .populate('referredId', 'name email createdAt')
      .sort('-createdAt');
    res.json({ success: true, referrals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReferralStats = async (req, res) => {
  try {
    const referrals = await Referral.find({ referrerId: req.user._id });
    const stats = {
      total: referrals.length,
      active: referrals.filter((r) => r.status === 'active').length,
      pending: referrals.filter((r) => r.status === 'pending').length,
      paid: referrals.filter((r) => r.status === 'paid').length,
      totalCommission: referrals.reduce((s, r) => s + r.commission, 0),
    };
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.generateReferralLink = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('referralCode');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontendUrl}/register?ref=${user.referralCode}`;
    res.json({ success: true, referralCode: user.referralCode, link });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
