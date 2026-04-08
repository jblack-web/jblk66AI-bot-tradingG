const Wallet = require('../models/Wallet');
const User = require('../models/User');
const PlatformSettings = require('../models/PlatformSettings');

const SUPPORTED_CURRENCIES = ['BTC', 'ETH', 'LTC', 'XMR', 'USDT', 'USDC', 'USD'];

const getSettings = async () => {
  let settings = await PlatformSettings.findOne();
  if (!settings) settings = await PlatformSettings.create({});
  return settings;
};

exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });
    res.json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id }).select('balances pendingBalance');
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });
    res.json({ success: true, balances: wallet.balances, pendingBalance: wallet.pendingBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deposit = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
    const cur = (currency || 'USD').toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(cur)) {
      return res.status(400).json({ success: false, message: 'Unsupported currency' });
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

    wallet.balances[cur] = (wallet.balances[cur] || 0) + Number(amount);
    wallet.transactions.push({
      type: 'deposit',
      amount: Number(amount),
      currency: cur,
      status: 'completed',
      note: 'Manual deposit',
    });
    await wallet.save();

    res.json({ success: true, message: 'Deposit successful', balance: wallet.balances[cur] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { amount, currency, address } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
    if (!address) return res.status(400).json({ success: false, message: 'Withdrawal address required' });

    const cur = (currency || 'USD').toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(cur)) {
      return res.status(400).json({ success: false, message: 'Unsupported currency' });
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

    const balance = wallet.balances[cur] || 0;
    if (balance < Number(amount)) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Check global withdraw mode
    const settings = await getSettings();
    const effectiveMode = wallet.withdrawMode || settings.withdrawMode;

    // Deduct balance immediately; if manual, mark pending; if auto, mark completed
    wallet.balances[cur] -= Number(amount);

    if (effectiveMode === 'auto') {
      wallet.transactions.push({
        type: 'withdrawal',
        amount: Number(amount),
        currency: cur,
        status: 'completed',
        address,
        txHash: '0x' + Math.random().toString(16).substring(2, 66),
        note: 'Auto withdrawal',
      });
      await wallet.save();
      return res.json({ success: true, message: 'Withdrawal processed automatically', mode: 'auto' });
    } else {
      wallet.pendingBalance[cur] = (wallet.pendingBalance[cur] || 0) + Number(amount);
      wallet.transactions.push({
        type: 'withdrawal',
        amount: Number(amount),
        currency: cur,
        status: 'pending',
        address,
        note: 'Awaiting admin approval',
      });
      await wallet.save();
      return res.json({ success: true, message: 'Withdrawal request submitted. Awaiting admin approval.', mode: 'manual' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendPayment = async (req, res) => {
  try {
    const { recipientEmail, amount, currency, note } = req.body;
    if (!recipientEmail) return res.status(400).json({ success: false, message: 'Recipient email required' });
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const cur = (currency || 'USD').toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(cur)) {
      return res.status(400).json({ success: false, message: 'Unsupported currency' });
    }

    if (recipientEmail === req.user.email) {
      return res.status(400).json({ success: false, message: 'Cannot send to yourself' });
    }

    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found' });

    const senderWallet = await Wallet.findOne({ userId: req.user._id });
    const recipientWallet = await Wallet.findOne({ userId: recipient._id });

    if (!senderWallet || !recipientWallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    if ((senderWallet.balances[cur] || 0) < Number(amount)) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    senderWallet.balances[cur] -= Number(amount);
    senderWallet.transactions.push({
      type: 'send',
      amount: Number(amount),
      currency: cur,
      status: 'completed',
      note: note || `Sent to ${recipientEmail}`,
    });

    recipientWallet.balances[cur] = (recipientWallet.balances[cur] || 0) + Number(amount);
    recipientWallet.transactions.push({
      type: 'receive',
      amount: Number(amount),
      currency: cur,
      status: 'completed',
      note: note || `Received from ${req.user.email}`,
    });

    await senderWallet.save();
    await recipientWallet.save();

    res.json({ success: true, message: `Sent ${amount} ${cur} to ${recipientEmail}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.receivePayment = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id }).select('depositAddresses');
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });
    res.json({
      success: true,
      message: 'Send funds to any of these deposit addresses',
      depositAddresses: wallet.depositAddresses,
      userId: req.user._id,
      email: req.user.email,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { type, currency, status, page = 1, limit = 20 } = req.query;
    const wallet = await Wallet.findOne({ userId: req.user._id }).select('transactions');
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

    let txs = wallet.transactions;
    if (type) txs = txs.filter((t) => t.type === type);
    if (currency) txs = txs.filter((t) => t.currency === currency.toUpperCase());
    if (status) txs = txs.filter((t) => t.status === status);

    txs = txs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const total = txs.length;
    const start = (Number(page) - 1) * Number(limit);
    txs = txs.slice(start, start + Number(limit));

    res.json({ success: true, transactions: txs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
