'use strict';

const express = require('express');
const router = express.Router();
const { openFuturesPosition, closeFuturesPosition, getFuturesPositions, getFuturesHistory, updateStopLoss, updateTakeProfit, getFuturesStats } = require('../controllers/futuresController');
const { protect } = require('../middleware/auth');
const { checkTierPrivilege } = require('../middleware/tierPrivilege');
const { futuresValidation } = require('../middleware/inputValidation');
const { tradingLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Futures
 *   description: Futures trading (Advanced/Premium tier)
 */

/**
 * @swagger
 * /api/futures/open:
 *   post:
 *     summary: Open a futures position
 *     tags: [Futures]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [asset, direction, size, leverage]
 *             properties:
 *               asset: { type: string }
 *               direction: { type: string, enum: [long, short] }
 *               size: { type: number }
 *               leverage: { type: integer, minimum: 1, maximum: 20 }
 *               stopLoss: { type: number }
 *               takeProfit: { type: number }
 *     responses:
 *       201:
 *         description: Position opened
 */
router.post('/open', protect, checkTierPrivilege('futures_trading'), tradingLimiter, futuresValidation, openFuturesPosition);

/**
 * @swagger
 * /api/futures/{id}/close:
 *   put:
 *     summary: Close a futures position
 *     tags: [Futures]
 *     responses:
 *       200:
 *         description: Position closed
 */
router.put('/:id/close', protect, closeFuturesPosition);

/**
 * @swagger
 * /api/futures/positions:
 *   get:
 *     summary: Get open futures positions
 *     tags: [Futures]
 *     responses:
 *       200:
 *         description: Open positions
 */
router.get('/positions', protect, getFuturesPositions);

/**
 * @swagger
 * /api/futures/history:
 *   get:
 *     summary: Get futures history
 *     tags: [Futures]
 *     responses:
 *       200:
 *         description: Futures history
 */
router.get('/history', protect, getFuturesHistory);

/**
 * @swagger
 * /api/futures/stats:
 *   get:
 *     summary: Get futures statistics
 *     tags: [Futures]
 *     responses:
 *       200:
 *         description: Futures stats
 */
router.get('/stats', protect, getFuturesStats);

/**
 * @swagger
 * /api/futures/{id}/stop-loss:
 *   put:
 *     summary: Update stop loss
 *     tags: [Futures]
 *     responses:
 *       200:
 *         description: Stop loss updated
 */
router.put('/:id/stop-loss', protect, updateStopLoss);

/**
 * @swagger
 * /api/futures/{id}/take-profit:
 *   put:
 *     summary: Update take profit
 *     tags: [Futures]
 *     responses:
 *       200:
 *         description: Take profit updated
 */
router.put('/:id/take-profit', protect, updateTakeProfit);

module.exports = router;
