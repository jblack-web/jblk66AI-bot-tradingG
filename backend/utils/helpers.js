'use strict';

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const formatCurrency = (amount, currency = 'USD', decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
};

const calculatePercentage = (value, total, decimals = 2) => {
  if (!total || total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(decimals));
};

const generateReferralCode = (length = 10) => {
  return uuidv4().replace(/-/g, '').substring(0, length).toUpperCase();
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Strip HTML tags and dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

// Use crypto.randomInt for cryptographically secure OTP generation
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
};

const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

const calculatePnL = (direction, entryPrice, exitPrice, quantity, leverage = 1) => {
  if (!exitPrice) return 0;
  const priceDiff = exitPrice - entryPrice;
  const multiplier = direction === 'buy' || direction === 'long' ? 1 : -1;
  return parseFloat((priceDiff * multiplier * quantity * leverage).toFixed(2));
};

const calculatePnLPercentage = (direction, entryPrice, exitPrice, leverage = 1) => {
  if (!exitPrice || !entryPrice) return 0;
  const priceDiff = exitPrice - entryPrice;
  const multiplier = direction === 'buy' || direction === 'long' ? 1 : -1;
  return parseFloat(((priceDiff * multiplier * leverage) / entryPrice * 100).toFixed(2));
};

const paginate = (page = 1, limit = 20) => {
  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (parsedPage - 1) * parsedLimit;
  return { skip, limit: parsedLimit, page: parsedPage };
};

const generatePasswordResetToken = () => {
  // Use crypto.randomBytes for secure token generation
  return crypto.randomBytes(32).toString('hex');
};

const isValidObjectId = (id) => {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(id);
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim();
};

module.exports = {
  formatCurrency,
  calculatePercentage,
  generateReferralCode,
  sanitizeInput,
  generateOTP,
  formatDate,
  calculatePnL,
  calculatePnLPercentage,
  paginate,
  generatePasswordResetToken,
  isValidObjectId,
  slugify
};
