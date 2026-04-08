'use strict';

const express = require('express');
const router = express.Router();
const { registerManager, updateManagerProfile, getManagers, getManagerById, rateManager, getTopManagers, getDashboardStats } = require('../controllers/accountManagerController');
const { subscribe, getService, cancelService, scheduleMeeting, addMeetingNotes, getServiceStats } = require('../controllers/dedicatedAccountManagerServiceController');
const { protect, restrictTo } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: AccountManager
 *   description: Account manager services
 */

/**
 * @swagger
 * /api/account-manager/managers:
 *   get:
 *     summary: Get available account managers
 *     tags: [AccountManager]
 *     responses:
 *       200:
 *         description: Managers list
 */
router.get('/managers', protect, getManagers);

/**
 * @swagger
 * /api/account-manager/managers/top:
 *   get:
 *     summary: Get top-rated managers
 *     tags: [AccountManager]
 *     responses:
 *       200:
 *         description: Top managers
 */
router.get('/managers/top', protect, getTopManagers);

/**
 * @swagger
 * /api/account-manager/managers/{id}:
 *   get:
 *     summary: Get manager by ID
 *     tags: [AccountManager]
 *     responses:
 *       200:
 *         description: Manager details
 */
router.get('/managers/:id', protect, getManagerById);

/**
 * @swagger
 * /api/account-manager/register:
 *   post:
 *     summary: Register as an account manager
 *     tags: [AccountManager]
 *     responses:
 *       201:
 *         description: Manager registered
 */
router.post('/register', protect, registerManager);

/**
 * @swagger
 * /api/account-manager/profile:
 *   put:
 *     summary: Update manager profile
 *     tags: [AccountManager]
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', protect, restrictTo('accountManager', 'admin'), updateManagerProfile);

/**
 * @swagger
 * /api/account-manager/managers/{id}/rate:
 *   post:
 *     summary: Rate a manager
 *     tags: [AccountManager]
 *     responses:
 *       200:
 *         description: Manager rated
 */
router.post('/managers/:id/rate', protect, rateManager);

/**
 * @swagger
 * /api/account-manager/dashboard:
 *   get:
 *     summary: Get manager dashboard stats
 *     tags: [AccountManager]
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard', protect, restrictTo('accountManager', 'admin'), getDashboardStats);

/**
 * @swagger
 * /api/account-manager/service/subscribe:
 *   post:
 *     summary: Subscribe to an account manager
 *     tags: [AccountManager]
 *     responses:
 *       201:
 *         description: Service subscribed
 */
router.post('/service/subscribe', protect, subscribe);

/**
 * @swagger
 * /api/account-manager/service:
 *   get:
 *     summary: Get active service
 *     tags: [AccountManager]
 *     responses:
 *       200:
 *         description: Active service details
 */
router.get('/service', protect, getService);

/**
 * @swagger
 * /api/account-manager/service/{id}/cancel:
 *   post:
 *     summary: Cancel service
 *     tags: [AccountManager]
 *     responses:
 *       200:
 *         description: Service cancelled
 */
router.post('/service/:id/cancel', protect, cancelService);

/**
 * @swagger
 * /api/account-manager/service/meeting:
 *   post:
 *     summary: Schedule a meeting
 *     tags: [AccountManager]
 *     responses:
 *       200:
 *         description: Meeting scheduled
 */
router.post('/service/meeting', protect, scheduleMeeting);

/**
 * @swagger
 * /api/account-manager/service/{id}/meeting-notes:
 *   post:
 *     summary: Add meeting notes
 *     tags: [AccountManager]
 *     responses:
 *       200:
 *         description: Notes added
 */
router.post('/service/:id/meeting-notes', protect, restrictTo('accountManager', 'admin'), addMeetingNotes);

/**
 * @swagger
 * /api/account-manager/service/stats:
 *   get:
 *     summary: Get service stats (admin)
 *     tags: [AccountManager]
 *     responses:
 *       200:
 *         description: Stats
 */
router.get('/service/stats', protect, restrictTo('admin'), getServiceStats);

module.exports = router;
