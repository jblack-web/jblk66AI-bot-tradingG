'use strict';

const express = require('express');
const router = express.Router();
const { getWallet, getTransactions, getStats } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet management
 */

/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: Get user wallet
 *     tags: [Wallet]
 *     responses:
 *       200:
 *         description: Wallet data
 */
router.get('/', protect, getWallet);

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     summary: Get wallet transactions
 *     tags: [Wallet]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transactions list
 */
router.get('/transactions', protect, getTransactions);

/**
 * @swagger
 * /api/wallet/stats:
 *   get:
 *     summary: Get wallet stats
 *     tags: [Wallet]
 *     responses:
 *       200:
 *         description: Wallet statistics
 */
router.get('/stats', protect, getStats);

module.exports = router;
