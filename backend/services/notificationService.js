'use strict';

const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Notification = require('../models/Notification');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const getMailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.SMTP_USER) {
      logger.warn('SMTP not configured, skipping email');
      return false;
    }
    const transporter = getMailTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'jblk66AI Trading'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (err) {
    logger.error(`Email send error: ${err.message}`);
    return false;
  }
};

const sendSMS = async ({ to, body }) => {
  try {
    const client = getTwilioClient();
    if (!client) {
      logger.warn('Twilio not configured, skipping SMS');
      return false;
    }
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    logger.info(`SMS sent to ${to}`);
    return true;
  } catch (err) {
    logger.error(`SMS send error: ${err.message}`);
    return false;
  }
};

const sendWhatsApp = async ({ to, body }) => {
  try {
    const client = getTwilioClient();
    if (!client) {
      logger.warn('Twilio not configured, skipping WhatsApp');
      return false;
    }
    await client.messages.create({
      body,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`
    });
    logger.info(`WhatsApp sent to ${to}`);
    return true;
  } catch (err) {
    logger.error(`WhatsApp send error: ${err.message}`);
    return false;
  }
};

const sendTelegramMessage = async ({ chatId, text }) => {
  try {
    const axios = require('axios');
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      logger.warn('Telegram bot not configured, skipping');
      return false;
    }
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    });
    logger.info(`Telegram message sent to ${chatId}`);
    return true;
  } catch (err) {
    logger.error(`Telegram send error: ${err.message}`);
    return false;
  }
};

const sendPushNotification = async ({ token, title, body, data = {} }) => {
  try {
    let admin;
    try {
      admin = require('firebase-admin');
    } catch {
      logger.warn('Firebase admin not configured');
      return false;
    }
    if (!admin.apps.length) {
      logger.warn('Firebase not initialized, skipping push notification');
      return false;
    }
    await admin.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
    });
    logger.info(`Push notification sent to ${token}`);
    return true;
  } catch (err) {
    logger.error(`Push notification error: ${err.message}`);
    return false;
  }
};

const saveInAppNotification = async ({ userId, type, title, message, data = null, priority = 'medium' }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      channel: 'inapp',
      data,
      priority
    });
    return notification;
  } catch (err) {
    logger.error(`Save notification error: ${err.message}`);
    return null;
  }
};

const sendNotification = async ({ user, type, title, message, data = null, channels = null }) => {
  try {
    const prefs = user.notificationPreferences || {};
    const enabledChannels = channels || Object.keys(prefs).filter((ch) => prefs[ch]);

    const promises = [];

    if (enabledChannels.includes('inapp') || !channels) {
      promises.push(saveInAppNotification({ userId: user._id, type, title, message, data }));
    }
    if (enabledChannels.includes('email') && user.email) {
      promises.push(
        sendEmail({
          to: user.email,
          subject: title,
          html: `<div style="font-family:sans-serif;"><h2>${title}</h2><p>${message}</p></div>`,
          text: message
        })
      );
    }
    if (enabledChannels.includes('sms') && user.phone) {
      promises.push(sendSMS({ to: user.phone, body: `${title}: ${message}` }));
    }
    if (enabledChannels.includes('whatsapp') && user.phone) {
      promises.push(sendWhatsApp({ to: user.phone, body: `${title}: ${message}` }));
    }

    await Promise.allSettled(promises);
    logger.info(`Notifications dispatched for user ${user._id}`);
  } catch (err) {
    logger.error(`sendNotification error: ${err.message}`);
  }
};

module.exports = {
  sendEmail,
  sendSMS,
  sendWhatsApp,
  sendTelegramMessage,
  sendPushNotification,
  saveInAppNotification,
  sendNotification
};
