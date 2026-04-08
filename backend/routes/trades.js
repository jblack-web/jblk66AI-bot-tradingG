'use strict';

const express = require('express');
const router = express.Router();
const { getTradeHistory, getTradeById, getTradeStats, closeTrade } = require('../controllers/tradeController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Trades
 *   description: Trade history and management
 */

/**
 * @swagger
 * /api/trades:
 *   get:
 *     summary: Get trade history
 *     tags: [Trades]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, closed, cancelled] }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trade list
 */
router.get('/', protect, getTradeHistory);

/**
 * @swagger
 * /api/trades/stats:
 *   get:
 *     summary: Get trade statistics
 *     tags: [Trades]
 *     responses:
 *       200:
 *         description: Trade stats
 */
router.get('/stats', protect, getTradeStats);

/**
 * @swagger
 * /api/trades/{id}:
 *   get:
 *     summary: Get trade by ID
 *     tags: [Trades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trade details
 */
router.get('/:id', protect, getTradeById);

/**
 * @swagger
 * /api/trades/{id}/close:
 *   put:
 *     summary: Close a trade
 *     tags: [Trades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trade closed
 */
router.put('/:id/close', protect, closeTrade);

module.exports = router;
