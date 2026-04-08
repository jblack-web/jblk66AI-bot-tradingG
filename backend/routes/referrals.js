const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const ReferralBonus = require('../models/ReferralBonus');

// GET /api/referrals/my-code
router.get('/my-code', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('referralCode referralEarnings');
    const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${user.referralCode}`;
    const referrals = await User.countDocuments({ referredBy: req.user._id });
    res.json({ success: true, referralCode: user.referralCode, referralLink, referralEarnings: user.referralEarnings, totalReferrals: referrals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/referrals/history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const bonuses = await ReferralBonus.find({ referrer: req.user._id })
      .populate('referred', 'username email createdAt')
      .sort({ createdAt: -1 });
    res.json({ success: true, bonuses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
