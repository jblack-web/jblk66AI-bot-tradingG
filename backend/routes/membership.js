const express = require('express');
const router = express.Router();
const {
  getTiers,
  getCurrentMembership,
  upgradeMembership,
  extendFreeTrial,
  getMembershipHistory,
} = require('../controllers/membershipController');
const { authenticateToken } = require('../middleware/auth');

router.get('/tiers', getTiers);
router.get('/current', authenticateToken, getCurrentMembership);
router.post('/upgrade', authenticateToken, upgradeMembership);
router.post('/extend-free', authenticateToken, extendFreeTrial);
router.get('/history', authenticateToken, getMembershipHistory);

module.exports = router;
