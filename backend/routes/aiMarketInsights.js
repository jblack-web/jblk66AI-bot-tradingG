const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
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

// POST /api/ai-insights/insights (admin only)
router.post('/insights', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const insight = await AIMarketInsight.create(req.body);
    res.status(201).json({ success: true, insight });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/ai-insights/insights/:id (admin only)
router.put('/insights/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const insight = await AIMarketInsight.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!insight) return res.status(404).json({ success: false, message: 'Insight not found.' });
    res.json({ success: true, insight });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/ai-insights/insights/:id (admin only)
router.delete('/insights/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await AIMarketInsight.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Insight deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ai-insights/all (admin only - includes inactive)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type, market, priority, limit = 50 } = req.query;
    const filter = {};
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

module.exports = router;
