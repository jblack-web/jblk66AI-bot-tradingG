const WithdrawalSettings = require('../models/WithdrawalSettings');
const Payment = require('../models/Payment');
const User = require('../models/User');

// GET /api/withdrawals/settings  (public - returns safe fields)
exports.getWithdrawalSettings = async (req, res) => {
  try {
    let settings = await WithdrawalSettings.findOne();
    if (!settings) {
      settings = await WithdrawalSettings.create({});
    }
    res.json({
      success: true,
      settings: {
        withdrawalMode: settings.withdrawalMode,
        minWithdrawalAmount: settings.minWithdrawalAmount,
        maxWithdrawalAmount: settings.maxWithdrawalAmount,
        maxDailyWithdrawal: settings.maxDailyWithdrawal,
        withdrawalFeePercent: settings.withdrawalFeePercent,
        withdrawalFeeFixed: settings.withdrawalFeeFixed,
        supportedMethods: settings.supportedMethods,
        requireKYC: settings.requireKYC,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/withdrawals/settings/full  (admin only - full settings)
exports.getFullWithdrawalSettings = async (req, res) => {
  try {
    let settings = await WithdrawalSettings.findOne();
    if (!settings) settings = await WithdrawalSettings.create({});
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/withdrawals/settings  (admin only)
exports.updateWithdrawalSettings = async (req, res) => {
  try {
    let settings = await WithdrawalSettings.findOne();
    if (!settings) {
      settings = await WithdrawalSettings.create({ ...req.body, updatedBy: req.user._id });
    } else {
      Object.assign(settings, req.body);
      settings.updatedBy = req.user._id;
      await settings.save();
    }
    res.json({ success: true, message: 'Withdrawal settings updated.', settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/withdrawals/settings/mode  (admin only - toggle manual/auto)
exports.toggleWithdrawalMode = async (req, res) => {
  try {
    let settings = await WithdrawalSettings.findOne();
    if (!settings) settings = await WithdrawalSettings.create({});

    const newMode = settings.withdrawalMode === 'manual' ? 'auto' : 'manual';
    settings.withdrawalMode = newMode;
    settings.updatedBy = req.user._id;
    await settings.save();

    res.json({
      success: true,
      message: `Withdrawal mode switched to ${newMode}.`,
      withdrawalMode: newMode,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/withdrawals/pending  (admin only)
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const withdrawals = await Payment.find({ type: 'withdrawal', status: { $in: ['pending', 'processing'] } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .populate('sender', 'username email currentTier walletBalance');

    const total = await Payment.countDocuments({ type: 'withdrawal', status: { $in: ['pending', 'processing'] } });

    res.json({ success: true, withdrawals, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/withdrawals/my-requests
exports.getUserWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const withdrawals = await Payment.find({ sender: req.user._id, type: 'withdrawal' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit);

    const total = await Payment.countDocuments({ sender: req.user._id, type: 'withdrawal' });

    res.json({ success: true, withdrawals, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
