'use strict';

const Trade = require('../models/Trade');
const Wallet = require('../models/Wallet');
const AutomatedTradeSchedule = require('../models/AutomatedTradeSchedule');
const User = require('../models/User');
const { getBinancePrice, calculateTechnicalIndicators } = require('./marketDataService');
const { sendNotification } = require('./notificationService');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const PRICE_HISTORY_CACHE = new Map();

const getPriceHistory = async (symbol, points = 50) => {
  try {
    const { data } = await require('axios').get(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=${points}`,
      { timeout: 5000 }
    );
    return data.map((k) => parseFloat(k[4]));
  } catch {
    // Return null if price history cannot be fetched - do not use synthetic data
    // The caller must handle null and skip trading for this asset
    return null;
  }
};

const runMomentumStrategy = async (asset, prices) => {
  const indicators = calculateTechnicalIndicators(prices);
  const rsi = indicators.rsi || 50;
  const macd = indicators.macd || 0;

  // Deterministic confidence based on RSI distance from extremes
  if (rsi < 35 && macd > 0) {
    const confidence = Math.min(90, 55 + (35 - rsi) * 2);
    return { signal: 'buy', confidence };
  }
  if (rsi > 65 && macd < 0) {
    const confidence = Math.min(90, 55 + (rsi - 65) * 2);
    return { signal: 'sell', confidence };
  }
  return { signal: 'hold', confidence: 0 };
};

const runMeanReversionStrategy = async (asset, prices) => {
  const indicators = calculateTechnicalIndicators(prices);
  const current = indicators.currentPrice;
  const sma20 = indicators.sma20;
  if (!sma20) return { signal: 'hold', confidence: 0 };

  const deviation = ((current - sma20) / sma20) * 100;

  if (deviation < -3) {
    const confidence = Math.min(90, 55 + Math.abs(deviation) * 3);
    return { signal: 'buy', confidence };
  }
  if (deviation > 3) {
    const confidence = Math.min(90, 55 + deviation * 3);
    return { signal: 'sell', confidence };
  }
  return { signal: 'hold', confidence: 0 };
};

const runTrendFollowingStrategy = async (asset, prices) => {
  const indicators = calculateTechnicalIndicators(prices);
  const rsi = indicators.rsi || 50;
  if (indicators.trend === 'bullish' && rsi < 70) {
    const confidence = Math.min(90, 55 + (70 - rsi) * 0.5);
    return { signal: 'buy', confidence };
  }
  if (indicators.trend === 'bearish' && rsi > 30) {
    const confidence = Math.min(90, 55 + (rsi - 30) * 0.5);
    return { signal: 'sell', confidence };
  }
  return { signal: 'hold', confidence: 0 };
};

const runAISignalStrategy = async (asset, prices) => {
  const indicators = calculateTechnicalIndicators(prices);
  const score =
    (indicators.rsi < 40 ? 30 : indicators.rsi > 60 ? -30 : 0) +
    (indicators.trend === 'bullish' ? 20 : -20) +
    (indicators.macd > 0 ? 15 : -15);

  if (score > 30) return { signal: 'buy', confidence: Math.min(90, 60 + score * 0.5) };
  if (score < -30) return { signal: 'sell', confidence: Math.min(90, 60 + Math.abs(score) * 0.5) };
  return { signal: 'hold', confidence: 0 };
};

const calculateRisk = (strategy, data) => {
  const riskMap = { momentum: 0.6, meanReversion: 0.5, trendFollowing: 0.4, aiSignal: 0.35 };
  return riskMap[strategy] || 0.5;
};

const executeTrade = async (userId, { asset, direction, quantity, entryPrice, strategy, stopLoss, takeProfit }) => {
  try {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) throw new Error('Wallet not found');

    const tradeValue = quantity * entryPrice;
    const riskAmount = tradeValue * 0.02;

    if (wallet.balance < riskAmount) {
      throw new Error('Insufficient balance for trade');
    }

    const trade = await Trade.create({
      userId,
      type: 'spot',
      asset,
      direction,
      entryPrice,
      quantity,
      strategy,
      stopLoss,
      takeProfit,
      status: 'open'
    });

    logger.info(`Trade executed: ${trade._id} for user ${userId}`);
    return trade;
  } catch (err) {
    logger.error(`executeTrade error: ${err.message}`);
    throw err;
  }
};

const executeAutomatedTrades = async () => {
  try {
    const schedules = await AutomatedTradeSchedule.find({ isActive: true });
    logger.info(`Running automated trades for ${schedules.length} users`);

    for (const schedule of schedules) {
      try {
        schedule.resetDailyCounterIfNeeded();

        if (schedule.tradesExecutedToday >= schedule.maxDailyTrades) {
          continue;
        }

        const user = await User.findById(schedule.userId);
        if (!user || !user.isActive) continue;

        const wallet = await Wallet.findOne({ userId: schedule.userId });
        if (!wallet || wallet.balance < 50) continue;

        for (const pair of schedule.tradingPairs.slice(0, 2)) {
          if (schedule.tradesExecutedToday >= schedule.maxDailyTrades) break;

          const prices = await getPriceHistory(pair, 50);
          if (!prices || prices.length < 20) {
            logger.warn(`Insufficient price history for ${pair}, skipping automated trade`);
            continue;
          }
          let signal = { signal: 'hold', confidence: 0 };

          switch (schedule.strategy) {
            case 'momentum':
              signal = await runMomentumStrategy(pair, prices);
              break;
            case 'meanReversion':
              signal = await runMeanReversionStrategy(pair, prices);
              break;
            case 'trendFollowing':
              signal = await runTrendFollowingStrategy(pair, prices);
              break;
            case 'aiSignal':
              signal = await runAISignalStrategy(pair, prices);
              break;
          }

          if (signal.signal === 'hold' || signal.confidence < 65) continue;

          const currentPrice = await getBinancePrice(pair);
          if (!currentPrice) continue;

          const riskAmount = wallet.balance * (schedule.riskPercentage / 100);
          const quantity = parseFloat((riskAmount / currentPrice).toFixed(6));
          const stopLoss =
            signal.signal === 'buy'
              ? currentPrice * (1 - schedule.stopLossPercentage / 100)
              : currentPrice * (1 + schedule.stopLossPercentage / 100);
          const takeProfit =
            signal.signal === 'buy'
              ? currentPrice * (1 + schedule.takeProfitPercentage / 100)
              : currentPrice * (1 - schedule.takeProfitPercentage / 100);

          await executeTrade(schedule.userId, {
            asset: pair,
            direction: signal.signal,
            quantity,
            entryPrice: currentPrice,
            strategy: schedule.strategy,
            stopLoss,
            takeProfit
          });

          schedule.tradesExecutedToday += 1;
          schedule.totalTrades += 1;
          schedule.lastTradeAt = new Date();

          await sendNotification({
            user,
            type: 'trade',
            title: 'Automated Trade Executed',
            message: `${signal.signal.toUpperCase()} ${quantity} ${pair} @ $${currentPrice} (${schedule.strategy} strategy)`
          });
        }

        await schedule.save();
      } catch (userErr) {
        logger.error(`Automated trade error for user ${schedule.userId}: ${userErr.message}`);
      }
    }
  } catch (err) {
    logger.error(`executeAutomatedTrades error: ${err.message}`);
  }
};

module.exports = {
  executeTrade,
  runMomentumStrategy,
  runMeanReversionStrategy,
  runTrendFollowingStrategy,
  runAISignalStrategy,
  calculateRisk,
  executeAutomatedTrades
};
