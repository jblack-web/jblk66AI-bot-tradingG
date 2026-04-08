'use strict';

const OptionsTrade = require('../models/OptionsTrade');
const Wallet = require('../models/Wallet');
const { paginate } = require('../utils/helpers');
const { getBinancePrice } = require('../services/marketDataService');

// Simplified Black-Scholes option premium calculation
const blackScholesPremium = (S, K, T, r, sigma, optionType) => {
  if (T <= 0) return Math.max(optionType === 'call' ? S - K : K - S, 0);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const N = (x) => (1 + erf(x / Math.sqrt(2))) / 2;
  const erf = (x) => {
    const a = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1 / (1 + p * x);
    const y = 1 - ((((a[4] * t + a[3]) * t + a[2]) * t + a[1]) * t + a[0]) * t * Math.exp(-x * x);
    return sign * y;
  };
  if (optionType === 'call') {
    return S * N(d1) - K * Math.exp(-r * T) * N(d2);
  }
  return K * Math.exp(-r * T) * N(-d2) - S * N(-d1);
};

const calculateGreeks = (S, K, T, r, sigma, optionType) => {
  if (T <= 0) return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const normPdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  const normCdf = (x) => (1 + Math.tanh(x * 0.7071067811865476) * 0.9999999999999998) / 2;
  const delta = optionType === 'call' ? normCdf(d1) : normCdf(d1) - 1;
  const gamma = normPdf(d1) / (S * sigma * Math.sqrt(T));
  const theta = (optionType === 'call'
    ? ((-S * normPdf(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normCdf(d2))
    : ((-S * normPdf(d1) * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normCdf(-d2))) / 365;
  const vega = S * normPdf(d1) * Math.sqrt(T) / 100;
  const rho = optionType === 'call'
    ? K * T * Math.exp(-r * T) * normCdf(d2) / 100
    : -K * T * Math.exp(-r * T) * normCdf(-d2) / 100;

  return {
    delta: parseFloat(delta.toFixed(4)),
    gamma: parseFloat(gamma.toFixed(6)),
    theta: parseFloat(theta.toFixed(4)),
    vega: parseFloat(vega.toFixed(4)),
    rho: parseFloat(rho.toFixed(4))
  };
};

const calculateOptionPremium = async (req, res) => {
  try {
    const { asset, optionType, strikePrice, expiryDate, impliedVolatility } = req.query;
    const currentPrice = await getBinancePrice(`${asset}USDT`) || parseFloat(req.query.currentPrice);
    if (!currentPrice) return res.status(400).json({ error: 'Cannot fetch current price.' });

    const T = (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24 * 365);
    if (T <= 0) return res.status(400).json({ error: 'Expiry date must be in the future.' });

    const sigma = parseFloat(impliedVolatility) / 100 || 0.5;
    const r = 0.05;
    const S = currentPrice;
    const K = parseFloat(strikePrice);

    const premium = blackScholesPremium(S, K, T, r, sigma, optionType);
    const greeks = calculateGreeks(S, K, T, r, sigma, optionType);

    res.json({
      success: true,
      premium: parseFloat(premium.toFixed(4)),
      greeks,
      inputs: { currentPrice: S, strikePrice: K, timeToExpiry: parseFloat(T.toFixed(4)), riskFreeRate: r, impliedVolatility: sigma }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const placeOptionOrder = async (req, res) => {
  try {
    const { asset, optionType, strikePrice, expiryDate, quantity, impliedVolatility } = req.body;

    const currentPrice = await getBinancePrice(`${asset}USDT`);
    if (!currentPrice) return res.status(400).json({ error: 'Cannot fetch current price.' });

    const T = (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24 * 365);
    if (T <= 0) return res.status(400).json({ error: 'Expiry date must be in the future.' });

    const sigma = parseFloat(impliedVolatility) / 100 || 0.5;
    const premium = blackScholesPremium(currentPrice, parseFloat(strikePrice), T, 0.05, sigma, optionType);
    const greeks = calculateGreeks(currentPrice, parseFloat(strikePrice), T, 0.05, sigma, optionType);
    const totalCost = premium * quantity;

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < totalCost) {
      return res.status(400).json({ error: 'Insufficient balance.' });
    }

    await wallet.debit(totalCost, 'trade_loss', `Options premium: ${optionType} ${asset} @ $${strikePrice}`);

    const option = await OptionsTrade.create({
      userId: req.user._id,
      asset,
      optionType,
      strikePrice: parseFloat(strikePrice),
      currentPrice,
      expiryDate: new Date(expiryDate),
      premium,
      quantity: parseInt(quantity),
      totalCost,
      greeks,
      impliedVolatility: sigma * 100
    });

    res.status(201).json({ success: true, option });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getActiveOptions = async (req, res) => {
  try {
    const options = await OptionsTrade.find({ userId: req.user._id, status: 'active' }).sort({ openedAt: -1 });
    res.json({ success: true, options });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const closeOption = async (req, res) => {
  try {
    const option = await OptionsTrade.findOne({ _id: req.params.id, userId: req.user._id });
    if (!option) return res.status(404).json({ error: 'Option not found.' });
    if (option.status !== 'active') return res.status(400).json({ error: 'Option is not active.' });

    const currentPrice = await getBinancePrice(`${option.asset}USDT`) || option.currentPrice;
    const T = (new Date(option.expiryDate) - new Date()) / (1000 * 60 * 60 * 24 * 365);
    const sigma = option.impliedVolatility / 100 || 0.5;
    const exitPremium = T > 0 ? blackScholesPremium(currentPrice, option.strikePrice, Math.max(T, 0), 0.05, sigma, option.optionType) : Math.max(option.optionType === 'call' ? currentPrice - option.strikePrice : option.strikePrice - currentPrice, 0);
    const proceeds = exitPremium * option.quantity;
    const pnl = proceeds - option.totalCost;

    option.exitPrice = currentPrice;
    option.exitPremium = exitPremium;
    option.pnl = parseFloat(pnl.toFixed(2));
    option.pnlPercentage = parseFloat(((pnl / option.totalCost) * 100).toFixed(2));
    option.status = 'closed';
    option.closedAt = new Date();
    await option.save();

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet && proceeds > 0) {
      await wallet.credit(proceeds, 'trade_profit', `Options close: ${option.optionType} ${option.asset}`);
    }

    res.json({ success: true, option });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOptionsHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const [options, total] = await Promise.all([
      OptionsTrade.find({ userId: req.user._id }).sort({ openedAt: -1 }).skip(skip).limit(lim),
      OptionsTrade.countDocuments({ userId: req.user._id })
    ]);
    res.json({ success: true, options, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOptionsStats = async (req, res) => {
  try {
    const options = await OptionsTrade.find({ userId: req.user._id });
    const closed = options.filter((o) => ['closed', 'expired', 'exercised'].includes(o.status));
    const wins = closed.filter((o) => o.pnl > 0);
    const totalPnl = closed.reduce((acc, o) => acc + (o.pnl || 0), 0);

    res.json({
      success: true,
      stats: {
        total: options.length,
        active: options.filter((o) => o.status === 'active').length,
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

module.exports = { placeOptionOrder, getActiveOptions, closeOption, getOptionsHistory, getOptionsStats, calculateOptionPremium };
