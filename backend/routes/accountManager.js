const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const AccountManager = require('../models/AccountManager');
const DedicatedAccountManagerService = require('../models/DedicatedAccountManagerService');
const User = require('../models/User');

// GET /api/account-manager/managers
router.get('/managers', async (req, res) => {
  try {
    const managers = await AccountManager.find({ isActive: true })
      .populate('user', 'username email avatar')
      .sort({ averageRating: -1 });
    res.json({ success: true, managers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/account-manager/service/subscribe
router.post('/service/subscribe', authMiddleware, async (req, res) => {
  try {
    const { managerId, serviceType } = req.body;
    const manager = await AccountManager.findById(managerId);
    if (!manager || !manager.isActive) {
      return res.status(404).json({ success: false, message: 'Account manager not found.' });
    }
    if (manager.currentClientCount >= manager.maxClients) {
      return res.status(400).json({ success: false, message: 'Account manager has reached client capacity.' });
    }

    const fee = serviceType === 'monthly' ? 499.99 : 19.99;
    const user = await User.findById(req.user._id);
    if (user.walletBalance < fee) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Fee: $${fee}` });
    }

    await User.findByIdAndUpdate(req.user._id, { $inc: { walletBalance: -fee } });

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (serviceType === 'monthly' ? 30 : 1));

    const service = await DedicatedAccountManagerService.create({
      user: req.user._id,
      manager: managerId,
      serviceType,
      status: 'active',
      startDate: new Date(),
      endDate,
      nextRenewalDate: endDate,
      totalPaid: fee,
    });

    await AccountManager.findByIdAndUpdate(managerId, { $inc: { currentClientCount: 1 } });
    await User.findByIdAndUpdate(req.user._id, { accountManagerId: managerId });

    res.json({ success: true, message: `${serviceType} service activated.`, service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/account-manager/service
router.get('/service', authMiddleware, async (req, res) => {
  try {
    const service = await DedicatedAccountManagerService.findOne({ user: req.user._id, status: 'active' })
      .populate('manager');
    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
