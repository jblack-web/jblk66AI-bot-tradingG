require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admins');
const auditLogRoutes = require('./src/routes/auditLogs');
const securityRoutes = require('./src/routes/security');
const poolRoutes = require('./src/routes/pools');
const stakerRoutes = require('./src/routes/stakers');
const payoutRoutes = require('./src/routes/payouts');
const analyticsRoutes = require('./src/routes/analytics');
const profileRoutes = require('./src/routes/profile');

const app = express();

app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  })
);

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/admins', adminRoutes);
app.use('/api/admin/audit-logs', auditLogRoutes);
app.use('/api/admin/security', securityRoutes);
app.use('/api/admin/pools', poolRoutes);
app.use('/api/admin/stakers', stakerRoutes);
app.use('/api/admin/payouts', payoutRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/profile', profileRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jblk66ai';

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log(`MongoDB connected: ${MONGODB_URI}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.warn('Starting server without database connection...');
  }

  app.listen(PORT, () => {
    console.log(`Admin backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

startServer();

module.exports = app;
