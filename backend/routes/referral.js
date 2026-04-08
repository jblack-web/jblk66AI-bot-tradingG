const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getReferrals, getReferralStats, generateReferralLink } = require('../controllers/referralController');

router.use(protect);

router.get('/', getReferrals);
router.get('/stats', getReferralStats);
router.get('/link', generateReferralLink);

module.exports = router;
