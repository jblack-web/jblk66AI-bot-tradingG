'use strict';

const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const { paginate } = require('../utils/helpers');

const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const VALID_TYPES = ['trade', 'deposit', 'withdrawal', 'alert', 'system', 'promo', 'referral', 'subscription', 'account_manager'];
    const filter = { userId: req.user._id };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (type && VALID_TYPES.includes(type)) filter.type = type;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user._id, isRead: false })
    ]);
    res.json({ success: true, notifications, unreadCount, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found.' });
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences');
    res.json({ success: true, preferences: user.notificationPreferences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const allowedPrefs = ['email', 'sms', 'whatsapp', 'telegram', 'inApp', 'push'];
    const updates = {};
    allowedPrefs.forEach((pref) => {
      if (req.body[pref] !== undefined) updates[`notificationPreferences.${pref}`] = req.body[pref];
    });
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select('notificationPreferences');
    res.json({ success: true, preferences: user.notificationPreferences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const sendBulkNotification = async (req, res) => {
  try {
    const { title, message, type = 'system', userIds, allUsers = false } = req.body;

    let users;
    if (allUsers) {
      users = await User.find({ isActive: true, isBanned: false }).select('_id email phone notificationPreferences');
    } else if (userIds && userIds.length > 0) {
      users = await User.find({ _id: { $in: userIds }, isActive: true }).select('_id email phone notificationPreferences');
    } else {
      return res.status(400).json({ error: 'Specify userIds or set allUsers to true.' });
    }

    let sent = 0;
    for (const user of users) {
      await sendNotification({ user, type, title, message, channels: ['inapp'] });
      sent++;
    }

    res.json({ success: true, message: `Notification sent to ${sent} user(s).`, sent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getUserNotifications, markAsRead, markAllAsRead, deleteNotification, getNotificationPreferences, updateNotificationPreferences, sendBulkNotification };
