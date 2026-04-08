'use strict';

const express = require('express');
const router = express.Router();
const { configureAutomatedTrading, startAutomatedTrading, stopAutomatedTrading, getAutomatedTradingStatus, getTradingStats } = require('../controllers/automatedTradingController');
const { protect } = require('../middleware/auth');
const { checkTierPrivilege } = require('../middleware/tierPrivilege');

/**
 * @swagger
 * tags:
 *   name: AutomatedTrading
 *   description: Automated trading bot (Advanced/Premium tier)
 */

/**
 * @swagger
 * /api/automated-trading/configure:
 *   post:
 *     summary: Configure automated trading
 *     tags: [AutomatedTrading]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               strategy: { type: string, enum: [momentum, meanReversion, trendFollowing, aiSignal] }
 *               tradingPairs: { type: array, items: { type: string } }
 *               riskPercentage: { type: number }
 *               stopLossPercentage: { type: number }
 *               takeProfitPercentage: { type: number }
 *               maxDailyTrades: { type: integer }
 *     responses:
 *       200:
 *         description: Configured
 */
router.post('/configure', protect, checkTierPrivilege('automated_trading'), configureAutomatedTrading);

/**
 * @swagger
 * /api/automated-trading/start:
 *   post:
 *     summary: Start automated trading
 *     tags: [AutomatedTrading]
 *     responses:
 *       200:
 *         description: Started
 */
router.post('/start', protect, checkTierPrivilege('automated_trading'), startAutomatedTrading);

/**
 * @swagger
 * /api/automated-trading/stop:
 *   post:
 *     summary: Stop automated trading
 *     tags: [AutomatedTrading]
 *     responses:
 *       200:
 *         description: Stopped
 */
router.post('/stop', protect, stopAutomatedTrading);

/**
 * @swagger
 * /api/automated-trading/status:
 *   get:
 *     summary: Get automated trading status
 *     tags: [AutomatedTrading]
 *     responses:
 *       200:
 *         description: Status
 */
router.get('/status', protect, getAutomatedTradingStatus);

/**
 * @swagger
 * /api/automated-trading/stats:
 *   get:
 *     summary: Get automated trading stats
 *     tags: [AutomatedTrading]
 *     responses:
 *       200:
 *         description: Stats
 */
router.get('/stats', protect, getTradingStats);

module.exports = router;
