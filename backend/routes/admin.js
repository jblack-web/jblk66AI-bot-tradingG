'use strict';

const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, banUser, unbanUser, forceVerifyKyc, changeUserTier, getSystemStats, getRevenueStats, getSiteSettings, updateSiteSettings, toggleWithdrawalMode } = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const adminOnly = [protect, restrictTo('admin')];

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: tier
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Users list
 */
router.get('/users', ...adminOnly, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/users/:id', ...adminOnly, getUserById);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: User updated
 */
router.put('/users/:id', ...adminOnly, updateUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Deactivate user
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: User deactivated
 */
router.delete('/users/:id', ...adminOnly, deleteUser);

/**
 * @swagger
 * /api/admin/users/{id}/ban:
 *   post:
 *     summary: Ban user
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: User banned
 */
router.post('/users/:id/ban', ...adminOnly, banUser);

/**
 * @swagger
 * /api/admin/users/{id}/unban:
 *   post:
 *     summary: Unban user
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: User unbanned
 */
router.post('/users/:id/unban', ...adminOnly, unbanUser);

/**
 * @swagger
 * /api/admin/users/{id}/verify-kyc:
 *   post:
 *     summary: Force KYC verification
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: KYC verified
 */
router.post('/users/:id/verify-kyc', ...adminOnly, forceVerifyKyc);

/**
 * @swagger
 * /api/admin/users/{id}/change-tier:
 *   post:
 *     summary: Change user tier
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Tier changed
 */
router.post('/users/:id/change-tier', ...adminOnly, changeUserTier);

/**
 * @swagger
 * /api/admin/stats/system:
 *   get:
 *     summary: Get system statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: System stats
 */
router.get('/stats/system', ...adminOnly, getSystemStats);

/**
 * @swagger
 * /api/admin/stats/revenue:
 *   get:
 *     summary: Get revenue statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Revenue stats
 */
router.get('/stats/revenue', ...adminOnly, getRevenueStats);

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get site settings
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Settings
 */
router.get('/settings', ...adminOnly, getSiteSettings);

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update site settings
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put('/settings', ...adminOnly, updateSiteSettings);

/**
 * @swagger
 * /api/admin/settings/toggle-withdrawal-mode:
 *   post:
 *     summary: Toggle withdrawal mode (manual/auto)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Mode toggled
 */
router.post('/settings/toggle-withdrawal-mode', ...adminOnly, toggleWithdrawalMode);

module.exports = router;
