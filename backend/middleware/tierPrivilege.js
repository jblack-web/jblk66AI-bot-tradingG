'use strict';

const UserSubscription = require('../models/UserSubscription');

const tierHierarchy = { basic: 0, advanced: 1, premium: 2 };

const featureRequirements = {
  futures_trading: 'advanced',
  options_trading: 'advanced',
  automated_trading: 'advanced',
  advanced_analytics: 'advanced',
  api_access: 'premium',
  dedicated_account_manager: 'premium',
  high_leverage: 'premium',
  unlimited_trades: 'premium'
};

const checkTierPrivilege = (feature) => {
  return async (req, res, next) => {
    try {
      const requiredTier = featureRequirements[feature];
      if (!requiredTier) return next();

      const subscription = await UserSubscription.findOne({
        userId: req.user._id,
        status: 'active'
      });

      const userTierName = subscription ? subscription.tierName : req.user.tier || 'basic';
      const userTierLevel = tierHierarchy[userTierName] || 0;
      const requiredLevel = tierHierarchy[requiredTier] || 0;

      if (userTierLevel < requiredLevel) {
        return res.status(403).json({
          error: `This feature requires ${requiredTier} tier or above. Please upgrade your subscription.`,
          requiredTier,
          currentTier: userTierName,
          upgradeUrl: '/api/tiers/subscribe'
        });
      }

      req.userTier = userTierName;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { checkTierPrivilege };
