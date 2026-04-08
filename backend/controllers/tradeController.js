'use strict';

const Trade = require('../models/Trade');
const Wallet = require('../models/Wallet');
const { paginate, calculatePnL } = require('../utils/helpers');
const { getBinancePrice } = require('../services/marketDataService');

const getTradeHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, asset } = req.query;
    const { skip, limit: lim } = paginate(page, limit);

    const VALID_TYPES = ['spot', 'options', 'futures', 'gold'];
    const VALID_STATUSES = ['open', 'closed', 'cancelled'];

    const filter = { userId: req.user._id };
    if (type && VALID_TYPES.includes(type)) filter.type = type;
    if (status && VALID_STATUSES.includes(status)) filter.status = status;
    if (asset) filter.asset = asset.toUpperCase().replace(/[^A-Z0-9]/g, '');

    const [trades, total] = await Promise.all([
      Trade.find(filter).sort({ openedAt: -1 }).skip(skip).limit(lim),
      Trade.countDocuments(filter)
    ]);

    res.json({
      success: true,
      trades,
      pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTradeById = async (req, res) => {
  try {
    const trade = await Trade.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trade) return res.status(404).json({ error: 'Trade not found.' });
    res.json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTradeStats = async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user._id });
    const closedTrades = trades.filter((t) => t.status === 'closed');
    const wins = closedTrades.filter((t) => t.pnl > 0);
    const losses = closedTrades.filter((t) => t.pnl <= 0);
    const totalPnl = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const openTrades = trades.filter((t) => t.status === 'open');

    res.json({
      success: true,
      stats: {
        totalTrades: trades.length,
        openTrades: openTrades.length,
        closedTrades: closedTrades.length,
        wins: wins.length,
        losses: losses.length,
        winRate: closedTrades.length > 0 ? ((wins.length / closedTrades.length) * 100).toFixed(2) : 0,
        totalPnl: parseFloat(totalPnl.toFixed(2)),
        avgPnl: closedTrades.length > 0 ? parseFloat((totalPnl / closedTrades.length).toFixed(2)) : 0,
        bestTrade: closedTrades.length > 0 ? Math.max(...closedTrades.map((t) => t.pnl || 0)) : 0,
        worstTrade: closedTrades.length > 0 ? Math.min(...closedTrades.map((t) => t.pnl || 0)) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const closeTrade = async (req, res) => {
  try {
    const trade = await Trade.findOne({ _id: req.params.id, userId: req.user._id });
    if (!trade) return res.status(404).json({ error: 'Trade not found.' });
    if (trade.status !== 'open') return res.status(400).json({ error: 'Trade is not open.' });

    const exitPrice = req.body.exitPrice || (await getBinancePrice(`${trade.asset}USDT`)) || trade.entryPrice;
    const pnl = calculatePnL(trade.direction, trade.entryPrice, exitPrice, trade.quantity);

    trade.exitPrice = exitPrice;
    trade.pnl = pnl;
    trade.pnlPercentage = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100 * (trade.direction === 'buy' ? 1 : -1);
    trade.status = 'closed';
    trade.closedAt = new Date();
    await trade.save();

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet) {
      if (pnl > 0) {
        await wallet.credit(pnl, 'trade_profit', `Trade profit: ${trade.asset} ${trade.direction}`, trade._id.toString());
      } else if (pnl < 0) {
        const loss = Math.abs(pnl);
        if (wallet.balance >= loss) {
          await wallet.debit(loss, 'trade_loss', `Trade loss: ${trade.asset} ${trade.direction}`, trade._id.toString());
        }
      }
    }

    res.json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTradeHistory, getTradeById, getTradeStats, closeTrade };
