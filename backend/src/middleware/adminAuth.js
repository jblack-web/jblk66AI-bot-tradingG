const AdminUser = require('../models/AdminUser');
const AdminSession = require('../models/AdminSession');
const { verifyAccessToken } = require('../utils/jwt');

const adminAuth = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.adminToken) {
      token = req.cookies.adminToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired.' });
      }
      return res.status(401).json({ message: 'Invalid token.' });
    }

    const admin = await AdminUser.findById(decoded.id).select('+password');
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found.' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ message: 'Account is inactive.' });
    }

    if (admin.isLocked) {
      if (admin.lockExpiresAt && new Date() > admin.lockExpiresAt) {
        await admin.resetFailedLogin();
      } else {
        return res.status(401).json({ message: 'Account is locked. Please contact support.' });
      }
    }

    const session = await AdminSession.findOne({
      adminId: admin._id,
      token,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({ message: 'Session not found or expired.' });
    }

    session.lastActivityAt = new Date();
    await session.save();

    req.admin = admin;
    req.session = session;
    next();
  } catch (err) {
    console.error('adminAuth error:', err.message);
    return res.status(401).json({ message: 'Authentication failed.' });
  }
};

module.exports = adminAuth;
