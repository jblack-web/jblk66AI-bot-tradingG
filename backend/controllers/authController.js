const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Membership = require('../models/Membership');
const Referral = require('../models/Referral');

const JWT_SECRET = process.env.JWT_SECRET || 'jblk66ai-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateReferralCode = () => uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase();

const sendVerificationEmail = async (email, token) => {
  console.log(`[MOCK EMAIL] Verification email sent to ${email} with token: ${token}`);
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, country, phone, referralCode: usedCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    let referredByUser = null;
    if (usedCode) {
      referredByUser = await User.findOne({ referralCode: usedCode });
    }

    const verificationToken = uuidv4();
    const referralCode = generateReferralCode();

    const user = new User({
      email,
      password,
      firstName,
      lastName,
      country,
      phone,
      referralCode,
      referredBy: referredByUser ? referredByUser._id : undefined,
      emailVerificationToken: verificationToken,
    });

    await user.save();

    const tierConfig = Membership.getTierConfig('free');
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + tierConfig.trialDays);

    const membership = new Membership({
      user: user._id,
      tier: 'free',
      miningPower: tierConfig.miningPower,
      dailyEarningsMin: tierConfig.dailyEarningsMin,
      dailyEarningsMax: tierConfig.dailyEarningsMax,
      price: 0,
      trialStartDate: now,
      trialEndDate: trialEnd,
      conversionStatus: 'trial',
      isActive: true,
    });

    await membership.save();

    user.membership = membership._id;
    await user.save();

    if (referredByUser) {
      const referral = new Referral({
        referrer: referredByUser._id,
        referred: user._id,
        bonusAmount: 10,
        status: 'pending',
      });
      await referral.save();
    }

    await sendVerificationEmail(user.email, verificationToken);

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('membership');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        walletBalance: user.walletBalance,
        totalEarnings: user.totalEarnings,
        referralCode: user.referralCode,
        membership: user.membership,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Email verification failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -emailVerificationToken')
      .populate('membership');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, country, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, country, phone },
      { new: true, runValidators: true }
    )
      .select('-password -emailVerificationToken')
      .populate('membership');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = { register, login, verifyEmail, getProfile, updateProfile };
