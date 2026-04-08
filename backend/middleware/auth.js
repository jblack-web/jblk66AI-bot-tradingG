'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ error: 'Not authorized. No token provided.' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret_change_in_production'
    );

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    if (!user.isActive || user.isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret_change_in_production'
      );
      const user = await User.findById(decoded.id);
      if (user && user.isActive && !user.isBanned) {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};

module.exports = { protect, restrictTo, optionalAuth };
