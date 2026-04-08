'use strict';

const express = require('express');
const router = express.Router();
const { createPromoCode, updatePromoCode, deletePromoCode, getPromoCodes, applyPromoCode, getPromoCodeStats } = require('../controllers/promoCodeController');
const { protect, restrictTo } = require('../middleware/auth');
const { promoCodeValidation } = require('../middleware/inputValidation');

/**
 * @swagger
 * tags:
 *   name: PromoCodes
 *   description: Promo code management
 */

/**
 * @swagger
 * /api/promo-codes:
 *   get:
 *     summary: Get all promo codes (admin)
 *     tags: [PromoCodes]
 *     responses:
 *       200:
 *         description: Promo codes list
 */
router.get('/', protect, restrictTo('admin'), getPromoCodes);

/**
 * @swagger
 * /api/promo-codes:
 *   post:
 *     summary: Create promo code (admin)
 *     tags: [PromoCodes]
 *     responses:
 *       201:
 *         description: Promo code created
 */
router.post('/', protect, restrictTo('admin'), promoCodeValidation, createPromoCode);

/**
 * @swagger
 * /api/promo-codes/apply:
 *   post:
 *     summary: Apply a promo code
 *     tags: [PromoCodes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               amount: { type: number }
 *     responses:
 *       200:
 *         description: Discount applied
 */
router.post('/apply', protect, applyPromoCode);

/**
 * @swagger
 * /api/promo-codes/stats:
 *   get:
 *     summary: Get promo code stats (admin)
 *     tags: [PromoCodes]
 *     responses:
 *       200:
 *         description: Promo stats
 */
router.get('/stats', protect, restrictTo('admin'), getPromoCodeStats);

/**
 * @swagger
 * /api/promo-codes/{id}:
 *   put:
 *     summary: Update promo code (admin)
 *     tags: [PromoCodes]
 *     responses:
 *       200:
 *         description: Promo code updated
 */
router.put('/:id', protect, restrictTo('admin'), updatePromoCode);

/**
 * @swagger
 * /api/promo-codes/{id}:
 *   delete:
 *     summary: Delete/deactivate promo code (admin)
 *     tags: [PromoCodes]
 *     responses:
 *       200:
 *         description: Promo code deleted
 */
router.delete('/:id', protect, restrictTo('admin'), deletePromoCode);

module.exports = router;
