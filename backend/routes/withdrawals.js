const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  getWithdrawalSettings, getFullWithdrawalSettings, updateWithdrawalSettings,
  toggleWithdrawalMode, getPendingWithdrawals, getUserWithdrawals,
} = require('../controllers/withdrawalController');

// User routes
router.get('/settings', authMiddleware, getWithdrawalSettings);
router.get('/my-requests', authMiddleware, getUserWithdrawals);

// Admin routes
router.get('/settings/full', authMiddleware, adminMiddleware, getFullWithdrawalSettings);
router.put('/settings', authMiddleware, adminMiddleware, updateWithdrawalSettings);
router.patch('/settings/toggle-mode', authMiddleware, adminMiddleware, toggleWithdrawalMode);
router.get('/pending', authMiddleware, adminMiddleware, getPendingWithdrawals);

module.exports = router;
