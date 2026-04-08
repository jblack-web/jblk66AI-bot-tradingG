'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const ReferralBonus = require('../models/ReferralBonus');
const UserSubscription = require('../models/UserSubscription');
const UserTierPackage = require('../models/UserTierPackage');
const { sendNotification } = require('../services/notificationService');
const { generateReferralCode, generatePasswordResetToken } = require('../utils/helpers');

const register = async (req, res) => {
  try {
    const { name, email, password, referralCode, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) referredBy = referrer._id;
    }

    const user = await User.create({ name, email, password, referredBy, phone });

    // Create wallet
    await Wallet.create({ userId: user._id });

    // Assign basic subscription
    const basicTier = await UserTierPackage.findOne({ name: 'basic' });
    if (basicTier) {
      await UserSubscription.create({
        userId: user._id,
        tierId: basicTier._id,
        tierName: 'basic',
        billingCycle: 'free',
        startDate: new Date(),
        endDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        status: 'active',
        price: 0
      });
    }

    await sendNotification({
      user,
      type: 'system',
      title: 'Welcome to jblk66AI Trading Platform!',
      message: `Hi ${name}, your account has been created successfully. Start trading today!`,
      channels: ['inapp', 'email']
    });

    const token = user.generateJWT();
    const refreshToken = user.generateRefreshToken();
    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      refreshToken,
      user: user.toPublicJSON()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (user.isBanned) {
      return res.status(403).json({ error: `Account banned: ${user.banReason || 'Contact support.'}` });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = user.generateJWT();
    const refreshToken = user.generateRefreshToken();
    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      token,
      refreshToken,
      user: user.toPublicJSON()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const user = await User.findById(req.user._id).select('+refreshTokens');
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
        await user.save({ validateBeforeSave: false });
      }
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ error: 'Refresh token required.' });

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_change_in_production'
    );

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(token)) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    const newToken = user.generateJWT();
    const newRefreshToken = user.generateRefreshToken();
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('referredBy', 'name email');
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'address', 'withdrawalPreference', 'notificationPreferences'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
    }

    const resetToken = generatePasswordResetToken();
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    await sendNotification({
      user,
      type: 'system',
      title: 'Password Reset Request',
      message: `Click the link to reset your password: ${resetUrl} (expires in 1 hour)`,
      channels: ['email']
    });

    res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token.' });

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, logout, refreshToken, getProfile, updateProfile, changePassword, forgotPassword, resetPassword };
