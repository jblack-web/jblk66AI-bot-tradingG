const Trade = require('../models/Trade');
const User = require('../models/User');
const { sanitizeEnum } = require('../utils/sanitize');

const ALLOWED_TRADE_TYPES = ['options', 'futures', 'spot'];
const ALLOWED_ASSETS = ['BTC', 'ETH', 'GOLD', 'SILVER'];

const BASE_PRICES = {
  BTC: 43250.5,
  ETH: 2280.75,
  GOLD: 2045.3,
  SILVER: 24.85,
};

const FEES = {
  options: 0.005,
  futures: 0.002,
  spot: 0.001,
};

const simulatePrice = (base) => {
  const variance = (Math.random() - 0.5) * 0.02;
  return parseFloat((base * (1 + variance)).toFixed(2));
};

const getMarketData = async (req, res) => {
  try {
    const marketData = Object.entries(BASE_PRICES).map(([asset, basePrice]) => {
      const price = simulatePrice(basePrice);
      const change24h = parseFloat(((Math.random() - 0.5) * 6).toFixed(2));
      const volume = parseFloat((Math.random() * 1e9 + 1e8).toFixed(0));

      return {
        asset,
        price,
        change24h,
        changePercent24h: parseFloat(((change24h / basePrice) * 100).toFixed(2)),
        volume24h: volume,
        high24h: parseFloat((price * 1.015).toFixed(2)),
        low24h: parseFloat((price * 0.985).toFixed(2)),
        timestamp: new Date().toISOString(),
      };
    });

    res.json({ marketData });
  } catch (err) {
    console.error('Get market data error:', err);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
};

const openTrade = async (req, res) => {
  try {
    const {
      type,
      asset,
      direction,
      amount,
      leverage = 1,
      strikePrice,
      expiryDate,
      stopLoss,
      takeProfit,
    } = req.body;

    if (!type || !asset || !direction || !amount) {
      return res.status(400).json({ error: 'type, asset, direction, and amount are required' });
    }

    const validDirections = { options: ['call', 'put'], futures: ['long', 'short'], spot: ['long', 'short'] };
    if (!validDirections[type] || !validDirections[type].includes(direction)) {
      return res.status(400).json({ error: `Invalid direction for ${type} trade` });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const entryPrice = simulatePrice(BASE_PRICES[asset]);
    const fee = parseFloat((amount * FEES[type]).toFixed(2));
    const margin = type === 'futures' ? parseFloat((amount / leverage).toFixed(2)) : amount;
    const contractSize = type === 'futures' ? parseFloat((amount / entryPrice).toFixed(6)) : undefined;
    const totalCost = margin + fee;

    if (user.walletBalance < totalCost) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    user.walletBalance = parseFloat((user.walletBalance - totalCost).toFixed(2));
    await user.save();

    const trade = new Trade({
      user: user._id,
      type,
      asset,
      direction,
      amount,
      leverage,
      strikePrice,
      expiryDate,
      entryPrice,
      fee,
      margin,
      contractSize,
      stopLoss,
      takeProfit,
      status: 'open',
    });

    await trade.save();

    res.status(201).json({
      message: 'Trade opened successfully',
      trade,
      newWalletBalance: user.walletBalance,
    });
  } catch (err) {
    console.error('Open trade error:', err);
    res.status(500).json({ error: 'Failed to open trade' });
  }
};

const closeTrade = async (req, res) => {
  try {
    const { id } = req.params;

    const trade = await Trade.findOne({ _id: id, user: req.user._id, status: 'open' });
    if (!trade) {
      return res.status(404).json({ error: 'Open trade not found' });
    }

    const exitPrice = simulatePrice(BASE_PRICES[trade.asset]);
    let pnl = 0;

    if (trade.type === 'futures' || trade.type === 'spot') {
      const priceDiff = exitPrice - trade.entryPrice;
      const multiplier = trade.direction === 'long' ? 1 : -1;
      pnl = parseFloat((priceDiff * multiplier * (trade.contractSize || 1) * trade.leverage).toFixed(2));
    } else if (trade.type === 'options') {
      const isITM =
        (trade.direction === 'call' && exitPrice > trade.strikePrice) ||
        (trade.direction === 'put' && exitPrice < trade.strikePrice);
      pnl = isITM
        ? parseFloat((Math.abs(exitPrice - trade.strikePrice) * (trade.contractSize || 1)).toFixed(2))
        : -trade.amount;
    }

    pnl = parseFloat((pnl - trade.fee).toFixed(2));

    trade.exitPrice = exitPrice;
    trade.pnl = pnl;
    trade.status = 'closed';
    trade.closedAt = new Date();
    await trade.save();

    const user = await User.findById(req.user._id);
    const returnAmount = trade.margin + pnl;
    user.walletBalance = parseFloat((user.walletBalance + Math.max(0, returnAmount)).toFixed(2));
    if (pnl > 0) {
      user.totalEarnings = parseFloat((user.totalEarnings + pnl).toFixed(2));
    }
    await user.save();

    res.json({
      message: 'Trade closed successfully',
      trade,
      pnl,
      newWalletBalance: user.walletBalance,
    });
  } catch (err) {
    console.error('Close trade error:', err);
    res.status(500).json({ error: 'Failed to close trade' });
  }
};

const getOpenTrades = async (req, res) => {
  try {
    const trades = await Trade.find({ user: req.user._id, status: 'open' }).sort({ createdAt: -1 });

    res.json({ trades });
  } catch (err) {
    console.error('Get open trades error:', err);
    res.status(500).json({ error: 'Failed to fetch open trades' });
  }
};

const getTradeHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id, status: { $in: ['closed', 'expired', 'cancelled'] } };

    const safeType = sanitizeEnum(req.query.type, ALLOWED_TRADE_TYPES);
    const safeAsset = sanitizeEnum(req.query.asset, ALLOWED_ASSETS);
    if (safeType) query.type = safeType;
    if (safeAsset) query.asset = safeAsset;

    const [trades, total] = await Promise.all([
      Trade.find(query).sort({ closedAt: -1 }).skip(skip).limit(limit),
      Trade.countDocuments(query),
    ]);

    res.json({
      trades,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Get trade history error:', err);
    res.status(500).json({ error: 'Failed to fetch trade history' });
  }
};

const getOptionsChain = async (req, res) => {
  try {
    const { asset } = req.params;

    const validAssets = ['BTC', 'GOLD'];
    if (!validAssets.includes(asset)) {
      return res.status(400).json({ error: 'Options chain available for BTC and GOLD only' });
    }

    const currentPrice = simulatePrice(BASE_PRICES[asset]);
    const strikes = [];
    const expiryDates = [7, 14, 30, 60, 90].map((days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    });

    for (let i = -5; i <= 5; i++) {
      const strikeMultiplier = 1 + i * 0.02;
      const strike = parseFloat((currentPrice * strikeMultiplier).toFixed(2));
      const isITM_call = currentPrice > strike;
      const isITM_put = currentPrice < strike;

      strikes.push({
        strike,
        call: {
          bid: parseFloat((Math.max(0, currentPrice - strike) + Math.random() * currentPrice * 0.01).toFixed(2)),
          ask: parseFloat((Math.max(0, currentPrice - strike) + Math.random() * currentPrice * 0.015).toFixed(2)),
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          impliedVolatility: parseFloat((0.3 + Math.random() * 0.4).toFixed(2)),
          delta: parseFloat((isITM_call ? 0.5 + Math.random() * 0.5 : Math.random() * 0.5).toFixed(3)),
          inTheMoney: isITM_call,
        },
        put: {
          bid: parseFloat((Math.max(0, strike - currentPrice) + Math.random() * currentPrice * 0.01).toFixed(2)),
          ask: parseFloat((Math.max(0, strike - currentPrice) + Math.random() * currentPrice * 0.015).toFixed(2)),
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          impliedVolatility: parseFloat((0.3 + Math.random() * 0.4).toFixed(2)),
          delta: parseFloat((isITM_put ? -(0.5 + Math.random() * 0.5) : -(Math.random() * 0.5)).toFixed(3)),
          inTheMoney: isITM_put,
        },
      });
    }

    res.json({
      asset,
      currentPrice,
      expiryDates,
      strikes,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Get options chain error:', err);
    res.status(500).json({ error: 'Failed to fetch options chain' });
  }
};

const getFuturesInfo = async (req, res) => {
  try {
    const { asset } = req.params;

    const validAssets = ['BTC', 'GOLD'];
    if (!validAssets.includes(asset)) {
      return res.status(400).json({ error: 'Futures info available for BTC and GOLD only' });
    }

    const currentPrice = simulatePrice(BASE_PRICES[asset]);
    const fundingRate = parseFloat(((Math.random() - 0.5) * 0.001).toFixed(6));

    const contractMonths = [1, 3, 6, 12].map((months) => {
      const d = new Date();
      d.setMonth(d.getMonth() + months);
      const basisPercent = months * (0.001 + Math.random() * 0.003);
      return {
        expiry: d.toISOString().split('T')[0],
        months,
        price: parseFloat((currentPrice * (1 + basisPercent)).toFixed(2)),
        basis: parseFloat((basisPercent * 100).toFixed(4)),
        volume: Math.floor(Math.random() * 50000 + 10000),
        openInterest: Math.floor(Math.random() * 200000 + 50000),
      };
    });

    res.json({
      asset,
      spotPrice: currentPrice,
      perpetual: {
        price: parseFloat((currentPrice * (1 + fundingRate * 10)).toFixed(2)),
        fundingRate,
        nextFundingTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        maxLeverage: asset === 'BTC' ? 100 : 20,
        maintenanceMarginRate: 0.005,
        initialMarginRate: 0.01,
      },
      contracts: contractMonths,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Get futures info error:', err);
    res.status(500).json({ error: 'Failed to fetch futures info' });
  }
};

module.exports = {
  getMarketData,
  openTrade,
  closeTrade,
  getOpenTrades,
  getTradeHistory,
  getOptionsChain,
  getFuturesInfo,
};
