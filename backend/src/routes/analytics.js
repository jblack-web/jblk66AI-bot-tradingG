const express = require('express');

const adminAuth = require('../middleware/adminAuth');
const { adminRole } = require('../middleware/adminRole');

const router = express.Router();

router.use(adminAuth, adminRole(['SuperAdmin', 'AnalyticsAdmin']));

router.get('/dashboard', (req, res) => {
  const now = new Date();
  return res.status(200).json({
    stats: {
      tvl: { btc: 1463.72, usd: 94141430 },
      totalStakers: 3842,
      activeStakes: 5210,
      totalRewardsPaid: { btc: 18.4, usd: 1183440 },
      revenue: {
        today: { btc: 0.12, usd: 7716 },
        thisWeek: { btc: 0.84, usd: 54012 },
        thisMonth: { btc: 3.52, usd: 226380 },
      },
      poolBreakdown: [
        { name: 'Flexible Pool', tvl: 120.5, stakers: 1240, apyRate: 5.5 },
        { name: '30-Day Pool', tvl: 450.2, stakers: 1580, apyRate: 8.0 },
        { name: '90-Day Pool', tvl: 892.0, stakers: 1022, apyRate: 12.5 },
      ],
      recentActivity: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        return {
          date: d.toISOString().slice(0, 10),
          newStakers: Math.floor(Math.random() * 50) + 10,
          stakes: Math.floor(Math.random() * 100) + 20,
          payouts: parseFloat((Math.random() * 0.5).toFixed(4)),
        };
      }).reverse(),
    },
    generatedAt: now.toISOString(),
  });
});

router.get('/reports', (req, res) => {
  return res.status(200).json({
    reports: [
      { id: '1', name: 'Monthly Revenue Report', type: 'Revenue', period: 'June 2025', status: 'Ready', createdAt: new Date().toISOString() },
      { id: '2', name: 'Staker Growth Report', type: 'Users', period: 'Q2 2025', status: 'Ready', createdAt: new Date().toISOString() },
      { id: '3', name: 'Pool Performance Report', type: 'Pools', period: 'June 2025', status: 'Processing', createdAt: new Date().toISOString() },
      { id: '4', name: 'Payout Summary', type: 'Payouts', period: 'June 2025', status: 'Ready', createdAt: new Date().toISOString() },
    ],
  });
});

module.exports = router;
