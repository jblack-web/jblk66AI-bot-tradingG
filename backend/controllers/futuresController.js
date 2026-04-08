'use strict';

const FuturesTrade = require('../models/FuturesTrade');
const Wallet = require('../models/Wallet');
const UserSubscription = require('../models/UserSubscription');
const { paginate } = require('../utils/helpers');
const { getBinancePrice } = require('../services/marketDataService');

const getMaxLeverage = async (userId) => {
  const sub = await UserSubscription.findOne({ userId, status: 'active' });
  if (!sub) return 5;
  if (sub.tierName === 'premium') return 20;
  if (sub.tierName === 'advanced') return 10;
  return 5;
};

const calculateLiquidationPrice = (direction, entryPrice, leverage, maintenanceMarginRate = 0.005) => {
  const liquidationBuffer = 1 / leverage - maintenanceMarginRate;
  if (direction === 'long') {
    return parseFloat((entryPrice * (1 - liquidationBuffer)).toFixed(2));
  }
  return parseFloat((entryPrice * (1 + liquidationBuffer)).toFixed(2));
};

const openFuturesPosition = async (req, res) => {
  try {
    const { asset, direction, size, leverage, stopLoss, takeProfit } = req.body;

    const maxLev = await getMaxLeverage(req.user._id);
    const requestedLeverage = parseInt(leverage);
    if (requestedLeverage > maxLev) {
      return res.status(403).json({ error: `Your tier allows max ${maxLev}x leverage. Upgrade to access higher leverage.` });
    }

    const currentPrice = await getBinancePrice(asset);
    if (!currentPrice) return res.status(400).json({ error: 'Cannot fetch current price.' });

    const positionValue = parseFloat(size) * currentPrice;
    const margin = positionValue / requestedLeverage;
    const liquidationPrice = calculateLiquidationPrice(direction, currentPrice, requestedLeverage);

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < margin) {
      return res.status(400).json({ error: 'Insufficient balance for margin.' });
    }

    await wallet.lockFunds(margin);

    const position = await FuturesTrade.create({
      userId: req.user._id,
      asset,
      direction,
      entryPrice: currentPrice,
      markPrice: currentPrice,
      liquidationPrice,
      size: parseFloat(size),
      leverage: requestedLeverage,
      margin,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null
    });

    res.status(201).json({ success: true, position });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const closeFuturesPosition = async (req, res) => {
  try {
    const position = await FuturesTrade.findOne({ _id: req.params.id, userId: req.user._id });
    if (!position) return res.status(404).json({ error: 'Position not found.' });
    if (position.status !== 'open') return res.status(400).json({ error: 'Position is not open.' });

    const exitPrice = (await getBinancePrice(position.asset)) || position.entryPrice;
    const priceDiff = exitPrice - position.entryPrice;
    const multiplier = position.direction === 'long' ? 1 : -1;
    const realizedPnl = parseFloat((priceDiff * multiplier * position.size * position.leverage).toFixed(2));

    position.exitPrice = exitPrice;
    position.realizedPnl = realizedPnl;
    position.unrealizedPnl = 0;
    position.status = 'closed';
    position.closedAt = new Date();
    await position.save();

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet) {
      await wallet.unlockFunds(position.margin);
      if (realizedPnl > 0) {
        await wallet.credit(realizedPnl, 'trade_profit', `Futures PnL: ${position.direction} ${position.asset}`);
      } else if (realizedPnl < 0) {
        const loss = Math.min(Math.abs(realizedPnl), position.margin);
        await wallet.debit(loss, 'trade_loss', `Futures loss: ${position.direction} ${position.asset}`);
      }
    }

    res.json({ success: true, position });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFuturesPositions = async (req, res) => {
  try {
    const positions = await FuturesTrade.find({ userId: req.user._id, status: 'open' }).sort({ openedAt: -1 });

    for (const pos of positions) {
      const markPrice = await getBinancePrice(pos.asset);
      if (markPrice) {
        const priceDiff = markPrice - pos.entryPrice;
        const multiplier = pos.direction === 'long' ? 1 : -1;
        pos.markPrice = markPrice;
        pos.unrealizedPnl = parseFloat((priceDiff * multiplier * pos.size * pos.leverage).toFixed(2));
        await pos.save();
      }
    }

    res.json({ success: true, positions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFuturesHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const [positions, total] = await Promise.all([
      FuturesTrade.find({ userId: req.user._id }).sort({ openedAt: -1 }).skip(skip).limit(lim),
      FuturesTrade.countDocuments({ userId: req.user._id })
    ]);
    res.json({ success: true, positions, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateStopLoss = async (req, res) => {
  try {
    const position = await FuturesTrade.findOne({ _id: req.params.id, userId: req.user._id });
    if (!position) return res.status(404).json({ error: 'Position not found.' });
    if (position.status !== 'open') return res.status(400).json({ error: 'Position is not open.' });
    position.stopLoss = parseFloat(req.body.stopLoss);
    await position.save();
    res.json({ success: true, position });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTakeProfit = async (req, res) => {
  try {
    const position = await FuturesTrade.findOne({ _id: req.params.id, userId: req.user._id });
    if (!position) return res.status(404).json({ error: 'Position not found.' });
    if (position.status !== 'open') return res.status(400).json({ error: 'Position is not open.' });
    position.takeProfit = parseFloat(req.body.takeProfit);
    await position.save();
    res.json({ success: true, position });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFuturesStats = async (req, res) => {
  try {
    const positions = await FuturesTrade.find({ userId: req.user._id });
    const closed = positions.filter((p) => p.status === 'closed');
    const wins = closed.filter((p) => p.realizedPnl > 0);
    const totalPnl = closed.reduce((acc, p) => acc + (p.realizedPnl || 0), 0);

    res.json({
      success: true,
      stats: {
        total: positions.length,
        open: positions.filter((p) => p.status === 'open').length,
        closed: closed.length,
        wins: wins.length,
        winRate: closed.length > 0 ? ((wins.length / closed.length) * 100).toFixed(2) : 0,
        totalPnl: parseFloat(totalPnl.toFixed(2))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  openFuturesPosition, closeFuturesPosition, getFuturesPositions, getFuturesHistory,
  updateStopLoss, updateTakeProfit, getFuturesStats, calculateLiquidationPrice
};
