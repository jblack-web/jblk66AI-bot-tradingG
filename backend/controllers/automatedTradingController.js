'use strict';

const AutomatedTradeSchedule = require('../models/AutomatedTradeSchedule');
const UserSubscription = require('../models/UserSubscription');
const Trade = require('../models/Trade');

const configureAutomatedTrading = async (req, res) => {
  try {
    const sub = await UserSubscription.findOne({ userId: req.user._id, status: 'active' });
    if (!sub || sub.tierName === 'basic') {
      return res.status(403).json({ error: 'Automated trading requires Advanced or Premium tier.' });
    }

    const { strategy, tradingPairs, riskPercentage, stopLossPercentage, takeProfitPercentage, maxDailyTrades } = req.body;

    const maxAllowed = sub.tierName === 'premium' ? 20 : 10;
    const requestedMax = parseInt(maxDailyTrades) || 5;

    let schedule = await AutomatedTradeSchedule.findOne({ userId: req.user._id });
    const updateData = {
      strategy: strategy || 'momentum',
      tradingPairs: tradingPairs || ['BTCUSDT', 'ETHUSDT'],
      riskPercentage: parseFloat(riskPercentage) || 2,
      stopLossPercentage: parseFloat(stopLossPercentage) || 2,
      takeProfitPercentage: parseFloat(takeProfitPercentage) || 4,
      maxDailyTrades: Math.min(requestedMax, maxAllowed)
    };

    if (schedule) {
      Object.assign(schedule, updateData);
      await schedule.save();
    } else {
      schedule = await AutomatedTradeSchedule.create({ userId: req.user._id, ...updateData });
    }

    res.json({ success: true, schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const startAutomatedTrading = async (req, res) => {
  try {
    const schedule = await AutomatedTradeSchedule.findOne({ userId: req.user._id });
    if (!schedule) return res.status(404).json({ error: 'Please configure automated trading first.' });
    schedule.isActive = true;
    await schedule.save();
    res.json({ success: true, message: 'Automated trading started.', schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const stopAutomatedTrading = async (req, res) => {
  try {
    const schedule = await AutomatedTradeSchedule.findOne({ userId: req.user._id });
    if (!schedule) return res.status(404).json({ error: 'Automated trading schedule not found.' });
    schedule.isActive = false;
    await schedule.save();
    res.json({ success: true, message: 'Automated trading stopped.', schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAutomatedTradingStatus = async (req, res) => {
  try {
    const schedule = await AutomatedTradeSchedule.findOne({ userId: req.user._id });
    if (!schedule) return res.json({ success: true, configured: false });
    res.json({ success: true, configured: true, schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTradingStats = async (req, res) => {
  try {
    const schedule = await AutomatedTradeSchedule.findOne({ userId: req.user._id });
    const autoTrades = await Trade.find({ userId: req.user._id, strategy: { $ne: 'manual' } });
    const closed = autoTrades.filter((t) => t.status === 'closed');
    const wins = closed.filter((t) => t.pnl > 0);

    res.json({
      success: true,
      stats: {
        isActive: schedule ? schedule.isActive : false,
        totalTrades: autoTrades.length,
        closedTrades: closed.length,
        wins: wins.length,
        winRate: closed.length > 0 ? ((wins.length / closed.length) * 100).toFixed(2) : 0,
        totalPnl: closed.reduce((acc, t) => acc + (t.pnl || 0), 0).toFixed(2),
        todaysTrades: schedule ? schedule.tradesExecutedToday : 0,
        maxDailyTrades: schedule ? schedule.maxDailyTrades : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { configureAutomatedTrading, startAutomatedTrading, stopAutomatedTrading, getAutomatedTradingStatus, getTradingStats };
