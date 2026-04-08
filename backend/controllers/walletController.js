'use strict';

const Wallet = require('../models/Wallet');
const { paginate } = require('../utils/helpers');

const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id });
    }
    res.json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const { skip, limit: lim } = paginate(page, limit);

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

    let transactions = wallet.transactions;
    if (type) {
      transactions = transactions.filter((t) => t.type === type);
    }

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = transactions.length;
    const paginated = transactions.slice(skip, skip + lim);

    res.json({
      success: true,
      transactions: paginated,
      pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

    const stats = {
      balance: wallet.balance,
      lockedBalance: wallet.lockedBalance,
      availableBalance: wallet.balance - wallet.lockedBalance,
      totalDeposited: wallet.totalDeposited,
      totalWithdrawn: wallet.totalWithdrawn,
      referralEarnings: wallet.referralEarnings,
      totalPnl: wallet.totalPnl,
      netWorth: wallet.balance + wallet.lockedBalance
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getWallet, getTransactions, getStats };
