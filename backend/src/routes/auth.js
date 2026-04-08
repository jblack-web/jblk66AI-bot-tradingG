const express = require('express');
const rateLimit = require('express-rate-limit');
const speakeasy = require('speakeasy');
const bcrypt = require('bcrypt');

const AdminUser = require('../models/AdminUser');
const AdminSession = require('../models/AdminSession');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { createAuditLog } = require('../utils/audit');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please try again later.' },
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Too many requests.' },
});

const getDeviceInfo = (req) => req.headers['user-agent'] || 'Unknown';
const getIP = (req) => req.ip || req.connection.remoteAddress || 'Unknown';

const performLogin = async (req, res, requireTwoFA = false) => {
  const { email, password, twoFACode } = req.body;
  const ipAddress = getIP(req);
  const userAgent = getDeviceInfo(req);

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const admin = await AdminUser.findOne({ email: email.toLowerCase() }).select(
    '+password +twoFASecret +backupCodes'
  );

  if (!admin) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  if (!admin.isActive) {
    await createAuditLog({
      adminEmail: email,
      action: 'LOGIN_ATTEMPT',
      resource: 'auth',
      ipAddress,
      userAgent,
      status: 'Failure',
      errorMessage: 'Account inactive',
    });
    return res.status(401).json({ message: 'Account is inactive.' });
  }

  if (admin.isLocked) {
    if (admin.lockExpiresAt && new Date() > admin.lockExpiresAt) {
      await admin.resetFailedLogin();
    } else {
      await createAuditLog({
        adminId: admin._id,
        adminEmail: admin.email,
        action: 'LOGIN_ATTEMPT',
        resource: 'auth',
        ipAddress,
        userAgent,
        status: 'Failure',
        errorMessage: 'Account locked',
      });
      return res.status(401).json({ message: 'Account is locked. Please contact support.' });
    }
  }

  const passwordMatch = await admin.comparePassword(password);
  if (!passwordMatch) {
    await admin.incrementFailedLogin();
    await createAuditLog({
      adminId: admin._id,
      adminEmail: admin.email,
      action: 'LOGIN_ATTEMPT',
      resource: 'auth',
      ipAddress,
      userAgent,
      status: 'Failure',
      errorMessage: 'Invalid password',
    });
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  if (admin.twoFAEnabled) {
    if (!twoFACode) {
      if (requireTwoFA) {
        return res.status(400).json({ message: '2FA code is required.' });
      }
      return res.status(200).json({ requiresTwoFA: true });
    }

    let twoFAValid = false;

    if (admin.twoFASecret) {
      twoFAValid = speakeasy.totp.verify({
        secret: admin.twoFASecret,
        encoding: 'base32',
        token: twoFACode,
        window: 1,
      });
    }

    if (!twoFAValid && admin.backupCodes && admin.backupCodes.length > 0) {
      for (let i = 0; i < admin.backupCodes.length; i++) {
        const match = await bcrypt.compare(twoFACode, admin.backupCodes[i]);
        if (match) {
          admin.backupCodes.splice(i, 1);
          await admin.save();
          twoFAValid = true;
          break;
        }
      }
    }

    if (!twoFAValid) {
      await createAuditLog({
        adminId: admin._id,
        adminEmail: admin.email,
        action: 'LOGIN_ATTEMPT',
        resource: 'auth',
        ipAddress,
        userAgent,
        status: 'Failure',
        errorMessage: 'Invalid 2FA code',
      });
      return res.status(401).json({ message: 'Invalid 2FA code.' });
    }
  }

  const tokenPayload = { id: admin._id, email: admin.email, role: admin.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await AdminSession.create({
    adminId: admin._id,
    token: accessToken,
    refreshToken,
    ipAddress,
    userAgent,
    expiresAt: sessionExpiresAt,
  });

  admin.lastLogin = new Date();
  admin.lastLoginIP = ipAddress;
  admin.lastLoginDevice = userAgent;
  await admin.resetFailedLogin();

  await createAuditLog({
    adminId: admin._id,
    adminEmail: admin.email,
    action: 'LOGIN',
    resource: 'auth',
    ipAddress,
    userAgent,
    status: 'Success',
  });

  return res.status(200).json({
    token: accessToken,
    refreshToken,
    admin: {
      id: admin._id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      permissions: admin.permissions,
    },
  });
};

router.post('/login', loginLimiter, async (req, res) => {
  try {
    await performLogin(req, res, false);
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/verify-2fa', loginLimiter, async (req, res) => {
  try {
    await performLogin(req, res, true);
  } catch (err) {
    console.error('Verify 2FA error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/logout', adminAuth, async (req, res) => {
  try {
    await AdminSession.findByIdAndUpdate(req.session._id, { isActive: false });

    await createAuditLog({
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      action: 'LOGOUT',
      resource: 'auth',
      ipAddress: getIP(req),
      userAgent: getDeviceInfo(req),
      status: 'Success',
    });

    res.clearCookie('adminToken');
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/refresh', refreshLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }

    const session = await AdminSession.findOne({
      adminId: decoded.id,
      refreshToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({ message: 'Session not found or expired.' });
    }

    const admin = await AdminUser.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Admin not found or inactive.' });
    }

    const newAccessToken = generateAccessToken({
      id: admin._id,
      email: admin.email,
      role: admin.role,
    });

    session.token = newAccessToken;
    session.lastActivityAt = new Date();
    await session.save();

    return res.status(200).json({ token: newAccessToken });
  } catch (err) {
    console.error('Refresh error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const admin = await AdminUser.findOne({ email: email.toLowerCase() });
    if (admin) {
      await createAuditLog({
        adminId: admin._id,
        adminEmail: admin.email,
        action: 'PASSWORD_RESET_REQUEST',
        resource: 'auth',
        ipAddress: getIP(req),
        userAgent: getDeviceInfo(req),
        status: 'Success',
      });
    }

    return res.status(200).json({ message: 'If this email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('Password reset error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
