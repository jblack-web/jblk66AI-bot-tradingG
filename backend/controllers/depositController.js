'use strict';

const DepositTransaction = require('../models/DepositTransaction');
const Wallet = require('../models/Wallet');
const PromoCode = require('../models/PromoCode');
const PaymentGateway = require('../models/PaymentGateway');
const User = require('../models/User');
const { applyReferralBonus } = require('./referralController');
const { sendNotification } = require('../services/notificationService');
const { paginate } = require('../utils/helpers');

const getPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentGateway.find({ isActive: true, type: { $in: ['deposit', 'both'] } });
    res.json({ success: true, methods });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const initiateDeposit = async (req, res) => {
  try {
    const { amount, method, promoCode } = req.body;
    const parsedAmount = parseFloat(amount);

    let bonusAmount = 0;
    let promoCodeDoc = null;
    if (promoCode) {
      promoCodeDoc = await PromoCode.findOne({ code: promoCode.toUpperCase() });
      if (promoCodeDoc && promoCodeDoc.isValid()) {
        const alreadyUsed = promoCodeDoc.usedBy.some((u) => u.userId.toString() === req.user._id.toString());
        if (!alreadyUsed && parsedAmount >= promoCodeDoc.minDepositAmount) {
          bonusAmount = promoCodeDoc.calculateDiscount(parsedAmount);
        }
      }
    }

    const fee = parsedAmount * 0.01;
    const netAmount = parsedAmount - fee + bonusAmount;

    let stripePaymentIntentId = null;
    let stripeClientSecret = null;

    if (method === 'stripe' && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(parsedAmount * 100),
          currency: 'usd',
          metadata: { userId: req.user._id.toString() }
        });
        stripePaymentIntentId = paymentIntent.id;
        stripeClientSecret = paymentIntent.client_secret;
      } catch (stripeErr) {
        return res.status(400).json({ error: `Stripe error: ${stripeErr.message}` });
      }
    }

    const deposit = await DepositTransaction.create({
      userId: req.user._id,
      amount: parsedAmount,
      method,
      fee,
      netAmount,
      promoCode: promoCode ? promoCode.toUpperCase() : null,
      promoCodeId: promoCodeDoc ? promoCodeDoc._id : null,
      bonusAmount,
      stripePaymentIntentId,
      stripeClientSecret
    });

    res.status(201).json({
      success: true,
      deposit: { ...deposit.toObject(), stripeClientSecret: undefined },
      stripeClientSecret,
      message: 'Deposit initiated. Complete payment to credit your wallet.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const completeDeposit = async (req, res) => {
  try {
    const { depositId } = req.body;
    const deposit = await DepositTransaction.findOne({ _id: depositId, userId: req.user._id, status: 'pending' });
    if (!deposit) return res.status(404).json({ error: 'Pending deposit not found.' });

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

    await wallet.credit(deposit.netAmount, 'deposit', `Deposit via ${deposit.method}: $${deposit.amount}`);

    if (deposit.promoCodeId) {
      const promo = await PromoCode.findById(deposit.promoCodeId);
      if (promo) {
        promo.usedCount += 1;
        promo.usedBy.push({ userId: req.user._id });
        await promo.save();
      }
    }

    const user = await User.findById(req.user._id);
    if (user && user.referredBy && deposit.amount >= 50) {
      const refBonus = deposit.amount * 0.1;
      deposit.referralBonus = refBonus;
      await applyReferralBonus(user.referredBy, user._id, deposit.amount, deposit._id);
    }

    deposit.status = 'completed';
    deposit.completedAt = new Date();
    await deposit.save();

    await sendNotification({
      user,
      type: 'deposit',
      title: 'Deposit Successful',
      message: `$${deposit.netAmount.toFixed(2)} has been credited to your wallet.`
    });

    res.json({ success: true, deposit, newBalance: wallet.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDepositHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    const [deposits, total] = await Promise.all([
      DepositTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      DepositTransaction.countDocuments(filter)
    ]);
    res.json({ success: true, deposits, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDepositStats = async (req, res) => {
  try {
    const stats = await DepositTransaction.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getPaymentMethods, initiateDeposit, completeDeposit, getDepositHistory, getDepositStats };
