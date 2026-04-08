const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getWallet, getBalance, deposit, withdraw, sendPayment, receivePayment, getTransactions,
} = require('../controllers/walletController');

router.use(protect);

router.get('/', getWallet);
router.get('/balance', getBalance);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.post('/send', sendPayment);
router.get('/receive', receivePayment);
router.get('/transactions', getTransactions);

module.exports = router;
