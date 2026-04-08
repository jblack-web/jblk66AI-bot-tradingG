const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const adminUserSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, trim: true },
    role: {
      type: String,
      enum: ['SuperAdmin', 'StakingAdmin', 'SupportAdmin', 'AnalyticsAdmin', 'FinanceAdmin'],
      required: true,
    },
    permissions: [{ type: String }],
    ipWhitelist: [{ type: String }],
    twoFAEnabled: { type: Boolean, default: false },
    twoFAMethod: { type: String, enum: ['SMS', 'App', 'Both'], default: 'App' },
    twoFASecret: { type: String, select: false },
    backupCodes: { type: [String], select: false },
    lastLogin: { type: Date },
    lastLoginIP: { type: String },
    lastLoginDevice: { type: String },
    passwordChangedAt: { type: Date },
    passwordExpiryAt: { type: Date },
    isActive: { type: Boolean, default: true },
    isLocked: { type: Boolean, default: false },
    lockExpiresAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    createdBy: { type: String, ref: 'AdminUser' },
    updatedBy: { type: String, ref: 'AdminUser' },
  },
  { timestamps: true, _id: false }
);

adminUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  this.passwordChangedAt = new Date();
  next();
});

adminUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminUserSchema.methods.isPasswordExpired = function () {
  if (!this.passwordExpiryAt) return false;
  return new Date() > this.passwordExpiryAt;
};

adminUserSchema.methods.incrementFailedLogin = async function () {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    this.isLocked = true;
    this.lockExpiresAt = new Date(Date.now() + LOCK_DURATION_MS);
  }
  return this.save();
};

adminUserSchema.methods.resetFailedLogin = async function () {
  this.failedLoginAttempts = 0;
  this.isLocked = false;
  this.lockExpiresAt = undefined;
  return this.save();
};

adminUserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.twoFASecret;
    delete ret.backupCodes;
    return ret;
  },
});

module.exports = mongoose.model('AdminUser', adminUserSchema);
