'use strict';

const PromoCode = require('../models/PromoCode');
const { paginate } = require('../utils/helpers');

const createPromoCode = async (req, res) => {
  try {
    const { code, discountType, discountValue, maxUses, expiryDate, description, applicableTo, minDepositAmount } = req.body;
    const existing = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(409).json({ error: 'Promo code already exists.' });

    const promo = await PromoCode.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      maxUses,
      expiryDate,
      description,
      applicableTo,
      minDepositAmount,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, promo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePromoCode = async (req, res) => {
  try {
    const allowedFields = ['discountType', 'discountValue', 'maxUses', 'expiryDate', 'isActive', 'description'];
    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const promo = await PromoCode.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!promo) return res.status(404).json({ error: 'Promo code not found.' });
    res.json({ success: true, promo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePromoCode = async (req, res) => {
  try {
    await PromoCode.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Promo code deactivated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPromoCodes = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const [promos, total] = await Promise.all([
      PromoCode.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).populate('createdBy', 'name email'),
      PromoCode.countDocuments(filter)
    ]);
    res.json({ success: true, promos, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const applyPromoCode = async (req, res) => {
  try {
    const { code, amount } = req.body;
    const promo = await PromoCode.findOne({ code: code.toUpperCase() });
    if (!promo) return res.status(404).json({ error: 'Invalid promo code.' });
    if (!promo.isValid()) return res.status(400).json({ error: 'Promo code is expired or no longer valid.' });
    if (amount < promo.minDepositAmount) return res.status(400).json({ error: `Minimum amount for this code is $${promo.minDepositAmount}.` });

    const alreadyUsed = promo.usedBy.some((u) => u.userId.toString() === req.user._id.toString());
    if (alreadyUsed) return res.status(400).json({ error: 'You have already used this promo code.' });

    const discount = promo.calculateDiscount(amount);
    res.json({ success: true, discount, discountType: promo.discountType, discountValue: promo.discountValue, promoId: promo._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPromoCodeStats = async (req, res) => {
  try {
    const promos = await PromoCode.find({});
    const totalRevenue = 0;
    res.json({
      success: true,
      stats: {
        total: promos.length,
        active: promos.filter((p) => p.isActive).length,
        expired: promos.filter((p) => new Date() > new Date(p.expiryDate)).length,
        totalUses: promos.reduce((acc, p) => acc + p.usedCount, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createPromoCode, updatePromoCode, deletePromoCode, getPromoCodes, applyPromoCode, getPromoCodeStats };
