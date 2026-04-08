'use strict';

const express = require('express');
const router = express.Router();
const { placeOptionOrder, getActiveOptions, closeOption, getOptionsHistory, getOptionsStats, calculateOptionPremium } = require('../controllers/optionsController');
const { protect } = require('../middleware/auth');
const { checkTierPrivilege } = require('../middleware/tierPrivilege');
const { optionsValidation } = require('../middleware/inputValidation');
const { tradingLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Options
 *   description: Options trading (Advanced/Premium tier)
 */

/**
 * @swagger
 * /api/options/calculate-premium:
 *   get:
 *     summary: Calculate option premium (Black-Scholes)
 *     tags: [Options]
 *     parameters:
 *       - in: query
 *         name: asset
 *         schema: { type: string }
 *       - in: query
 *         name: optionType
 *         schema: { type: string, enum: [call, put] }
 *       - in: query
 *         name: strikePrice
 *         schema: { type: number }
 *       - in: query
 *         name: expiryDate
 *         schema: { type: string }
 *       - in: query
 *         name: impliedVolatility
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Premium and Greeks
 */
router.get('/calculate-premium', protect, calculateOptionPremium);

/**
 * @swagger
 * /api/options/place:
 *   post:
 *     summary: Place an options order
 *     tags: [Options]
 *     responses:
 *       201:
 *         description: Option order placed
 */
router.post('/place', protect, checkTierPrivilege('options_trading'), tradingLimiter, optionsValidation, placeOptionOrder);

/**
 * @swagger
 * /api/options:
 *   get:
 *     summary: Get active options
 *     tags: [Options]
 *     responses:
 *       200:
 *         description: Active options list
 */
router.get('/', protect, getActiveOptions);

/**
 * @swagger
 * /api/options/history:
 *   get:
 *     summary: Get options history
 *     tags: [Options]
 *     responses:
 *       200:
 *         description: Options history
 */
router.get('/history', protect, getOptionsHistory);

/**
 * @swagger
 * /api/options/stats:
 *   get:
 *     summary: Get options statistics
 *     tags: [Options]
 *     responses:
 *       200:
 *         description: Options stats
 */
router.get('/stats', protect, getOptionsStats);

/**
 * @swagger
 * /api/options/{id}/close:
 *   put:
 *     summary: Close an option
 *     tags: [Options]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Option closed
 */
router.put('/:id/close', protect, closeOption);

module.exports = router;
