const crypto = require('crypto');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Order = require('../models/Order');
const MiningRig = require('../models/MiningRig');
const MiningContract = require('../models/MiningContract');
const MiningEarning = require('../models/MiningEarning');
const Product = require('../models/Product');
const PlatformSettings = require('../models/PlatformSettings');

// Escape special regex characters from user input to prevent ReDoS
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSettings = async () => {
  let s = await PlatformSettings.findOne();
  if (!s) s = await PlatformSettings.create({});
  return s;
};

exports.getDashboard = async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalOrders, pendingOrders, activeContracts, totalProducts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      MiningContract.countDocuments({ status: 'active' }),
      Product.countDocuments({ isActive: true }),
    ]);

    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const pendingWithdrawals = await Wallet.aggregate([
      { $unwind: '$transactions' },
      { $match: { 'transactions.type': 'withdrawal', 'transactions.status': 'pending' } },
      { $count: 'count' },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalOrders,
        pendingOrders,
        activeContracts,
        totalProducts,
        totalRevenue,
        pendingWithdrawals: pendingWithdrawals[0]?.count || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$or = [{ name: new RegExp(escapeRegex(search), 'i') }, { email: new RegExp(escapeRegex(search), 'i') }];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const wallet = await Wallet.findOne({ userId: user._id }).select('balances transactions');
    res.json({ success: true, user, wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const allowedFields = ['role', 'isActive', 'isVerified', 'kycStatus'];
    const update = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User suspended', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWithdrawMode = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, withdrawMode: settings.withdrawMode, autoWithdrawThreshold: settings.autoWithdrawThreshold });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.setWithdrawMode = async (req, res) => {
  try {
    const { withdrawMode, autoWithdrawThreshold } = req.body;
    if (!['manual', 'auto'].includes(withdrawMode)) {
      return res.status(400).json({ success: false, message: 'withdrawMode must be manual or auto' });
    }
    const settings = await getSettings();
    settings.withdrawMode = withdrawMode;
    if (autoWithdrawThreshold !== undefined) settings.autoWithdrawThreshold = Number(autoWithdrawThreshold);
    settings.updatedBy = req.user._id;
    await settings.save();
    res.json({ success: true, message: `Withdraw mode set to ${withdrawMode}`, withdrawMode, autoWithdrawThreshold: settings.autoWithdrawThreshold });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPendingWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const allWallets = await Wallet.find({ 'transactions.status': 'pending', 'transactions.type': 'withdrawal' })
      .populate('userId', 'name email')
      .select('userId transactions');

    const pending = [];
    for (const wallet of allWallets) {
      const txs = wallet.transactions.filter((t) => t.type === 'withdrawal' && t.status === 'pending');
      txs.forEach((tx) => pending.push({ walletId: wallet._id, user: wallet.userId, transaction: tx }));
    }

    const total = pending.length;
    const start = (Number(page) - 1) * Number(limit);
    const paginated = pending.slice(start, start + Number(limit));

    res.json({ success: true, withdrawals: paginated, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.processWithdrawal = async (req, res) => {
  try {
    const { walletId, txId } = req.params;
    const { action, txHash } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be approve or reject' });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

    const tx = wallet.transactions.id(txId);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (tx.status !== 'pending') return res.status(400).json({ success: false, message: 'Transaction already processed' });

    if (action === 'approve') {
      tx.status = 'completed';
      tx.txHash = txHash || crypto.randomBytes(32).toString('hex');
      // Reduce pending balance
      wallet.pendingBalance[tx.currency] = Math.max(0, (wallet.pendingBalance[tx.currency] || 0) - tx.amount);
    } else {
      tx.status = 'rejected';
      // Refund the balance
      wallet.balances[tx.currency] = (wallet.balances[tx.currency] || 0) + tx.amount;
      wallet.pendingBalance[tx.currency] = Math.max(0, (wallet.pendingBalance[tx.currency] || 0) - tx.amount);
    }

    tx.processedBy = req.user._id;
    tx.processedAt = new Date();
    await wallet.save();

    res.json({ success: true, message: `Withdrawal ${action}d`, transaction: tx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPlatformSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePlatformSettings = async (req, res) => {
  try {
    const allowed = [
      'miningPayoutFrequency', 'marketplaceCommissionRate', 'referralCommissionRate',
      'maintenanceFeeRate', 'electricityCostPerKWh',
    ];
    const settings = await getSettings();
    allowed.forEach((f) => { if (req.body[f] !== undefined) settings[f] = req.body[f]; });
    settings.updatedBy = req.user._id;
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getRevenue = async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = { paymentStatus: 'paid' };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    const revenue = await Order.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, daily: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const total = revenue.reduce((s, r) => s + r.daily, 0);
    res.json({ success: true, revenue, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRigManagement = async (req, res) => {
  try {
    const rigs = await MiningRig.find().sort('-createdAt');
    res.json({ success: true, rigs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createRig = async (req, res) => {
  try {
    const rig = await MiningRig.create(req.body);
    res.status(201).json({ success: true, rig });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateRig = async (req, res) => {
  try {
    const rig = await MiningRig.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rig) return res.status(404).json({ success: false, message: 'Rig not found' });
    res.json({ success: true, rig });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMiningStats = async (req, res) => {
  try {
    const [totalContracts, activeContracts, totalHashRate] = await Promise.all([
      MiningContract.countDocuments(),
      MiningContract.countDocuments({ status: 'active' }),
      MiningContract.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: '$hashRate' } } }]),
    ]);
    const earningsAgg = await MiningEarning.aggregate([{ $group: { _id: null, total: { $sum: '$netEarning' } } }]);

    res.json({
      success: true,
      stats: {
        totalContracts,
        activeContracts,
        totalActiveHashRate: totalHashRate[0]?.total || 0,
        totalEarningsPaid: earningsAgg[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMarketplaceStats = async (req, res) => {
  try {
    const [totalProducts, totalOrders] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
    ]);
    const revenueAgg = await Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]);
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', name: { $first: '$items.name' }, sold: { $sum: '$items.quantity' } } },
      { $sort: { sold: -1 } },
      { $limit: 5 },
    ]);

    res.json({ success: true, stats: { totalProducts, totalOrders, totalRevenue: revenueAgg[0]?.total || 0, topProducts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
