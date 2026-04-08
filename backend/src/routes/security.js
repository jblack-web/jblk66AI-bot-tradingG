const express = require('express');

const AdminSession = require('../models/AdminSession');
const adminAuth = require('../middleware/adminAuth');
const { adminRole } = require('../middleware/adminRole');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();

let securitySettings = {
  maxFailedLoginAttempts: 5,
  lockDurationMinutes: 30,
  sessionTimeoutMinutes: 15,
  passwordMinLength: 12,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: true,
  passwordExpiryDays: 90,
  twoFARequired: false,
  ipWhitelistEnabled: false,
  allowedIPs: [],
};

router.get('/settings', adminAuth, adminRole(['SuperAdmin']), (req, res) => {
  return res.status(200).json({ settings: securitySettings });
});

router.put('/settings', adminAuth, adminRole(['SuperAdmin']), async (req, res) => {
  try {
    const validators = {
      maxFailedLoginAttempts: (v) => Number.isInteger(v) && v >= 1 && v <= 20,
      lockDurationMinutes: (v) => Number.isInteger(v) && v >= 1 && v <= 1440,
      sessionTimeoutMinutes: (v) => Number.isInteger(v) && v >= 1 && v <= 1440,
      passwordMinLength: (v) => Number.isInteger(v) && v >= 8 && v <= 128,
      passwordRequireUppercase: (v) => typeof v === 'boolean',
      passwordRequireNumbers: (v) => typeof v === 'boolean',
      passwordRequireSymbols: (v) => typeof v === 'boolean',
      passwordExpiryDays: (v) => Number.isInteger(v) && v >= 1 && v <= 365,
      twoFARequired: (v) => typeof v === 'boolean',
      ipWhitelistEnabled: (v) => typeof v === 'boolean',
      allowedIPs: (v) => Array.isArray(v) && v.every((ip) => typeof ip === 'string'),
    };

    const oldValue = { ...securitySettings };
    const errors = [];

    Object.keys(validators).forEach((key) => {
      if (req.body[key] !== undefined) {
        if (!validators[key](req.body[key])) {
          errors.push(`Invalid value for ${key}`);
        } else {
          securitySettings[key] = req.body[key];
        }
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation errors', errors });
    }

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'UPDATE_SECURITY_SETTINGS',
      resource: 'settings',
      oldValue,
      newValue: { ...securitySettings },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ settings: securitySettings });
  } catch (err) {
    console.error('Update settings error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/sessions', adminAuth, async (req, res) => {
  try {
    const sessions = await AdminSession.find({
      adminId: req.admin._id,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActivityAt: -1 });

    return res.status(200).json({ sessions });
  } catch (err) {
    console.error('Get sessions error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/sessions/:id', adminAuth, async (req, res) => {
  try {
    const session = await AdminSession.findOne({
      _id: req.params.id,
      adminId: req.admin._id,
    });

    if (!session) return res.status(404).json({ message: 'Session not found.' });

    session.isActive = false;
    await session.save();

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'REVOKE_SESSION',
      resource: 'security',
      resourceId: session._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ message: 'Session revoked successfully.' });
  } catch (err) {
    console.error('Delete session error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
