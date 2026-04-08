'use strict';

const UserSubscription = require('../models/UserSubscription');
const UserTierPackage = require('../models/UserTierPackage');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

const subscribe = async (req, res) => {
  try {
    const { tierName, billingCycle = 'monthly' } = req.body;

    const tier = await UserTierPackage.findOne({ name: tierName, isActive: true });
    if (!tier) return res.status(404).json({ error: 'Tier not found.' });

    const price = billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
    if (price > 0) {
      const wallet = await Wallet.findOne({ userId: req.user._id });
      if (!wallet || wallet.balance < price) return res.status(400).json({ error: 'Insufficient balance.' });
      await wallet.debit(price, 'subscription_fee', `${tier.displayName} subscription (${billingCycle})`);
    }

    const durationMs = billingCycle === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const endDate = billingCycle === 'free' ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) : new Date(Date.now() + durationMs);

    const existing = await UserSubscription.findOne({ userId: req.user._id });
    if (existing) {
      existing.tierChanges.push({ fromTier: existing.tierName, toTier: tierName, reason: 'upgrade/subscribe' });
      existing.tierId = tier._id;
      existing.tierName = tierName;
      existing.billingCycle = billingCycle;
      existing.startDate = new Date();
      existing.endDate = endDate;
      existing.status = 'active';
      existing.price = price;
      if (price > 0) existing.paymentHistory.push({ amount: price, date: new Date(), method: 'wallet' });
      await existing.save();
    } else {
      await UserSubscription.create({
        userId: req.user._id,
        tierId: tier._id,
        tierName,
        billingCycle,
        endDate,
        status: 'active',
        price,
        paymentHistory: price > 0 ? [{ amount: price, date: new Date(), method: 'wallet' }] : []
      });
    }

    await User.findByIdAndUpdate(req.user._id, { tier: tierName });

    const subscription = await UserSubscription.findOne({ userId: req.user._id }).populate('tierId');
    res.json({ success: true, subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSubscription = async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({ userId: req.user._id }).populate('tierId');
    if (!subscription) return res.status(404).json({ error: 'No subscription found.' });
    res.json({ success: true, subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({ userId: req.user._id });
    if (!subscription) return res.status(404).json({ error: 'No subscription found.' });
    subscription.autoRenew = false;
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancelReason = req.body.reason || 'User requested cancellation';
    await subscription.save();
    res.json({ success: true, message: 'Subscription cancelled. Access continues until end date.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSubscriptionHistory = async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({ userId: req.user._id }).populate('tierId');
    if (!subscription) return res.status(404).json({ error: 'No subscription found.' });
    res.json({ success: true, paymentHistory: subscription.paymentHistory, tierChanges: subscription.tierChanges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { subscribe, getSubscription, cancelSubscription, getSubscriptionHistory };
