const express = require('express');
const { v4: uuidv4 } = require('uuid');

const adminAuth = require('../middleware/adminAuth');
const { adminRole } = require('../middleware/adminRole');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();

const mockPayouts = Array.from({ length: 40 }, (_, i) => ({
  id: uuidv4(),
  userId: `user_${(i % 25) + 1}`,
  walletAddress: `bc1q${Math.random().toString(36).slice(2, 34)}`,
  amount: parseFloat((Math.random() * 0.1).toFixed(6)),
  type: i % 4 === 0 ? 'Manual' : 'Automated',
  status: ['Pending', 'Processing', 'Completed', 'Failed'][i % 4],
  txHash: i % 4 !== 3 ? `0x${Math.random().toString(16).slice(2, 66)}` : null,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

const allRoles = ['SuperAdmin', 'SupportAdmin', 'FinanceAdmin', 'AnalyticsAdmin'];
const manualRoles = ['SuperAdmin', 'SupportAdmin', 'FinanceAdmin'];

router.use(adminAuth, adminRole(allRoles));

router.get('/', (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const start = (page - 1) * limit;

  let filtered = [...mockPayouts];
  if (req.query.status) filtered = filtered.filter((p) => p.status === req.query.status);
  if (req.query.type) filtered = filtered.filter((p) => p.type === req.query.type);
  if (req.query.userId) filtered = filtered.filter((p) => p.userId === req.query.userId);

  const paginated = filtered.slice(start, start + limit);
  return res.status(200).json({ payouts: paginated, pagination: { page, limit, total: filtered.length } });
});

router.post('/manual', adminRole(manualRoles), async (req, res) => {
  try {
    const { userId, walletAddress, amount, reason } = req.body;
    if (!userId || !walletAddress || !amount) {
      return res.status(400).json({ message: 'userId, walletAddress, and amount are required.' });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive.' });
    }

    const payout = {
      id: uuidv4(),
      userId,
      walletAddress,
      amount: parseFloat(amount),
      type: 'Manual',
      status: 'Pending',
      txHash: null,
      reason: reason || '',
      createdBy: req.admin._id,
      createdAt: new Date().toISOString(),
    };
    mockPayouts.unshift(payout);

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'MANUAL_PAYOUT',
      resource: 'payouts',
      resourceId: payout.id,
      newValue: { userId, walletAddress, amount, reason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(201).json({ payout });
  } catch (err) {
    console.error('Manual payout error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
