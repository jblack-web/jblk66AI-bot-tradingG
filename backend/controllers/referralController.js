const Referral = require('../models/Referral');
const User = require('../models/User');

const getReferralStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [total, pending, completed, paid] = await Promise.all([
      Referral.countDocuments({ referrer: userId }),
      Referral.countDocuments({ referrer: userId, status: 'pending' }),
      Referral.countDocuments({ referrer: userId, status: 'completed' }),
      Referral.countDocuments({ referrer: userId, status: 'paid' }),
    ]);

    const bonusAgg = await Referral.aggregate([
      { $match: { referrer: userId } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$bonusAmount' },
        },
      },
    ]);

    const bonusMap = {};
    bonusAgg.forEach(({ _id, total }) => {
      bonusMap[_id] = total;
    });

    res.json({
      totalReferrals: total,
      pending,
      completed,
      paid,
      bonuses: {
        pending: bonusMap.pending || 0,
        completed: bonusMap.completed || 0,
        paid: bonusMap.paid || 0,
        total: Object.values(bonusMap).reduce((a, b) => a + b, 0),
      },
    });
  } catch (err) {
    console.error('Get referral stats error:', err);
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
};

const createReferralLink = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('referralCode');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://jblk66ai.com';
    const referralLink = `${baseUrl}/register?ref=${user.referralCode}`;

    res.json({
      referralCode: user.referralCode,
      referralLink,
    });
  } catch (err) {
    console.error('Create referral link error:', err);
    res.status(500).json({ error: 'Failed to create referral link' });
  }
};

const getReferralNetwork = async (req, res) => {
  try {
    const userId = req.user._id;

    const directReferrals = await Referral.find({ referrer: userId })
      .populate('referred', 'email firstName lastName createdAt membership')
      .sort({ createdAt: -1 });

    const referralTree = await Promise.all(
      directReferrals.map(async (ref) => {
        const secondLevel = await Referral.find({ referrer: ref.referred._id })
          .populate('referred', 'email firstName lastName createdAt')
          .sort({ createdAt: -1 });

        return {
          referral: ref,
          children: secondLevel,
        };
      })
    );

    res.json({
      network: referralTree,
      totalDirectReferrals: directReferrals.length,
    });
  } catch (err) {
    console.error('Get referral network error:', err);
    res.status(500).json({ error: 'Failed to fetch referral network' });
  }
};

module.exports = { getReferralStats, createReferralLink, getReferralNetwork };
