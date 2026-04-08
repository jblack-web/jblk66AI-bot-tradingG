const UserSubscription = require('../models/UserSubscription');
const UserTierPackage = require('../models/UserTierPackage');

const checkTierPrivilege = (feature) => async (req, res, next) => {
  try {
    const subscription = await UserSubscription.findOne({ user: req.user._id, status: 'active' })
      .populate('tier');

    if (!subscription || !subscription.tier) {
      return res.status(403).json({
        success: false,
        message: `Feature "${feature}" requires an active subscription.`,
      });
    }

    const tierFeatures = subscription.tier.features || {};
    if (!tierFeatures[feature]) {
      return res.status(403).json({
        success: false,
        message: `Feature "${feature}" is not available in your current tier (${subscription.tier.displayName}). Please upgrade.`,
        currentTier: subscription.tier.slug,
        requiredFeature: feature,
      });
    }

    req.subscription = subscription;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error checking tier privileges.' });
  }
};

module.exports = { checkTierPrivilege };
