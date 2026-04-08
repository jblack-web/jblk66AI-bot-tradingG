const express = require('express');
const router = express.Router();
const {
  initiateDeposit,
  completeDeposit,
  requestWithdrawal,
  getTransactionHistory,
  adminGetPendingWithdrawals,
  adminApproveWithdrawal,
  adminRejectWithdrawal,
} = require('../controllers/paymentController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.post('/deposit/initiate', authenticateToken, initiateDeposit);
router.post('/deposit/complete', authenticateToken, completeDeposit);
router.post('/withdrawal/request', authenticateToken, requestWithdrawal);
router.get('/history', authenticateToken, getTransactionHistory);
router.get('/admin/pending-withdrawals', authenticateToken, requireAdmin, adminGetPendingWithdrawals);
router.post('/admin/withdrawal/:id/approve', authenticateToken, requireAdmin, adminApproveWithdrawal);
router.post('/admin/withdrawal/:id/reject', authenticateToken, requireAdmin, adminRejectWithdrawal);

module.exports = router;
