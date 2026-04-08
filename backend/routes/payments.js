'use strict';

const express = require('express');
const router = express.Router();
const { getPaymentMethods, initiateDeposit, completeDeposit, getDepositHistory, getDepositStats } = require('../controllers/depositController');
const { requestWithdrawal, cancelWithdrawal, getWithdrawalHistory, getPendingWithdrawals, approveWithdrawal, rejectWithdrawal, completeWithdrawal, getWithdrawalStats } = require('../controllers/withdrawalController');
const { protect, restrictTo } = require('../middleware/auth');
const { depositValidation, withdrawalValidation } = require('../middleware/inputValidation');
const { paymentLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Deposits and withdrawals
 */

/**
 * @swagger
 * /api/payments/payment-methods:
 *   get:
 *     summary: Get available payment methods
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Payment methods
 */
router.get('/payment-methods', protect, getPaymentMethods);

/**
 * @swagger
 * /api/payments/deposit/initiate:
 *   post:
 *     summary: Initiate a deposit
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, method]
 *             properties:
 *               amount: { type: number, minimum: 10 }
 *               method: { type: string }
 *               promoCode: { type: string }
 *     responses:
 *       201:
 *         description: Deposit initiated
 */
router.post('/deposit/initiate', protect, paymentLimiter, depositValidation, initiateDeposit);

/**
 * @swagger
 * /api/payments/deposit/complete:
 *   post:
 *     summary: Complete a deposit
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Deposit completed
 */
router.post('/deposit/complete', protect, completeDeposit);

/**
 * @swagger
 * /api/payments/deposit/history:
 *   get:
 *     summary: Get deposit history
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Deposit history
 */
router.get('/deposit/history', protect, getDepositHistory);

/**
 * @swagger
 * /api/payments/deposit/stats:
 *   get:
 *     summary: Get deposit stats (admin)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Deposit stats
 */
router.get('/deposit/stats', protect, restrictTo('admin'), getDepositStats);

/**
 * @swagger
 * /api/payments/withdrawal/request:
 *   post:
 *     summary: Request a withdrawal
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, method, destinationDetails]
 *             properties:
 *               amount: { type: number, minimum: 10 }
 *               method: { type: string }
 *               destinationDetails: { type: object }
 *     responses:
 *       201:
 *         description: Withdrawal requested
 */
router.post('/withdrawal/request', protect, paymentLimiter, withdrawalValidation, requestWithdrawal);

/**
 * @swagger
 * /api/payments/withdrawal/history:
 *   get:
 *     summary: Get withdrawal history
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Withdrawal history
 */
router.get('/withdrawal/history', protect, getWithdrawalHistory);

/**
 * @swagger
 * /api/payments/withdrawal/{id}/cancel:
 *   post:
 *     summary: Cancel a pending withdrawal
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Withdrawal cancelled
 */
router.post('/withdrawal/:id/cancel', protect, cancelWithdrawal);

/**
 * @swagger
 * /api/payments/withdrawal/pending:
 *   get:
 *     summary: Get pending withdrawals (admin)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Pending withdrawals
 */
router.get('/withdrawal/pending', protect, restrictTo('admin'), getPendingWithdrawals);

/**
 * @swagger
 * /api/payments/withdrawal/{id}/approve:
 *   post:
 *     summary: Approve withdrawal (admin)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Approved
 */
router.post('/withdrawal/:id/approve', protect, restrictTo('admin'), approveWithdrawal);

/**
 * @swagger
 * /api/payments/withdrawal/{id}/reject:
 *   post:
 *     summary: Reject withdrawal (admin)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Rejected
 */
router.post('/withdrawal/:id/reject', protect, restrictTo('admin'), rejectWithdrawal);

/**
 * @swagger
 * /api/payments/withdrawal/{id}/complete:
 *   post:
 *     summary: Complete/process withdrawal (admin)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Completed
 */
router.post('/withdrawal/:id/complete', protect, restrictTo('admin'), completeWithdrawal);

/**
 * @swagger
 * /api/payments/withdrawal/stats:
 *   get:
 *     summary: Get withdrawal stats (admin)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Withdrawal stats
 */
router.get('/withdrawal/stats', protect, restrictTo('admin'), getWithdrawalStats);

module.exports = router;
