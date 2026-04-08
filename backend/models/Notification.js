'use strict';

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['trade', 'deposit', 'withdrawal', 'alert', 'system', 'promo', 'referral', 'subscription', 'account_manager'],
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    isRead: {
      type: Boolean,
      default: false
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'telegram', 'inapp', 'push'],
      default: 'inapp'
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    readAt: {
      type: Date,
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
