const express = require('express');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const crypto = require('crypto');

const AdminUser = require('../models/AdminUser');
const adminAuth = require('../middleware/adminAuth');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();

const SALT_ROUNDS = 12;
const BACKUP_CODE_COUNT = 10;

router.use(adminAuth);

router.get('/', (req, res) => {
  const admin = req.admin.toJSON();
  return res.status(200).json({ admin });
});

router.put('/', async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;
    const admin = req.admin;

    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phoneNumber !== undefined) admin.phoneNumber = phoneNumber;

    await admin.save();

    await createAuditLog({
      adminId: admin._id,
      adminEmail: admin.email,
      action: 'UPDATE_PROFILE',
      resource: 'profile',
      newValue: { firstName, lastName, phoneNumber },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ admin: admin.toJSON() });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'oldPassword and newPassword are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const admin = await AdminUser.findById(req.admin._id).select('+password');
    const match = await admin.comparePassword(oldPassword);
    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    admin.password = newPassword;
    admin.passwordExpiryAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await admin.save();

    await createAuditLog({
      adminId: admin._id,
      adminEmail: admin.email,
      action: 'CHANGE_PASSWORD',
      resource: 'profile',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/2fa/enable', async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.admin._id).select('+twoFASecret');

    const secret = speakeasy.generateSecret({
      name: `jblk66AI Admin (${admin.email})`,
      length: 32,
    });

    admin.twoFASecret = secret.base32;
    admin.twoFAEnabled = false;
    await admin.save();

    await createAuditLog({
      adminId: admin._id,
      adminEmail: admin.email,
      action: '2FA_SETUP_INITIATED',
      resource: 'profile',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(secret.otpauth_url)}&size=200x200`,
    });
  } catch (err) {
    console.error('2FA enable error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/2fa/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'TOTP token is required.' });

    const admin = await AdminUser.findById(req.admin._id).select('+twoFASecret');
    if (!admin.twoFASecret) {
      return res.status(400).json({ message: '2FA setup not initiated. Call /2fa/enable first.' });
    }

    const valid = speakeasy.totp.verify({
      secret: admin.twoFASecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!valid) return res.status(400).json({ message: 'Invalid TOTP token.' });

    admin.twoFAEnabled = true;
    await admin.save();

    await createAuditLog({
      adminId: admin._id,
      adminEmail: admin.email,
      action: '2FA_ENABLED',
      resource: 'profile',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ message: '2FA enabled successfully.' });
  } catch (err) {
    console.error('2FA verify error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/2fa/disable', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required.' });

    const admin = await AdminUser.findById(req.admin._id).select('+password +twoFASecret +backupCodes');
    const match = await admin.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Incorrect password.' });

    admin.twoFAEnabled = false;
    admin.twoFASecret = undefined;
    admin.backupCodes = [];
    await admin.save();

    await createAuditLog({
      adminId: admin._id,
      adminEmail: admin.email,
      action: '2FA_DISABLED',
      resource: 'profile',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ message: '2FA disabled successfully.' });
  } catch (err) {
    console.error('2FA disable error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/2fa/backup-codes', async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.admin._id).select('+backupCodes');

    const plainCodes = Array.from({ length: BACKUP_CODE_COUNT }, () =>
      crypto.randomBytes(5).toString('hex').toUpperCase()
    );

    const hashedCodes = await Promise.all(plainCodes.map((code) => bcrypt.hash(code, SALT_ROUNDS)));

    admin.backupCodes = hashedCodes;
    await admin.save();

    await createAuditLog({
      adminId: admin._id,
      adminEmail: admin.email,
      action: 'REGENERATE_BACKUP_CODES',
      resource: 'profile',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({
      message: 'Backup codes generated. Save these codes securely — they will not be shown again.',
      backupCodes: plainCodes,
    });
  } catch (err) {
    console.error('Backup codes error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
