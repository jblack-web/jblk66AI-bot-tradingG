const User = require('../models/User');
const Payment = require('../models/Payment');
const Template = require('../models/Template');
const TemplateCategory = require('../models/TemplateCategory');
const UserTierPackage = require('../models/UserTierPackage');
const UserSubscription = require('../models/UserSubscription');
const PromoCode = require('../models/PromoCode');
const WithdrawalSettings = require('../models/WithdrawalSettings');
const AccountManager = require('../models/AccountManager');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers, activeUsers, totalTemplates, publishedTemplates,
      pendingWithdrawals, totalDeposits, totalWithdrawals,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Template.countDocuments(),
      Template.countDocuments({ isPublished: true }),
      Payment.countDocuments({ type: 'withdrawal', status: 'pending' }),
      Payment.aggregate([{ $match: { type: 'deposit', status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { type: 'withdrawal', status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('username email currentTier createdAt');
    const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(10)
      .populate('sender', 'username email').populate('receiver', 'username email');

    const tierDistribution = await User.aggregate([
      { $group: { _id: '$currentTier', count: { $sum: 1 } } },
    ]);

    const monthlyRevenue = await Payment.aggregate([
      { $match: { type: { $in: ['deposit', 'subscription'] }, status: 'completed' } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      dashboard: {
        stats: {
          totalUsers, activeUsers, totalTemplates, publishedTemplates,
          pendingWithdrawals,
          totalDepositsAmount: totalDeposits[0] ? totalDeposits[0].total : 0,
          totalWithdrawalsAmount: totalWithdrawals[0] ? totalWithdrawals[0].total : 0,
        },
        recentUsers,
        recentPayments,
        tierDistribution,
        monthlyRevenue,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, tier, role, isActive } = req.query;
    const filter = {};
    if (search) filter.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (tier) filter.currentTier = tier;
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .select('-password')
      .populate('accountManagerId', 'displayName');

    const total = await User.countDocuments(filter);

    res.json({ success: true, users, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['isActive', 'role', 'currentTier', 'walletBalance', 'savingsBalance', 'adminNote', 'accountManagerId', 'firstName', 'lastName', 'phone', 'country', 'email'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    if (updates.email) {
      updates.email = updates.email.toLowerCase().trim();
      const conflict = await User.findOne({ email: updates.email, _id: { $ne: id } });
      if (conflict) return res.status(400).json({ success: false, message: 'Email is already in use by another account.' });
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/users/:id/credit
exports.creditUser = async (req, res) => {
  try {
    const { amount, type, note } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const field = type === 'savings' ? 'savingsBalance' : 'walletBalance';
    await User.findByIdAndUpdate(req.params.id, { $inc: { [field]: amount } });

    await Payment.create({
      receiver: user._id,
      receiverEmail: user.email,
      type: 'bonus',
      amount,
      currency: 'USD',
      status: 'completed',
      note: note || 'Admin credit',
      processedBy: req.user._id,
      processedAt: new Date(),
    });

    res.json({ success: true, message: `${type || 'wallet'} credited with $${amount}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/managers
exports.getManagers = async (req, res) => {
  try {
    const managers = await AccountManager.find({ isActive: true })
      .populate('user', 'username email')
      .sort({ displayName: 1 });
    res.json({ success: true, managers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Promo Codes
exports.createPromoCode = async (req, res) => {
  try {
    const promo = await PromoCode.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, promo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPromoCodes = async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.json({ success: true, promos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePromoCode = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!promo) return res.status(404).json({ success: false, message: 'Promo code not found.' });
    res.json({ success: true, promo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePromoCode = async (req, res) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Promo code deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Template management
exports.createCategory = async (req, res) => {
  try {
    const category = await TemplateCategory.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await TemplateCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Tier management
exports.getTierPackages = async (req, res) => {
  try {
    const tiers = await UserTierPackage.find().sort({ sortOrder: 1 });
    res.json({ success: true, tiers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTierPackage = async (req, res) => {
  try {
    const tier = await UserTierPackage.create(req.body);
    res.status(201).json({ success: true, tier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTierPackage = async (req, res) => {
  try {
    const tier = await UserTierPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tier) return res.status(404).json({ success: false, message: 'Tier not found.' });
    res.json({ success: true, tier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
