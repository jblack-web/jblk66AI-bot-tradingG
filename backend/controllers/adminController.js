const User = require('../models/User');
const Membership = require('../models/Membership');
const Promotion = require('../models/Promotion');
const Payment = require('../models/Payment');

const getStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, tierCounts, totalRevenue, recentSignups] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      Membership.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$tier', count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { type: { $in: ['deposit', 'upgrade'] }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.countDocuments({
        role: 'user',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const tierMap = {};
    tierCounts.forEach(({ _id, count }) => {
      tierMap[_id] = count;
    });

    const paidUsers = (tierMap.basic || 0) + (tierMap.advanced || 0) + (tierMap.premium || 0);
    const conversionRate = totalUsers > 0 ? parseFloat(((paidUsers / totalUsers) * 100).toFixed(2)) : 0;

    res.json({
      totalUsers,
      activeUsers,
      recentSignups,
      tierBreakdown: {
        free: tierMap.free || 0,
        basic: tierMap.basic || 0,
        advanced: tierMap.advanced || 0,
        premium: tierMap.premium || 0,
      },
      totalRevenue: totalRevenue[0]?.total || 0,
      paidUsers,
      conversionRate,
    });
  } catch (err) {
    console.error('Admin get stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

const getMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { role: 'user' };
    if (req.query.status === 'active') query.isActive = true;
    if (req.query.status === 'inactive') query.isActive = false;

    let membershipFilter = {};
    if (req.query.tier) {
      const membershipIds = await Membership.find({ tier: req.query.tier, isActive: true }).distinct('user');
      query._id = { $in: membershipIds };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -emailVerificationToken')
        .populate('membership')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Admin get members error:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

const updateUserMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { tier, reason } = req.body;

    const validTiers = ['free', 'basic', 'advanced', 'premium'];
    if (!tier || !validTiers.includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const user = await User.findById(id);
    if (!user || user.role === 'admin') {
      return res.status(404).json({ error: 'User not found' });
    }

    const tierConfig = Membership.getTierConfig(tier);

    await Membership.updateMany({ user: id, isActive: true }, { isActive: false });

    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const membership = new Membership({
      user: id,
      tier,
      miningPower: tierConfig.miningPower,
      dailyEarningsMin: tierConfig.dailyEarningsMin,
      dailyEarningsMax: tierConfig.dailyEarningsMax,
      price: tierConfig.price,
      startDate: now,
      endDate: tier !== 'free' ? endDate : undefined,
      isActive: true,
      upgradeSource: 'admin_override',
      conversionStatus: tier === 'free' ? 'trial' : 'converted',
    });

    await membership.save();

    user.membership = membership._id;
    await user.save();

    res.json({
      message: `User membership updated to ${tier}`,
      membership,
    });
  } catch (err) {
    console.error('Admin update user membership error:', err);
    res.status(500).json({ error: 'Failed to update user membership' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [dailySignups, tierUpgrades, revenueByDay] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate }, role: 'user' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Membership.aggregate([
        { $match: { createdAt: { $gte: startDate }, tier: { $ne: 'free' } } },
        { $group: { _id: '$tier', count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            type: { $in: ['deposit', 'upgrade'] },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const upgradeMap = {};
    tierUpgrades.forEach(({ _id, count }) => {
      upgradeMap[_id] = count;
    });

    res.json({
      period: `${days} days`,
      dailySignups,
      upgradeRates: upgradeMap,
      revenueByDay,
    });
  } catch (err) {
    console.error('Admin get analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

const managePromotions = async (req, res) => {
  try {
    const { method } = req;
    const { id } = req.params;

    if (method === 'GET') {
      const promos = await Promotion.find().populate('createdBy', 'email').sort({ createdAt: -1 });
      return res.json({ promotions: promos });
    }

    if (method === 'POST') {
      const { code, description, discountPercentage, discountAmount, validFrom, validTo, maxUses, tierRestrictions } =
        req.body;

      if (!code) {
        return res.status(400).json({ error: 'Promo code is required' });
      }

      const promo = new Promotion({
        code: code.toUpperCase(),
        description,
        discountPercentage,
        discountAmount,
        validFrom,
        validTo,
        maxUses,
        tierRestrictions,
        createdBy: req.user._id,
      });

      await promo.save();
      return res.status(201).json({ message: 'Promotion created', promotion: promo });
    }

    if (method === 'PUT') {
      const promo = await Promotion.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
      if (!promo) return res.status(404).json({ error: 'Promotion not found' });
      return res.json({ message: 'Promotion updated', promotion: promo });
    }

    if (method === 'DELETE') {
      const promo = await Promotion.findByIdAndDelete(id);
      if (!promo) return res.status(404).json({ error: 'Promotion not found' });
      return res.json({ message: 'Promotion deleted' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Manage promotions error:', err);
    res.status(500).json({ error: 'Failed to manage promotions' });
  }
};

const sendCampaignEmail = async (req, res) => {
  try {
    const { subject, body, targetTier, targetAll } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }

    let query = { role: 'user', isActive: true, isEmailVerified: true };

    if (!targetAll && targetTier) {
      const membershipIds = await Membership.find({ tier: targetTier, isActive: true }).distinct('user');
      query._id = { $in: membershipIds };
    }

    const users = await User.find(query).select('email firstName');
    const count = users.length;

    users.forEach((user) => {
      console.log(`[MOCK CAMPAIGN EMAIL] To: ${user.email} | Subject: ${subject}`);
    });

    res.json({
      message: `Campaign email sent to ${count} users`,
      recipientCount: count,
      subject,
    });
  } catch (err) {
    console.error('Send campaign email error:', err);
    res.status(500).json({ error: 'Failed to send campaign email' });
  }
};

module.exports = {
  getStats,
  getMembers,
  updateUserMembership,
  getAnalytics,
  managePromotions,
  sendCampaignEmail,
};
