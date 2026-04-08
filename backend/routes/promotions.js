const express = require('express');
const router = express.Router();
const Promotion = require('../models/Promotion');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const promos = await Promotion.find({
      isActive: true,
      $or: [{ validFrom: { $lte: now } }, { validFrom: null }],
      $or: [{ validTo: { $gte: now } }, { validTo: null }],
    }).select('code description discountPercentage discountAmount validTo tierRestrictions');

    res.json({ promotions: promos });
  } catch (err) {
    console.error('Get promotions error:', err);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
});

router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { code, tier } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Promo code is required' });
    }

    const now = new Date();
    const promo = await Promotion.findOne({
      code: code.toUpperCase(),
      isActive: true,
      $or: [{ validFrom: { $lte: now } }, { validFrom: null }],
      $or: [{ validTo: { $gte: now } }, { validTo: null }],
    });

    if (!promo) {
      return res.status(404).json({ valid: false, error: 'Invalid or expired promo code' });
    }

    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      return res.status(400).json({ valid: false, error: 'Promo code usage limit reached' });
    }

    if (tier && promo.tierRestrictions && promo.tierRestrictions.length > 0) {
      if (!promo.tierRestrictions.includes(tier)) {
        return res
          .status(400)
          .json({ valid: false, error: `Promo code not valid for ${tier} tier` });
      }
    }

    res.json({
      valid: true,
      promo: {
        code: promo.code,
        description: promo.description,
        discountPercentage: promo.discountPercentage,
        discountAmount: promo.discountAmount,
        tierRestrictions: promo.tierRestrictions,
      },
    });
  } catch (err) {
    console.error('Validate promo error:', err);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

module.exports = router;
