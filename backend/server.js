require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later' },
});

// ─── Static files ─────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/staking', require('./routes/adminStaking'));
app.use('/api/withdrawals', require('./routes/withdrawals'));
app.use('/api/tiers', require('./routes/tiers'));
app.use('/api/promo-codes', require('./routes/promoCodes'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/account-manager', require('./routes/accountManager'));
app.use('/api/ai-insights', require('./routes/aiMarketInsights'));
app.use('/api/trading', require('./routes/trading'));
app.use('/api/staking', require('./routes/staking'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'jblk66AI-bot-tradingG', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Cron jobs ────────────────────────────────────────────────────────────────

require('./config/cronJobs');

// ─── Database & Start ─────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jblk66ai-trading';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('✅ MongoDB connected');
    // Seed default staking pools if none exist
    const { seedStakingPools } = require('./utils/seedPools');
    await seedStakingPools();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 jblk66AI Trading Bot running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;

