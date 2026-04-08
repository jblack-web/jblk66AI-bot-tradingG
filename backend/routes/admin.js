const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getDashboard, getUsers, getUser, updateUser, suspendUser,
  getWithdrawMode, setWithdrawMode, getPendingWithdrawals, processWithdrawal,
  getPlatformSettings, updatePlatformSettings,
  getRevenue, getRigManagement, createRig, updateRig,
  getMiningStats, getMarketplaceStats,
} = require('../controllers/adminController');

router.use(protect, requireRole('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.post('/users/:id/suspend', suspendUser);

router.get('/withdraw-mode', getWithdrawMode);
router.put('/withdraw-mode', setWithdrawMode);
router.get('/withdrawals/pending', getPendingWithdrawals);
router.put('/withdrawals/:walletId/:txId/process', processWithdrawal);

router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);
router.get('/revenue', getRevenue);

router.get('/rigs', getRigManagement);
router.post('/rigs', createRig);
router.put('/rigs/:id', updateRig);

router.get('/mining-stats', getMiningStats);
router.get('/marketplace-stats', getMarketplaceStats);

module.exports = router;
