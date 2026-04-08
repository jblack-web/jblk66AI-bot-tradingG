const express = require('express');
const { v4: uuidv4 } = require('uuid');

const adminAuth = require('../middleware/adminAuth');
const { adminRole } = require('../middleware/adminRole');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();

const mockPools = [
  { id: uuidv4(), name: 'Flexible Pool', apyRate: 5.5, lockPeriod: 0, minStake: 0.001, maxStake: 10, description: 'No lock-up period', isActive: true, tvl: 120.5 },
  { id: uuidv4(), name: '30-Day Pool', apyRate: 8.0, lockPeriod: 30, minStake: 0.01, maxStake: 50, description: '30-day lock for higher APY', isActive: true, tvl: 450.2 },
  { id: uuidv4(), name: '90-Day Pool', apyRate: 12.5, lockPeriod: 90, minStake: 0.05, maxStake: 100, description: '90-day lock for premium APY', isActive: true, tvl: 892.0 },
];

router.use(adminAuth, adminRole(['SuperAdmin', 'StakingAdmin']));

router.get('/', (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const start = (page - 1) * limit;
  const paginated = mockPools.slice(start, start + limit);
  return res.status(200).json({ pools: paginated, pagination: { page, limit, total: mockPools.length } });
});

router.post('/', async (req, res) => {
  try {
    const { name, apyRate, lockPeriod, minStake, maxStake, description } = req.body;
    if (!name || apyRate == null) {
      return res.status(400).json({ message: 'name and apyRate are required.' });
    }

    const pool = { id: uuidv4(), name, apyRate, lockPeriod: lockPeriod || 0, minStake: minStake || 0, maxStake: maxStake || null, description: description || '', isActive: true, tvl: 0 };
    mockPools.push(pool);

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'CREATE_POOL',
      resource: 'pools',
      resourceId: pool.id,
      newValue: pool,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(201).json({ pool });
  } catch (err) {
    console.error('Create pool error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const idx = mockPools.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Pool not found.' });

    const oldValue = { ...mockPools[idx] };
    const allowed = ['name', 'apyRate', 'lockPeriod', 'minStake', 'maxStake', 'description', 'isActive'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) mockPools[idx][f] = req.body[f]; });

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'UPDATE_POOL',
      resource: 'pools',
      resourceId: req.params.id,
      oldValue,
      newValue: { ...mockPools[idx] },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ pool: mockPools[idx] });
  } catch (err) {
    console.error('Update pool error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', adminRole(['SuperAdmin']), async (req, res) => {
  try {
    const idx = mockPools.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Pool not found.' });

    mockPools[idx].isActive = false;

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'DELETE_POOL',
      resource: 'pools',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ message: 'Pool archived successfully.' });
  } catch (err) {
    console.error('Delete pool error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
