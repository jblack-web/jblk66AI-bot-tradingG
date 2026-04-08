'use strict';

const express = require('express');
const router = express.Router();
const { getReferralLink, getReferralStats, getReferralHistory, withdrawReferralBonus } = require('../controllers/referralController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Referrals
 *   description: Referral program
 */

/**
 * @swagger
 * /api/referrals/link:
 *   get:
 *     summary: Get referral link
 *     tags: [Referrals]
 *     responses:
 *       200:
 *         description: Referral link
 */
router.get('/link', protect, getReferralLink);

/**
 * @swagger
 * /api/referrals/stats:
 *   get:
 *     summary: Get referral statistics
 *     tags: [Referrals]
 *     responses:
 *       200:
 *         description: Referral stats
 */
router.get('/stats', protect, getReferralStats);

/**
 * @swagger
 * /api/referrals/history:
 *   get:
 *     summary: Get referral history
 *     tags: [Referrals]
 *     responses:
 *       200:
 *         description: Referral history
 */
router.get('/history', protect, getReferralHistory);

/**
 * @swagger
 * /api/referrals/withdraw-bonus:
 *   post:
 *     summary: Withdraw referral bonus to wallet
 *     tags: [Referrals]
 *     responses:
 *       200:
 *         description: Bonus withdrawn
 */
router.post('/withdraw-bonus', protect, withdrawReferralBonus);

module.exports = router;
