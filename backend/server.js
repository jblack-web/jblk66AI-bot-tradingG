require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jblk66ai-trading';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/withdrawals', require('./routes/withdrawals'));
app.use('/api/tiers', require('./routes/tiers'));
app.use('/api/promo-codes', require('./routes/promoCodes'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/account-manager', require('./routes/accountManager'));
app.use('/api/ai-insights', require('./routes/aiMarketInsights'));
app.use('/api/trading', require('./routes/trading'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Cron jobs
require('./config/cronJobs');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
