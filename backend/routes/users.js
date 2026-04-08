const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/users/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone', 'country', 'avatar', 'preferredCurrency'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/wallet
router.get('/wallet', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance savingsBalance totalDeposited totalWithdrawn totalEarnings referralEarnings');
    res.json({ success: true, wallet: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
