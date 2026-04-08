const Payment = require('../models/Payment');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const generateReference = () => `TXN-${uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase()}`;

const initiateDeposit = async (req, res) => {
  try {
    const { amount, method, currency = 'USD' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!method) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    const fee = parseFloat((amount * 0.01).toFixed(2));
    const netAmount = parseFloat((amount - fee).toFixed(2));

    const payment = new Payment({
      user: req.user._id,
      type: 'deposit',
      method,
      amount,
      fee,
      netAmount,
      currency,
      status: 'pending',
      reference: generateReference(),
    });

    await payment.save();

    res.status(201).json({
      message: 'Deposit initiated. Awaiting confirmation.',
      payment,
    });
  } catch (err) {
    console.error('Initiate deposit error:', err);
    res.status(500).json({ error: 'Failed to initiate deposit' });
  }
};

const completeDeposit = async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Transaction reference is required' });
    }

    const payment = await Payment.findOne({
      reference,
      user: req.user._id,
      type: 'deposit',
      status: 'pending',
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pending deposit not found' });
    }

    payment.status = 'completed';
    await payment.save();

    const user = await User.findById(req.user._id);
    user.walletBalance = parseFloat((user.walletBalance + payment.netAmount).toFixed(2));
    await user.save();

    res.json({
      message: 'Deposit completed successfully',
      payment,
      newWalletBalance: user.walletBalance,
    });
  } catch (err) {
    console.error('Complete deposit error:', err);
    res.status(500).json({ error: 'Failed to complete deposit' });
  }
};

const requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, notes, currency = 'USD' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!method) {
      return res.status(400).json({ error: 'Withdrawal method is required' });
    }

    const user = await User.findById(req.user._id);
    const fee = parseFloat((amount * 0.02).toFixed(2));
    const netAmount = parseFloat((amount - fee).toFixed(2));

    if (user.walletBalance < amount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    user.walletBalance = parseFloat((user.walletBalance - amount).toFixed(2));
    await user.save();

    const payment = new Payment({
      user: req.user._id,
      type: 'withdrawal',
      method,
      amount,
      fee,
      netAmount,
      currency,
      status: 'pending',
      reference: generateReference(),
      notes,
    });

    await payment.save();

    res.status(201).json({
      message: 'Withdrawal request submitted. Pending admin approval.',
      payment,
      newWalletBalance: user.walletBalance,
    });
  } catch (err) {
    console.error('Request withdrawal error:', err);
    res.status(500).json({ error: 'Failed to request withdrawal' });
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;

    const [payments, total] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(query),
    ]);

    res.json({
      payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Get transaction history error:', err);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};

const adminGetPendingWithdrawals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ type: 'withdrawal', status: 'pending' })
        .populate('user', 'email firstName lastName walletBalance')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments({ type: 'withdrawal', status: 'pending' }),
    ]);

    res.json({
      payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Admin get pending withdrawals error:', err);
    res.status(500).json({ error: 'Failed to fetch pending withdrawals' });
  }
};

const adminApproveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findOne({ _id: id, type: 'withdrawal', status: 'pending' });
    if (!payment) {
      return res.status(404).json({ error: 'Pending withdrawal not found' });
    }

    payment.status = 'completed';
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    await payment.save();

    res.json({ message: 'Withdrawal approved successfully', payment });
  } catch (err) {
    console.error('Admin approve withdrawal error:', err);
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
};

const adminRejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const payment = await Payment.findOne({ _id: id, type: 'withdrawal', status: 'pending' }).populate('user');
    if (!payment) {
      return res.status(404).json({ error: 'Pending withdrawal not found' });
    }

    payment.status = 'rejected';
    payment.adminNotes = adminNotes;
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    await payment.save();

    const user = await User.findById(payment.user._id);
    user.walletBalance = parseFloat((user.walletBalance + payment.amount).toFixed(2));
    await user.save();

    res.json({ message: 'Withdrawal rejected and funds returned to user', payment });
  } catch (err) {
    console.error('Admin reject withdrawal error:', err);
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
};

module.exports = {
  initiateDeposit,
  completeDeposit,
  requestWithdrawal,
  getTransactionHistory,
  adminGetPendingWithdrawals,
  adminApproveWithdrawal,
  adminRejectWithdrawal,
};
