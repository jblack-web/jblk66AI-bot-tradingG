require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const marketplaceRoutes = require('./routes/marketplace');
const miningRoutes = require('./routes/mining');
const adminRoutes = require('./routes/admin');
const sellerRoutes = require('./routes/seller');
const referralRoutes = require('./routes/referral');

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiter: 200 req/15 min per IP
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
// Strict limiter for auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests, please try again later.' } });

app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/referral', referralRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jblk66ai';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
