require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { seedStakingPools } = require('./utils/seedPools');

// Require JWT_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required in production');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later' },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

const authRoutes = require('./routes/auth');
const stakingRoutes = require('./routes/staking');
const adminStakingRoutes = require('./routes/adminStaking');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/staking', stakingRoutes);
app.use('/api/admin/staking', adminStakingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'jblk66AI-bot-tradingG', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Database & Start ─────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jblk66ai';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    await seedStakingPools();
    app.listen(PORT, () => {
      console.log(`🚀 jblk66AI Trading Bot running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
