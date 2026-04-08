const express = require('express');

const AuditLog = require('../models/AuditLog');
const adminAuth = require('../middleware/adminAuth');
const { adminRole } = require('../middleware/adminRole');

const router = express.Router();

router.use(adminAuth, adminRole(['SuperAdmin']));

router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.admin) filter.adminId = req.query.admin;
    if (req.query.action) filter.action = new RegExp(req.query.action, 'i');
    if (req.query.resource) filter.resource = req.query.resource;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) filter.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.timestamp.$lte = new Date(req.query.endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).skip(skip).limit(limit).sort({ timestamp: -1 }),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('List audit logs error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Audit log not found.' });
    return res.status(200).json({ log });
  } catch (err) {
    console.error('Get audit log error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/export', async (req, res) => {
  try {
    const filter = {};
    if (req.body.admin) filter.adminId = req.body.admin;
    if (req.body.action) filter.action = new RegExp(req.body.action, 'i');
    if (req.body.resource) filter.resource = req.body.resource;
    if (req.body.status) filter.status = req.body.status;
    if (req.body.startDate || req.body.endDate) {
      filter.timestamp = {};
      if (req.body.startDate) filter.timestamp.$gte = new Date(req.body.startDate);
      if (req.body.endDate) filter.timestamp.$lte = new Date(req.body.endDate);
    }

    const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(10000);

    const fields = ['_id', 'adminId', 'adminEmail', 'action', 'resource', 'resourceId', 'status', 'ipAddress', 'timestamp', 'errorMessage'];
    const header = fields.join(',');
    const rows = logs.map((log) =>
      fields
        .map((f) => {
          const val = log[f] != null ? String(log[f]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error('Export audit logs error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
