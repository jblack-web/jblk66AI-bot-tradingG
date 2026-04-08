'use strict';

const axios = require('axios');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const priceCache = new Map();
const CACHE_TTL_MS = 30000;

const getCachedPrice = (key) => {
  const entry = priceCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.price;
  }
  return null;
};

const setCachedPrice = (key, price) => {
  priceCache.set(key, { price, timestamp: Date.now() });
};

const getBinancePrice = async (symbol) => {
  const cacheKey = `binance_${symbol}`;
  const cached = getCachedPrice(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
      { timeout: 5000 }
    );
    const price = parseFloat(data.price);
    setCachedPrice(cacheKey, price);
    return price;
  } catch (err) {
    logger.error(`Binance price error for ${symbol}: ${err.message}`);
    return null;
  }
};

const getCoinGeckoPrice = async (coinId) => {
  const cacheKey = `coingecko_${coinId}`;
  const cached = getCachedPrice(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { timeout: 5000 }
    );
    const price = data[coinId]?.usd;
    if (price) {
      setCachedPrice(cacheKey, price);
      return price;
    }
    return null;
  } catch (err) {
    logger.error(`CoinGecko price error for ${coinId}: ${err.message}`);
    return null;
  }
};

const getAlphaVantagePrice = async (symbol) => {
  const cacheKey = `alphavantage_${symbol}`;
  const cached = getCachedPrice(cacheKey);
  if (cached) return cached;

  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) return null;
    const { data } = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
      { timeout: 5000 }
    );
    const price = parseFloat(data['Global Quote']?.['05. price']);
    if (price) {
      setCachedPrice(cacheKey, price);
      return price;
    }
    return null;
  } catch (err) {
    logger.error(`AlphaVantage price error for ${symbol}: ${err.message}`);
    return null;
  }
};

const getGoldPrice = async () => {
  const cacheKey = 'gold_xauusd';
  const cached = getCachedPrice(cacheKey);
  if (cached) return cached;

  try {
    const binancePrice = await getBinancePrice('XAUUSDT');
    if (binancePrice) return binancePrice;

    const avPrice = await getAlphaVantagePrice('XAUUSD');
    if (avPrice) return avPrice;

    // All external sources failed - return null rather than fabricated data
    logger.warn('All gold price sources unavailable');
    return null;
  } catch (err) {
    logger.error(`Gold price error: ${err.message}`);
    return null;
  }
};

const getNewsData = async (query) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) return [];
    const { data } = await axios.get(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`,
      { timeout: 5000 }
    );
    return data.articles || [];
  } catch (err) {
    logger.error(`News fetch error: ${err.message}`);
    return [];
  }
};

const calculateTechnicalIndicators = (prices) => {
  if (!prices || prices.length < 2) return {};

  const sma = (arr, period) => {
    if (arr.length < period) return null;
    const slice = arr.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  };

  const ema = (arr, period) => {
    if (arr.length < period) return null;
    const k = 2 / (period + 1);
    let emaVal = arr.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < arr.length; i++) {
      emaVal = arr[i] * k + emaVal * (1 - k);
    }
    return emaVal;
  };

  const rsi = (arr, period = 14) => {
    if (arr.length < period + 1) return null;
    let gains = 0;
    let losses = 0;
    for (let i = arr.length - period; i < arr.length; i++) {
      const diff = arr[i] - arr[i - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  };

  const currentPrice = prices[prices.length - 1];
  const sma20 = sma(prices, 20);
  const sma50 = sma(prices, 50);
  const ema12 = ema(prices, 12);
  const ema26 = ema(prices, 26);
  const rsiValue = rsi(prices, 14);
  const macd = ema12 && ema26 ? ema12 - ema26 : null;

  return {
    currentPrice,
    sma20,
    sma50,
    ema12,
    ema26,
    rsi: rsiValue ? parseFloat(rsiValue.toFixed(2)) : null,
    macd: macd ? parseFloat(macd.toFixed(4)) : null,
    trend: sma20 && sma50 ? (sma20 > sma50 ? 'bullish' : 'bearish') : 'neutral'
  };
};

const generateMarketSummary = async (assets = ['BTCUSDT', 'ETHUSDT']) => {
  const summary = {};
  for (const asset of assets) {
    try {
      const price = await getBinancePrice(asset);
      summary[asset] = {
        price,
        lastUpdated: new Date().toISOString()
      };
    } catch {
      summary[asset] = { price: null, error: 'Unavailable' };
    }
  }
  return summary;
};

module.exports = {
  getBinancePrice,
  getCoinGeckoPrice,
  getAlphaVantagePrice,
  getGoldPrice,
  getNewsData,
  calculateTechnicalIndicators,
  generateMarketSummary
};
