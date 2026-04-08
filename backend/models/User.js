const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'manager'], default: 'user' },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  // Profile
  firstName: String,
  lastName: String,
  phone: String,
  country: String,
  avatar: String,

  // Wallet
  walletBalance: { type: Number, default: 0 },
  savingsBalance: { type: Number, default: 0 },
  totalDeposited: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },

  // Tier subscription
  currentTier: { type: String, enum: ['free', 'basic', 'advanced', 'premium'], default: 'free' },
  tierExpiresAt: Date,

  // Referral
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralEarnings: { type: Number, default: 0 },

  // Daily trade tracking
  dailyTradesUsed: { type: Number, default: 0 },
  lastTradeReset: { type: Date, default: Date.now },

  // Account manager
  accountManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountManager' },

  // Settings
  twoFactorEnabled: { type: Boolean, default: false },
  notificationsEnabled: { type: Boolean, default: true },
  preferredCurrency: { type: String, default: 'USD' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
