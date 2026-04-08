'use strict';

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'trade_profit', 'trade_loss', 'referral_bonus', 'promo_bonus', 'subscription_fee', 'manager_fee', 'transfer', 'interest'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 500
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    referenceId: {
      type: String,
      default: null
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative']
    },
    lockedBalance: {
      type: Number,
      default: 0,
      min: [0, 'Locked balance cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    totalDeposited: {
      type: Number,
      default: 0
    },
    totalWithdrawn: {
      type: Number,
      default: 0
    },
    referralEarnings: {
      type: Number,
      default: 0
    },
    promoEarnings: {
      type: Number,
      default: 0
    },
    totalPnl: {
      type: Number,
      default: 0
    },
    transactions: [transactionSchema]
  },
  { timestamps: true }
);

walletSchema.methods.credit = async function (amount, type, description, referenceId = null) {
  this.balance += amount;
  if (type === 'referral_bonus') this.referralEarnings += amount;
  if (type === 'deposit') this.totalDeposited += amount;
  if (type === 'trade_profit') this.totalPnl += amount;
  this.transactions.push({
    type,
    amount,
    description,
    balanceAfter: this.balance,
    referenceId
  });
  return this.save();
};

walletSchema.methods.debit = async function (amount, type, description, referenceId = null) {
  if (this.balance < amount) throw new Error('Insufficient balance');
  this.balance -= amount;
  if (type === 'withdrawal') this.totalWithdrawn += amount;
  if (type === 'trade_loss') this.totalPnl -= amount;
  this.transactions.push({
    type,
    amount: -amount,
    description,
    balanceAfter: this.balance,
    referenceId
  });
  return this.save();
};

walletSchema.methods.lockFunds = async function (amount) {
  if (this.balance < amount) throw new Error('Insufficient balance to lock');
  this.balance -= amount;
  this.lockedBalance += amount;
  return this.save();
};

walletSchema.methods.unlockFunds = async function (amount) {
  if (this.lockedBalance < amount) throw new Error('Insufficient locked balance');
  this.lockedBalance -= amount;
  this.balance += amount;
  return this.save();
};

walletSchema.index({ userId: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
