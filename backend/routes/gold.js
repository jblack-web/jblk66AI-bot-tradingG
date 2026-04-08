'use strict';

const express = require('express');
const router = express.Router();
const { buyGold, sellGold, getGoldPositions, getGoldHistory, getGoldPrice, getGoldStats, openGoldFutures, openGoldOptions } = require('../controllers/goldController');
const { protect } = require('../middleware/auth');
const { tradingLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Gold
 *   description: Gold trading (XAUUSD)
 */

/**
 * @swagger
 * /api/gold/price:
 *   get:
 *     summary: Get current gold price (XAUUSD)
 *     tags: [Gold]
 *     responses:
 *       200:
 *         description: Current gold price
 */
router.get('/price', protect, getGoldPrice);

/**
 * @swagger
 * /api/gold/buy:
 *   post:
 *     summary: Buy gold (spot)
 *     tags: [Gold]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: number, description: 'Troy ounces' }
 *               stopLoss: { type: number }
 *               takeProfit: { type: number }
 *     responses:
 *       201:
 *         description: Gold bought
 */
router.post('/buy', protect, tradingLimiter, buyGold);

/**
 * @swagger
 * /api/gold/sell:
 *   post:
 *     summary: Sell gold (close position)
 *     tags: [Gold]
 *     responses:
 *       200:
 *         description: Gold sold
 */
router.post('/sell', protect, tradingLimiter, sellGold);

/**
 * @swagger
 * /api/gold/positions:
 *   get:
 *     summary: Get open gold positions
 *     tags: [Gold]
 *     responses:
 *       200:
 *         description: Open gold positions
 */
router.get('/positions', protect, getGoldPositions);

/**
 * @swagger
 * /api/gold/history:
 *   get:
 *     summary: Get gold trade history
 *     tags: [Gold]
 *     responses:
 *       200:
 *         description: Gold history
 */
router.get('/history', protect, getGoldHistory);

/**
 * @swagger
 * /api/gold/stats:
 *   get:
 *     summary: Get gold trading statistics
 *     tags: [Gold]
 *     responses:
 *       200:
 *         description: Gold stats
 */
router.get('/stats', protect, getGoldStats);

/**
 * @swagger
 * /api/gold/futures/open:
 *   post:
 *     summary: Open gold futures position
 *     tags: [Gold]
 *     responses:
 *       201:
 *         description: Gold futures position opened
 */
router.post('/futures/open', protect, tradingLimiter, openGoldFutures);

/**
 * @swagger
 * /api/gold/options/place:
 *   post:
 *     summary: Place gold options order
 *     tags: [Gold]
 *     responses:
 *       201:
 *         description: Gold options order placed
 */
router.post('/options/place', protect, tradingLimiter, openGoldOptions);

module.exports = router;
