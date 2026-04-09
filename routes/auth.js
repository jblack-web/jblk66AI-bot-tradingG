const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sanitizeString } = require('../utils/sanitize');

const JWT_SECRET = process.env.JWT_SECRET || 'jblk66ai_dev_secret_change_in_production';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const username = sanitizeString(req.body.username);
    const email = sanitizeString(req.body.email);
    const { password, referralCode } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'username, email and password are required' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, message: 'password must be at least 8 characters' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or username already in use' });
    }

    let referredBy = null;
    if (referralCode) {
      const safeCode = sanitizeString(referralCode);
      if (safeCode) {
        const referrer = await User.findOne({ referralCode: safeCode });
        if (referrer) referredBy = referrer._id;
      }
    }

    const user = await User.create({
      username,
      email,
      password,
      referredBy,
      referralCode: `REF${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      data: { token, user: { id: user._id, username: user.username, email: user.email, role: user.role } },
      message: 'Registration successful',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = sanitizeString(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }
    if (typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: { token, user: { id: user._id, username: user.username, email: user.email, role: user.role } },
      message: 'Login successful',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
