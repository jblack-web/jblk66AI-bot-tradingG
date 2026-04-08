const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  sendPayment, receivePayment, getPaymentHistory, requestWithdrawal,
  getWalletAddress, adminConfirmDeposit, adminProcessWithdrawal, adminGetPayments,
} = require('../controllers/paymentController');

// User routes
router.post('/send', authMiddleware, sendPayment);
router.post('/receive', authMiddleware, receivePayment);
router.get('/history', authMiddleware, getPaymentHistory);
router.post('/withdrawal', authMiddleware, requestWithdrawal);
router.get('/wallet-address', authMiddleware, getWalletAddress);

// Admin routes
router.get('/admin/all', authMiddleware, adminMiddleware, adminGetPayments);
router.patch('/admin/deposit/:paymentId/confirm', authMiddleware, adminMiddleware, adminConfirmDeposit);
router.patch('/admin/withdrawal/:paymentId/process', authMiddleware, adminMiddleware, adminProcessWithdrawal);

module.exports = router;
