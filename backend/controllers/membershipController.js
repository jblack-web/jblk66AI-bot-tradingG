const Membership = require('../models/Membership');
const User = require('../models/User');
const Promotion = require('../models/Promotion');

const TIER_FEATURES = {
  free: ['10 TH/s Mining Power', 'Daily earnings $1-$3', '7-day free trial', 'Basic support'],
  basic: [
    '50 TH/s Mining Power',
    'Daily earnings $5-$15',
    'Options trading access',
    'Email support',
    'Market data access',
  ],
  advanced: [
    '200 TH/s Mining Power',
    'Daily earnings $30-$75',
    'Options & Futures trading',
    'Priority support',
    'Advanced analytics',
    'Referral bonuses',
  ],
  premium: [
    '500 TH/s Mining Power',
    'Daily earnings $150-$375',
    'All trading instruments',
    '24/7 VIP support',
    'Custom strategies',
    'Dedicated account manager',
    'Maximum referral bonuses',
  ],
};

const getTiers = async (req, res) => {
  try {
    const tiers = ['free', 'basic', 'advanced', 'premium'].map((tier) => ({
      tier,
      ...Membership.getTierConfig(tier),
      features: TIER_FEATURES[tier],
    }));

    res.json({ tiers });
  } catch (err) {
    console.error('Get tiers error:', err);
    res.status(500).json({ error: 'Failed to fetch tiers' });
  }
};

const getCurrentMembership = async (req, res) => {
  try {
    const membership = await Membership.findOne({ user: req.user._id, isActive: true }).sort({
      createdAt: -1,
    });

    if (!membership) {
      return res.status(404).json({ error: 'No active membership found' });
    }

    res.json({ membership });
  } catch (err) {
    console.error('Get membership error:', err);
    res.status(500).json({ error: 'Failed to fetch membership' });
  }
};

const upgradeMembership = async (req, res) => {
  try {
    const { tier, promoCode, paymentMethod, autoRenewal } = req.body;

    const validTiers = ['basic', 'advanced', 'premium'];
    if (!tier || !validTiers.includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier. Choose from: basic, advanced, premium' });
    }

    const tierConfig = Membership.getTierConfig(tier);
    let price = tierConfig.price;
    let discountApplied = 0;
    let appliedPromoCode = null;

    if (promoCode) {
      const now = new Date();
      const promo = await Promotion.findOne({
        code: promoCode.toUpperCase(),
        isActive: true,
        $or: [{ validFrom: { $lte: now } }, { validFrom: null }],
        $or: [{ validTo: { $gte: now } }, { validTo: null }],
      });

      if (!promo) {
        return res.status(400).json({ error: 'Invalid or expired promo code' });
      }

      if (promo.maxUses && promo.currentUses >= promo.maxUses) {
        return res.status(400).json({ error: 'Promo code usage limit reached' });
      }

      if (promo.tierRestrictions && promo.tierRestrictions.length > 0) {
        if (!promo.tierRestrictions.includes(tier)) {
          return res
            .status(400)
            .json({ error: `Promo code not valid for ${tier} tier` });
        }
      }

      if (promo.discountPercentage) {
        discountApplied = (price * promo.discountPercentage) / 100;
      } else if (promo.discountAmount) {
        discountApplied = promo.discountAmount;
      }

      price = Math.max(0, price - discountApplied);
      appliedPromoCode = promo.code;

      promo.currentUses += 1;
      await promo.save();
    }

    await Membership.updateMany({ user: req.user._id, isActive: true }, { isActive: false });

    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const membership = new Membership({
      user: req.user._id,
      tier,
      miningPower: tierConfig.miningPower,
      dailyEarningsMin: tierConfig.dailyEarningsMin,
      dailyEarningsMax: tierConfig.dailyEarningsMax,
      price,
      startDate: now,
      endDate,
      isActive: true,
      autoRenewal: autoRenewal || false,
      promoCode: appliedPromoCode,
      discountApplied,
      upgradeSource: 'user_upgrade',
      paymentMethod,
      conversionStatus: 'converted',
    });

    await membership.save();

    await User.findByIdAndUpdate(req.user._id, { membership: membership._id });

    res.status(201).json({
      message: `Successfully upgraded to ${tier} tier`,
      membership,
      pricePaid: price,
      discountApplied,
    });
  } catch (err) {
    console.error('Upgrade membership error:', err);
    res.status(500).json({ error: 'Failed to upgrade membership' });
  }
};

const extendFreeTrial = async (req, res) => {
  try {
    const membership = await Membership.findOne({
      user: req.user._id,
      tier: 'free',
      isActive: true,
    });

    if (!membership) {
      return res.status(404).json({ error: 'No active free trial found' });
    }

    const currentEnd = membership.trialEndDate || new Date();
    const newEnd = new Date(currentEnd);
    newEnd.setDate(newEnd.getDate() + 7);

    membership.trialEndDate = newEnd;
    membership.trialExtensionCount = (membership.trialExtensionCount || 0) + 1;
    await membership.save();

    res.json({
      message: 'Free trial extended by 7 days',
      newTrialEndDate: newEnd,
      extensionCount: membership.trialExtensionCount,
    });
  } catch (err) {
    console.error('Extend trial error:', err);
    res.status(500).json({ error: 'Failed to extend free trial' });
  }
};

const getMembershipHistory = async (req, res) => {
  try {
    const memberships = await Membership.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({ memberships });
  } catch (err) {
    console.error('Get membership history error:', err);
    res.status(500).json({ error: 'Failed to fetch membership history' });
  }
};

module.exports = {
  getTiers,
  getCurrentMembership,
  upgradeMembership,
  extendFreeTrial,
  getMembershipHistory,
};
