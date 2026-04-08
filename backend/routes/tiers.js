'use strict';

const express = require('express');
const router = express.Router();
const { getTiers, getTierById, compareTiers, createTier, updateTier, deleteTier, getTierStats } = require('../controllers/userTierPackageController');
const { subscribe, getSubscription, cancelSubscription, getSubscriptionHistory } = require('../controllers/userSubscriptionController');
const { protect, restrictTo } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Tiers
 *   description: Subscription tiers and packages
 */

/**
 * @swagger
 * /api/tiers:
 *   get:
 *     summary: Get all available tiers
 *     tags: [Tiers]
 *     responses:
 *       200:
 *         description: Tiers list
 */
router.get('/', getTiers);

/**
 * @swagger
 * /api/tiers/compare:
 *   get:
 *     summary: Compare tier features
 *     tags: [Tiers]
 *     responses:
 *       200:
 *         description: Tier comparison
 */
router.get('/compare', compareTiers);

/**
 * @swagger
 * /api/tiers/subscribe:
 *   post:
 *     summary: Subscribe to a tier
 *     tags: [Tiers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tierName]
 *             properties:
 *               tierName: { type: string, enum: [basic, advanced, premium] }
 *               billingCycle: { type: string, enum: [monthly, yearly] }
 *     responses:
 *       200:
 *         description: Subscribed
 */
router.post('/subscribe', protect, subscribe);

/**
 * @swagger
 * /api/tiers/my-subscription:
 *   get:
 *     summary: Get current subscription
 *     tags: [Tiers]
 *     responses:
 *       200:
 *         description: Subscription details
 */
router.get('/my-subscription', protect, getSubscription);

/**
 * @swagger
 * /api/tiers/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Tiers]
 *     responses:
 *       200:
 *         description: Cancelled
 */
router.post('/cancel', protect, cancelSubscription);

/**
 * @swagger
 * /api/tiers/subscription-history:
 *   get:
 *     summary: Get subscription history
 *     tags: [Tiers]
 *     responses:
 *       200:
 *         description: History
 */
router.get('/subscription-history', protect, getSubscriptionHistory);

/**
 * @swagger
 * /api/tiers/stats/revenue:
 *   get:
 *     summary: Get tier revenue stats (admin)
 *     tags: [Tiers]
 *     responses:
 *       200:
 *         description: Revenue stats
 */
router.get('/stats/revenue', protect, restrictTo('admin'), getTierStats);

/**
 * @swagger
 * /api/tiers/{id}:
 *   get:
 *     summary: Get tier by ID
 *     tags: [Tiers]
 *     responses:
 *       200:
 *         description: Tier details
 */
router.get('/:id', getTierById);

/**
 * @swagger
 * /api/tiers:
 *   post:
 *     summary: Create tier (admin)
 *     tags: [Tiers]
 *     responses:
 *       201:
 *         description: Tier created
 */
router.post('/', protect, restrictTo('admin'), createTier);

/**
 * @swagger
 * /api/tiers/{id}:
 *   put:
 *     summary: Update tier (admin)
 *     tags: [Tiers]
 *     responses:
 *       200:
 *         description: Tier updated
 */
router.put('/:id', protect, restrictTo('admin'), updateTier);

/**
 * @swagger
 * /api/tiers/{id}:
 *   delete:
 *     summary: Delete/deactivate tier (admin)
 *     tags: [Tiers]
 *     responses:
 *       200:
 *         description: Tier deleted
 */
router.delete('/:id', protect, restrictTo('admin'), deleteTier);

module.exports = router;
