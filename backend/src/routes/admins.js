const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const AdminUser = require('../models/AdminUser');
const AdminSession = require('../models/AdminSession');
const adminAuth = require('../middleware/adminAuth');
const { adminRole } = require('../middleware/adminRole');
const { createAuditLog } = require('../utils/audit');

const router = express.Router();

const SALT_ROUNDS = 12;
const TEMP_PASSWORD_LENGTH = 16;
const PASSWORD_EXPIRY_DAYS = 90;

const generateTempPassword = () => crypto.randomBytes(12).toString('base64').slice(0, TEMP_PASSWORD_LENGTH);

router.use(adminAuth, adminRole(['SuperAdmin']));

router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [admins, total] = await Promise.all([
      AdminUser.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      AdminUser.countDocuments(),
    ]);

    return res.status(200).json({
      admins,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('List admins error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });
    return res.status(200).json({ admin });
  } catch (err) {
    console.error('Get admin error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { email, firstName, lastName, phoneNumber, role, permissions, ipWhitelist, twoFAEnabled, twoFAMethod } =
      req.body;

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ message: 'email, firstName, lastName, and role are required.' });
    }

    const existing = await AdminUser.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use.' });

    const tempPassword = generateTempPassword();
    const passwordExpiryAt = new Date(Date.now() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const admin = new AdminUser({
      email,
      password: tempPassword,
      firstName,
      lastName,
      phoneNumber,
      role,
      permissions: permissions || [],
      ipWhitelist: ipWhitelist || [],
      twoFAEnabled: twoFAEnabled || false,
      twoFAMethod: twoFAMethod || 'App',
      passwordExpiryAt,
      createdBy: req.admin._id,
    });

    await admin.save();

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'CREATE_ADMIN',
      resource: 'admins',
      resourceId: admin._id,
      newValue: { email, firstName, lastName, role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    const adminObj = admin.toJSON();
    return res.status(201).json({ admin: adminObj, tempPassword });
  } catch (err) {
    console.error('Create admin error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    const allowedFields = ['role', 'permissions', 'ipWhitelist', 'twoFAEnabled', 'twoFAMethod', 'isActive'];
    const oldValue = {};
    const newValue = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        oldValue[field] = admin[field];
        admin[field] = req.body[field];
        newValue[field] = req.body[field];
      }
    });

    admin.updatedBy = req.admin._id;
    await admin.save();

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'UPDATE_ADMIN',
      resource: 'admins',
      resourceId: admin._id,
      oldValue,
      newValue,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ admin: admin.toJSON() });
  } catch (err) {
    console.error('Update admin error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    const admin = await AdminUser.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    await AdminSession.updateMany({ adminId: admin._id }, { isActive: false });
    await AdminUser.findByIdAndDelete(req.params.id);

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'DELETE_ADMIN',
      resource: 'admins',
      resourceId: req.params.id,
      oldValue: { email: admin.email, role: admin.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ message: 'Admin deleted successfully.' });
  } catch (err) {
    console.error('Delete admin error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/:id/reset-password', async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    const tempPassword = generateTempPassword();
    admin.password = tempPassword;
    admin.passwordExpiryAt = new Date();
    admin.updatedBy = req.admin._id;
    await admin.save();

    await AdminSession.updateMany({ adminId: admin._id }, { isActive: false });

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'RESET_ADMIN_PASSWORD',
      resource: 'admins',
      resourceId: admin._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ message: 'Password reset successfully.', tempPassword });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/:id/suspend', async (req, res) => {
  try {
    const { reason } = req.body;
    const admin = await AdminUser.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    admin.isActive = false;
    admin.updatedBy = req.admin._id;
    await admin.save();

    await AdminSession.updateMany({ adminId: admin._id }, { isActive: false });

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'SUSPEND_ADMIN',
      resource: 'admins',
      resourceId: admin._id,
      details: { reason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ message: 'Admin suspended successfully.' });
  } catch (err) {
    console.error('Suspend admin error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/:id/activate', async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    admin.isActive = true;
    admin.updatedBy = req.admin._id;
    await admin.save();

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'ACTIVATE_ADMIN',
      resource: 'admins',
      resourceId: admin._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'Success',
    });

    return res.status(200).json({ message: 'Admin activated successfully.' });
  } catch (err) {
    console.error('Activate admin error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
