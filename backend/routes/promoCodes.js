const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const PromoCode = require('../models/PromoCode');

// POST /api/promo-codes/validate
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const { code, amount } = req.body;
    const promo = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });
    if (!promo) return res.status(404).json({ success: false, message: 'Invalid promo code.' });

    const now = new Date();
    if (promo.validUntil && promo.validUntil < now) {
      return res.status(400).json({ success: false, message: 'Promo code has expired.' });
    }
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ success: false, message: 'Promo code usage limit reached.' });
    }
    if (amount && promo.minDepositAmount > amount) {
      return res.status(400).json({ success: false, message: `Minimum deposit of $${promo.minDepositAmount} required.` });
    }

    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = (amount * promo.discountValue) / 100;
      if (promo.maxDiscountAmount) discount = Math.min(discount, promo.maxDiscountAmount);
    } else {
      discount = promo.discountValue;
    }

    res.json({
      success: true,
      valid: true,
      discount,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      description: promo.description,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
