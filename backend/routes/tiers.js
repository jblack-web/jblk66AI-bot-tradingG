const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const UserTierPackage = require('../models/UserTierPackage');
const UserSubscription = require('../models/UserSubscription');
const User = require('../models/User');

// GET /api/tiers - public
router.get('/', async (req, res) => {
  try {
    const tiers = await UserTierPackage.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, tiers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/tiers/subscribe
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { tierSlug, billingCycle } = req.body;
    const tier = await UserTierPackage.findOne({ slug: tierSlug, isActive: true });
    if (!tier) return res.status(404).json({ success: false, message: 'Tier not found.' });

    const price = billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
    const user = await User.findById(req.user._id);

    if (price > 0 && user.walletBalance < price) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
    }

    // Deduct price
    if (price > 0) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { walletBalance: -price } });
    }

    // Create/update subscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (billingCycle === 'yearly' ? 365 : 30));

    await UserSubscription.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        tier: tier._id,
        tierSlug: tier.slug,
        billingCycle: billingCycle || 'monthly',
        status: 'active',
        startDate: new Date(),
        endDate,
        nextBillingDate: endDate,
        amountPaid: price,
      },
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(req.user._id, { currentTier: tier.slug, tierExpiresAt: endDate });

    res.json({ success: true, message: `Subscribed to ${tier.displayName} plan.`, tier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tiers/my-subscription
router.get('/my-subscription', authMiddleware, async (req, res) => {
  try {
    const sub = await UserSubscription.findOne({ user: req.user._id }).populate('tier');
    res.json({ success: true, subscription: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
