'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'accountManager'],
      default: 'user'
    },
    tier: {
      type: String,
      enum: ['basic', 'advanced', 'premium'],
      default: 'basic'
    },
    kycVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    banReason: {
      type: String,
      default: null
    },
    referralCode: {
      type: String,
      unique: true,
      default: () => uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase()
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    profileImage: {
      type: String,
      default: null
    },
    phone: {
      type: String,
      trim: true,
      default: null
    },
    address: {
      street: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      country: { type: String, default: null },
      zipCode: { type: String, default: null }
    },
    withdrawalPreference: {
      type: String,
      enum: ['manual', 'auto'],
      default: 'manual'
    },
    lastLogin: {
      type: Date,
      default: null
    },
    passwordResetToken: {
      type: String,
      default: null
    },
    passwordResetExpires: {
      type: Date,
      default: null
    },
    refreshTokens: {
      type: [String],
      default: []
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
      telegram: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
      push: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateJWT = function () {
  return jwt.sign(
    { id: this._id, role: this.role, tier: this.tier },
    process.env.JWT_SECRET || 'fallback_secret_change_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_change_in_production',
    { expiresIn: '30d' }
  );
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.refreshTokens;
  return obj;
};

userSchema.index({ email: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
