const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const AutomatedTradeSchedule = require('../models/AutomatedTradeSchedule');

// GET /api/trading/schedules
router.get('/schedules', authMiddleware, async (req, res) => {
  try {
    const schedules = await AutomatedTradeSchedule.find({ user: req.user._id });
    res.json({ success: true, schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/trading/schedules
router.post('/schedules', authMiddleware, async (req, res) => {
  try {
    const schedule = await AutomatedTradeSchedule.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/trading/schedules/:id
router.put('/schedules/:id', authMiddleware, async (req, res) => {
  try {
    const schedule = await AutomatedTradeSchedule.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, req.body, { new: true }
    );
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/trading/schedules/:id
router.delete('/schedules/:id', authMiddleware, async (req, res) => {
  try {
    await AutomatedTradeSchedule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Schedule deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/trading/admin/all (admin only)
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const schedules = await AutomatedTradeSchedule.find(filter)
      .populate('user', 'username email currentTier')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit);

    const total = await AutomatedTradeSchedule.countDocuments(filter);

    // Aggregate stats
    const stats = await AutomatedTradeSchedule.aggregate([
      { $group: {
        _id: null,
        totalSchedules: { $sum: 1 },
        activeSchedules: { $sum: { $cond: ['$isActive', 1, 0] } },
        totalPnl: { $sum: '$totalPnl' },
        totalExecuted: { $sum: '$totalExecuted' },
        totalWins: { $sum: '$winCount' },
        totalLosses: { $sum: '$lossCount' },
      }},
    ]);

    res.json({ success: true, schedules, total, stats: stats[0] || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
