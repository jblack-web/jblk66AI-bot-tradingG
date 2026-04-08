const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const AIMarketInsight = require('../models/AIMarketInsight');

// GET /api/ai-insights/insights
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const { type, market, priority, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (market) filter.market = market;
    if (priority) filter.priority = priority;

    const insights = await AIMarketInsight.find(filter)
      .sort({ createdAt: -1 })
      .limit(+limit);

    res.json({ success: true, insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ai-insights/config
router.get('/config', authMiddleware, async (req, res) => {
  res.json({
    success: true,
    config: {
      models: ['LSTM', 'GRU', 'Transformer', 'Ensemble'],
      accuracy: { prediction: '82-88%', sentiment: '85-92%', anomaly: '88-95%', overall: '85-90%' },
      updateInterval: '5 minutes',
      dataSources: ['Binance', 'CryptoCompare', 'NewsAPI', 'Twitter', 'Reddit', 'Glassnode'],
    },
  });
});

module.exports = router;
