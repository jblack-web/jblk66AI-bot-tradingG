'use strict';

const WithdrawalTransaction = require('../models/WithdrawalTransaction');
const Wallet = require('../models/Wallet');
const SiteSettings = require('../models/SiteSettings');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const { paginate } = require('../utils/helpers');

const requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, destinationDetails } = req.body;
    const parsedAmount = parseFloat(amount);

    const settings = await SiteSettings.findOne({ key: 'singleton' });

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < parsedAmount) return res.status(400).json({ error: 'Insufficient balance.' });

    const fee = parsedAmount * 0.015;
    const netAmount = parsedAmount - fee;
    const minWithdrawal = settings ? settings.minWithdrawalAmount : 50;

    if (parsedAmount < minWithdrawal) return res.status(400).json({ error: `Minimum withdrawal is $${minWithdrawal}.` });

    const withdrawalMode = settings ? settings.withdrawalMode : 'manual';
    const user = await User.findById(req.user._id);

    let approvalType = 'manual';
    if (withdrawalMode === 'auto') {
      const accountAgeDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const meetsKyc = !settings.autoWithdrawalRequireKyc || user.kycVerified;
      const meetsAge = accountAgeDays >= (settings.autoWithdrawalMinAccountAge || 30);
      const meetsAmount = parsedAmount <= (settings.autoWithdrawalMaxAmount || 1000);
      if (meetsKyc && meetsAge && meetsAmount) approvalType = 'auto';
    }

    await wallet.debit(parsedAmount, 'withdrawal', `Withdrawal request: $${parsedAmount}`);

    const withdrawal = await WithdrawalTransaction.create({
      userId: req.user._id,
      amount: parsedAmount,
      method,
      fee,
      netAmount,
      destinationDetails,
      approvalType,
      status: approvalType === 'auto' ? 'approved' : 'pending'
    });

    if (approvalType === 'auto') {
      withdrawal.status = 'completed';
      withdrawal.reviewedAt = new Date();
      withdrawal.processedAt = new Date();
      await withdrawal.save();
    }

    await sendNotification({
      user,
      type: 'withdrawal',
      title: 'Withdrawal Requested',
      message: `Your withdrawal of $${netAmount.toFixed(2)} has been ${approvalType === 'auto' ? 'processed' : 'submitted for review'}.`
    });

    res.status(201).json({ success: true, withdrawal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const cancelWithdrawal = async (req, res) => {
  try {
    const withdrawal = await WithdrawalTransaction.findOne({ _id: req.params.id, userId: req.user._id, status: 'pending' });
    if (!withdrawal) return res.status(404).json({ error: 'Pending withdrawal not found.' });

    withdrawal.status = 'cancelled';
    await withdrawal.save();

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet) await wallet.credit(withdrawal.amount, 'deposit', 'Withdrawal cancellation refund');

    res.json({ success: true, message: 'Withdrawal cancelled and funds restored.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getWithdrawalHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const VALID_STATUSES = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    const filter = { userId: req.user._id };
    if (status && VALID_STATUSES.includes(status)) filter.status = status;
    const [withdrawals, total] = await Promise.all([
      WithdrawalTransaction.find(filter).sort({ requestedAt: -1 }).skip(skip).limit(lim),
      WithdrawalTransaction.countDocuments(filter)
    ]);
    res.json({ success: true, withdrawals, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPendingWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const [withdrawals, total] = await Promise.all([
      WithdrawalTransaction.find({ status: 'pending' }).sort({ requestedAt: 1 }).skip(skip).limit(lim).populate('userId', 'name email'),
      WithdrawalTransaction.countDocuments({ status: 'pending' })
    ]);
    res.json({ success: true, withdrawals, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await WithdrawalTransaction.findById(req.params.id).populate('userId');
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found.' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Withdrawal is not pending.' });

    withdrawal.status = 'approved';
    withdrawal.reviewedBy = req.user._id;
    withdrawal.reviewedAt = new Date();
    withdrawal.notes = req.body.notes;
    await withdrawal.save();

    if (withdrawal.userId) {
      await sendNotification({
        user: withdrawal.userId,
        type: 'withdrawal',
        title: 'Withdrawal Approved',
        message: `Your withdrawal of $${withdrawal.netAmount.toFixed(2)} has been approved.`
      });
    }

    res.json({ success: true, withdrawal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const rejectWithdrawal = async (req, res) => {
  try {
    const withdrawal = await WithdrawalTransaction.findById(req.params.id).populate('userId');
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found.' });
    if (!['pending', 'approved'].includes(withdrawal.status)) return res.status(400).json({ error: 'Cannot reject this withdrawal.' });

    withdrawal.status = 'rejected';
    withdrawal.reviewedBy = req.user._id;
    withdrawal.reviewedAt = new Date();
    withdrawal.rejectReason = req.body.reason || 'Rejected by admin';
    await withdrawal.save();

    const wallet = await Wallet.findOne({ userId: withdrawal.userId });
    if (wallet) await wallet.credit(withdrawal.amount, 'deposit', `Withdrawal rejected refund: $${withdrawal.amount}`);

    if (withdrawal.userId) {
      await sendNotification({
        user: withdrawal.userId,
        type: 'withdrawal',
        title: 'Withdrawal Rejected',
        message: `Your withdrawal request was rejected. Reason: ${withdrawal.rejectReason}. Funds have been returned.`
      });
    }

    res.json({ success: true, withdrawal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const completeWithdrawal = async (req, res) => {
  try {
    const withdrawal = await WithdrawalTransaction.findById(req.params.id).populate('userId');
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found.' });
    if (withdrawal.status !== 'approved') return res.status(400).json({ error: 'Withdrawal must be approved first.' });

    withdrawal.status = 'completed';
    withdrawal.processedAt = new Date();
    withdrawal.transactionHash = req.body.transactionHash || null;
    await withdrawal.save();

    if (withdrawal.userId) {
      await sendNotification({
        user: withdrawal.userId,
        type: 'withdrawal',
        title: 'Withdrawal Completed',
        message: `Your withdrawal of $${withdrawal.netAmount.toFixed(2)} has been processed.`
      });
    }

    res.json({ success: true, withdrawal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getWithdrawalStats = async (req, res) => {
  try {
    const stats = await WithdrawalTransaction.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  requestWithdrawal, cancelWithdrawal, getWithdrawalHistory, getPendingWithdrawals,
  approveWithdrawal, rejectWithdrawal, completeWithdrawal, getWithdrawalStats
};
