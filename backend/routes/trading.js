const express = require('express');
const router = express.Router();
const {
  getMarketData,
  openTrade,
  closeTrade,
  getOpenTrades,
  getTradeHistory,
  getOptionsChain,
  getFuturesInfo,
} = require('../controllers/tradingController');
const { authenticateToken } = require('../middleware/auth');

router.get('/market-data', getMarketData);
router.post('/trade/open', authenticateToken, openTrade);
router.post('/trade/:id/close', authenticateToken, closeTrade);
router.get('/trades/open', authenticateToken, getOpenTrades);
router.get('/trades/history', authenticateToken, getTradeHistory);
router.get('/options-chain/:asset', getOptionsChain);
router.get('/futures-info/:asset', getFuturesInfo);

module.exports = router;
