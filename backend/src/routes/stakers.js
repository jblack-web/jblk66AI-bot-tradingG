const express = require('express');
const { v4: uuidv4 } = require('uuid');

const adminAuth = require('../middleware/adminAuth');
const { adminRole } = require('../middleware/adminRole');

const router = express.Router();

const mockStakers = Array.from({ length: 25 }, (_, i) => ({
  id: uuidv4(),
  userId: `user_${i + 1}`,
  email: `staker${i + 1}@example.com`,
  walletAddress: `bc1q${Math.random().toString(36).slice(2, 34)}`,
  totalStaked: parseFloat((Math.random() * 5).toFixed(4)),
  activeStakes: Math.floor(Math.random() * 5) + 1,
  totalRewards: parseFloat((Math.random() * 0.5).toFixed(6)),
  joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  isVerified: Math.random() > 0.3,
  status: Math.random() > 0.1 ? 'Active' : 'Suspended',
}));

router.use(adminAuth, adminRole(['SuperAdmin', 'SupportAdmin']));

router.get('/', (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const start = (page - 1) * limit;

  let filtered = [...mockStakers];
  if (req.query.status) filtered = filtered.filter((s) => s.status === req.query.status);
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    filtered = filtered.filter((s) => s.email.toLowerCase().includes(q) || s.userId.toLowerCase().includes(q));
  }

  const paginated = filtered.slice(start, start + limit);
  return res.status(200).json({ stakers: paginated, pagination: { page, limit, total: filtered.length } });
});

router.get('/:id', (req, res) => {
  const staker = mockStakers.find((s) => s.id === req.params.id);
  if (!staker) return res.status(404).json({ message: 'Staker not found.' });

  const stakes = Array.from({ length: staker.activeStakes }, (_, i) => ({
    id: uuidv4(),
    poolName: ['Flexible Pool', '30-Day Pool', '90-Day Pool'][i % 3],
    amount: parseFloat((Math.random() * 2).toFixed(4)),
    apyRate: [5.5, 8.0, 12.5][i % 3],
    startDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Active',
  }));

  return res.status(200).json({ staker: { ...staker, stakes } });
});

module.exports = router;
