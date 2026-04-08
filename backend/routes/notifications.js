'use strict';

const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead, markAllAsRead, deleteNotification, getNotificationPreferences, updateNotificationPreferences, sendBulkNotification } = require('../controllers/notificationController');
const { protect, restrictTo } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: isRead
 *         schema: { type: boolean }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notifications list
 */
router.get('/', protect, getUserNotifications);

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Preferences
 */
router.get('/preferences', protect, getNotificationPreferences);

/**
 * @swagger
 * /api/notifications/preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.put('/preferences', protect, updateNotificationPreferences);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.put('/read-all', protect, markAllAsRead);

/**
 * @swagger
 * /api/notifications/bulk:
 *   post:
 *     summary: Send bulk notification (admin)
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message]
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *               allUsers: { type: boolean }
 *               userIds: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Notification sent
 */
router.post('/bulk', protect, restrictTo('admin'), sendBulkNotification);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.put('/:id/read', protect, markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', protect, deleteNotification);

module.exports = router;
