'use strict';

const GoldTrade = require('../models/GoldTrade');
const Wallet = require('../models/Wallet');
const { paginate } = require('../utils/helpers');
const { getGoldPrice } = require('../services/marketDataService');

const buyGold = async (req, res) => {
  try {
    const { quantity, stopLoss, takeProfit } = req.body;
    const currentPrice = await getGoldPrice();
    if (!currentPrice) return res.status(400).json({ error: 'Cannot fetch gold price.' });

    const qty = parseFloat(quantity);
    const totalCost = qty * currentPrice;

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < totalCost) {
      return res.status(400).json({ error: 'Insufficient balance.' });
    }

    await wallet.debit(totalCost, 'trade_loss', `Gold buy: ${qty} oz @ $${currentPrice}`);

    const trade = await GoldTrade.create({
      userId: req.user._id,
      tradeType: 'spot',
      direction: 'buy',
      entryPrice: currentPrice,
      quantity: qty,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null
    });

    res.status(201).json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const sellGold = async (req, res) => {
  try {
    const { tradeId } = req.body;
    const trade = await GoldTrade.findOne({ _id: tradeId, userId: req.user._id, status: 'open', direction: 'buy' });
    if (!trade) return res.status(404).json({ error: 'Open gold position not found.' });

    const exitPrice = await getGoldPrice();
    if (!exitPrice) return res.status(400).json({ error: 'Cannot fetch gold price.' });

    const pnl = (exitPrice - trade.entryPrice) * trade.quantity;
    trade.exitPrice = exitPrice;
    trade.pnl = parseFloat(pnl.toFixed(2));
    trade.pnlPercentage = parseFloat(((exitPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2));
    trade.status = 'closed';
    trade.closedAt = new Date();
    await trade.save();

    const proceeds = trade.quantity * exitPrice;
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet) {
      await wallet.credit(proceeds, 'trade_profit', `Gold sell: ${trade.quantity} oz @ $${exitPrice}`);
    }

    res.json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGoldPositions = async (req, res) => {
  try {
    const positions = await GoldTrade.find({ userId: req.user._id, status: 'open' }).sort({ openedAt: -1 });
    const currentPrice = await getGoldPrice();
    const positionsWithPnl = positions.map((p) => {
      const obj = p.toObject();
      if (currentPrice) {
        obj.currentPrice = currentPrice;
        obj.unrealizedPnl = parseFloat(((currentPrice - p.entryPrice) * p.quantity * (p.direction === 'buy' ? 1 : -1)).toFixed(2));
      }
      return obj;
    });
    res.json({ success: true, positions: positionsWithPnl, currentPrice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGoldHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const [trades, total] = await Promise.all([
      GoldTrade.find({ userId: req.user._id }).sort({ openedAt: -1 }).skip(skip).limit(lim),
      GoldTrade.countDocuments({ userId: req.user._id })
    ]);
    res.json({ success: true, trades, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGoldPrice_ = async (req, res) => {
  try {
    const price = await getGoldPrice();
    res.json({ success: true, price, symbol: 'XAUUSD', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGoldStats = async (req, res) => {
  try {
    const trades = await GoldTrade.find({ userId: req.user._id });
    const closed = trades.filter((t) => t.status === 'closed');
    const wins = closed.filter((t) => t.pnl > 0);
    const totalPnl = closed.reduce((acc, t) => acc + (t.pnl || 0), 0);
    res.json({
      success: true,
      stats: {
        total: trades.length,
        open: trades.filter((t) => t.status === 'open').length,
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

const openGoldFutures = async (req, res) => {
  try {
    const { direction, quantity, leverage, stopLoss, takeProfit } = req.body;
    const currentPrice = await getGoldPrice();
    if (!currentPrice) return res.status(400).json({ error: 'Cannot fetch gold price.' });

    const qty = parseFloat(quantity);
    const lev = parseInt(leverage) || 1;
    const margin = (qty * currentPrice) / lev;

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < margin) return res.status(400).json({ error: 'Insufficient balance for margin.' });

    await wallet.lockFunds(margin);

    const trade = await GoldTrade.create({
      userId: req.user._id,
      tradeType: 'futures',
      direction,
      entryPrice: currentPrice,
      quantity: qty,
      leverage: lev,
      margin,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null
    });

    res.status(201).json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const openGoldOptions = async (req, res) => {
  try {
    const { optionType, strikePrice, expiryDate, quantity } = req.body;
    const currentPrice = await getGoldPrice();
    if (!currentPrice) return res.status(400).json({ error: 'Cannot fetch gold price.' });

    const premium = Math.abs(currentPrice - parseFloat(strikePrice)) * 0.02 + 10;
    const totalCost = premium * parseInt(quantity);

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < totalCost) return res.status(400).json({ error: 'Insufficient balance.' });

    await wallet.debit(totalCost, 'trade_loss', `Gold options premium: ${optionType} @ $${strikePrice}`);

    const trade = await GoldTrade.create({
      userId: req.user._id,
      tradeType: 'options',
      direction: optionType === 'call' ? 'buy' : 'sell',
      entryPrice: currentPrice,
      quantity: parseInt(quantity),
      optionDetails: {
        optionType,
        strikePrice: parseFloat(strikePrice),
        expiryDate: new Date(expiryDate),
        premium
      }
    });

    res.status(201).json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { buyGold, sellGold, getGoldPositions, getGoldHistory, getGoldPrice: getGoldPrice_, getGoldStats, openGoldFutures, openGoldOptions };
