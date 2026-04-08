const express = require('express');
const router = express.Router();
const { getReferralStats, createReferralLink, getReferralNetwork } = require('../controllers/referralController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/stats', getReferralStats);
router.get('/link', createReferralLink);
router.get('/network', getReferralNetwork);

module.exports = router;
