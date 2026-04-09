/**
 * BTC/USD price configuration.
 * In production, replace this with a live price feed integration
 * (e.g., CoinGecko, Binance, or CoinMarketCap API).
 */
const BTC_USD_PRICE = parseFloat(process.env.BTC_USD_PRICE) || 50000;

module.exports = { BTC_USD_PRICE };
