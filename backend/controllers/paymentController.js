const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const User = require('../models/User');
const WithdrawalSettings = require('../models/WithdrawalSettings');

// Helper: generate transaction ID
const genTxId = () => `TX-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;

// POST /api/payments/send
exports.sendPayment = async (req, res) => {
  try {
    const { receiverEmail, receiverWalletAddress, amount, currency, cryptoCurrency, note, paymentMethod } = req.body;
    const sender = req.user;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount.' });
    }

    // Find receiver
    let receiver = null;
    if (receiverEmail) {
      receiver = await User.findOne({ email: receiverEmail });
    }

    // Check sender balance
    if (sender.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
    }

    const fee = +(amount * 0.005).toFixed(2); // 0.5% fee
    const totalDeducted = amount + fee;

    if (sender.walletBalance < totalDeducted) {
      return res.status(400).json({ success: false, message: 'Insufficient balance to cover fees.' });
    }

    const txId = genTxId();

    // Create payment record
    const payment = await Payment.create({
      sender: sender._id,
      receiver: receiver ? receiver._id : null,
      senderEmail: sender.email,
      receiverEmail: receiverEmail || null,
      receiverWalletAddress: receiverWalletAddress || null,
      type: 'send',
      amount,
      currency: currency || 'USD',
      cryptoCurrency: cryptoCurrency || null,
      fee,
      totalAmount: totalDeducted,
      transactionId: txId,
      status: receiver ? 'completed' : 'processing',
      note,
      paymentMethod: paymentMethod || 'wallet',
    });

    // Deduct from sender
    await User.findByIdAndUpdate(sender._id, {
      $inc: { walletBalance: -totalDeducted, totalWithdrawn: amount },
    });

    // Credit receiver if internal
    if (receiver) {
      await User.findByIdAndUpdate(receiver._id, {
        $inc: { walletBalance: amount, totalDeposited: amount },
      });
      await Payment.findByIdAndUpdate(payment._id, {
        status: 'completed',
        processedAt: new Date(),
      });
    }

    res.json({
      success: true,
      message: 'Payment sent successfully.',
      payment: {
        transactionId: txId,
        amount,
        fee,
        total: totalDeducted,
        status: payment.status,
        receiverEmail,
        receiverWalletAddress,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payments/receive
exports.receivePayment = async (req, res) => {
  try {
    const { amount, currency, cryptoCurrency, paymentMethod, note } = req.body;
    const user = req.user;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount.' });
    }

    const txId = genTxId();
    const payment = await Payment.create({
      receiver: user._id,
      receiverEmail: user.email,
      type: 'deposit',
      amount,
      currency: currency || 'USD',
      cryptoCurrency: cryptoCurrency || null,
      transactionId: txId,
      status: 'pending',
      note,
      paymentMethod: paymentMethod || 'crypto',
    });

    res.json({
      success: true,
      message: 'Deposit request created. Awaiting confirmation.',
      payment: {
        transactionId: txId,
        amount,
        currency,
        status: 'pending',
        depositInstructions: getDepositInstructions(cryptoCurrency, paymentMethod),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/payments/history
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const filter = {
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .populate('sender', 'username email')
      .populate('receiver', 'username email');

    const total = await Payment.countDocuments(filter);

    res.json({ success: true, payments, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payments/withdrawal
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, currency, cryptoCurrency, walletAddress, paymentMethod, note } = req.body;
    const user = req.user;

    // Get withdrawal settings
    const settings = await WithdrawalSettings.findOne() || { withdrawalMode: 'manual', minWithdrawalAmount: 20, withdrawalFeePercent: 1.5, withdrawalFeeFixed: 2 };

    if (!amount || amount < settings.minWithdrawalAmount) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal is $${settings.minWithdrawalAmount}.` });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }

    const fee = +((amount * (settings.withdrawalFeePercent / 100)) + settings.withdrawalFeeFixed).toFixed(2);
    const totalDeducted = amount + fee;

    if (user.walletBalance < totalDeducted) {
      return res.status(400).json({ success: false, message: 'Insufficient balance to cover fees.' });
    }

    const txId = genTxId();
    const isAutoMode = settings.withdrawalMode === 'auto';
    const status = isAutoMode ? 'processing' : 'pending';

    const payment = await Payment.create({
      sender: user._id,
      senderEmail: user.email,
      type: 'withdrawal',
      amount,
      currency: currency || 'USD',
      cryptoCurrency: cryptoCurrency || null,
      walletAddress,
      fee,
      totalAmount: totalDeducted,
      transactionId: txId,
      status,
      note,
      paymentMethod: paymentMethod || 'crypto',
    });

    // Reserve funds
    await User.findByIdAndUpdate(user._id, {
      $inc: { walletBalance: -totalDeducted },
    });

    res.json({
      success: true,
      message: isAutoMode ? 'Withdrawal is being processed automatically.' : 'Withdrawal request submitted. Awaiting admin approval.',
      withdrawal: {
        transactionId: txId,
        amount,
        fee,
        total: totalDeducted,
        status,
        estimatedProcessingTime: isAutoMode ? '30 minutes' : '1-3 business days',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/payments/wallet-address
exports.getWalletAddress = async (req, res) => {
  try {
    const { currency } = req.query;
    // Return the platform's deposit wallet address for the given currency
    const addresses = {
      BTC: process.env.BTC_WALLET || '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf',
      ETH: process.env.ETH_WALLET || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      USDT: process.env.USDT_WALLET || 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
      BNB: process.env.BNB_WALLET || 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
    };
    const address = addresses[currency] || addresses.USDT;
    res.json({ success: true, address, currency: currency || 'USDT', qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: confirm deposit
exports.adminConfirmDeposit = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment || payment.type !== 'deposit') {
      return res.status(404).json({ success: false, message: 'Deposit not found.' });
    }
    if (payment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Payment is not pending.' });
    }

    payment.status = 'completed';
    payment.processedAt = new Date();
    payment.processedBy = req.user._id;
    await payment.save();

    // Credit user
    await User.findByIdAndUpdate(payment.receiver, {
      $inc: { walletBalance: payment.amount, totalDeposited: payment.amount },
    });

    res.json({ success: true, message: 'Deposit confirmed and credited to user.', payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: approve/reject withdrawal
exports.adminProcessWithdrawal = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { action, note } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment || payment.type !== 'withdrawal') {
      return res.status(404).json({ success: false, message: 'Withdrawal not found.' });
    }
    if (!['pending', 'processing'].includes(payment.status)) {
      return res.status(400).json({ success: false, message: 'Payment cannot be processed.' });
    }

    if (action === 'approve') {
      payment.status = 'completed';
    } else if (action === 'reject') {
      payment.status = 'failed';
      payment.rejectionReason = note;
      // Refund user
      await User.findByIdAndUpdate(payment.sender, {
        $inc: { walletBalance: payment.totalAmount },
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    payment.processedAt = new Date();
    payment.processedBy = req.user._id;
    payment.adminNote = note;
    await payment.save();

    res.json({ success: true, message: `Withdrawal ${action}d successfully.`, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: get all payments
exports.adminGetPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, userId } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (userId) filter.$or = [{ sender: userId }, { receiver: userId }];

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .populate('sender', 'username email')
      .populate('receiver', 'username email');

    const total = await Payment.countDocuments(filter);

    // Stats
    const stats = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]);

    res.json({ success: true, payments, total, page: +page, pages: Math.ceil(total / limit), stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function getDepositInstructions(crypto, method) {
  const instructions = {
    BTC: 'Send BTC to the provided address. Confirmations required: 3',
    ETH: 'Send ETH to the provided address. Confirmations required: 12',
    USDT: 'Send USDT (TRC20) to the provided address. Confirmations required: 20',
    BNB: 'Send BNB to the provided address. Confirmations required: 15',
  };
  return instructions[crypto] || 'Follow the payment instructions provided.';
}
