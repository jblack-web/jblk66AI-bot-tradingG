const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const stakingController = require('../controllers/stakingController');

// All staking routes require authentication
router.use(authMiddleware);

// Pool information
router.get('/pools', stakingController.getPools);
router.get('/pools/:id', stakingController.getPool);

// User stakes
router.get('/stakes', stakingController.getUserStakes);
router.get('/stakes/:id', stakingController.getStake);

// Earnings
router.get('/earnings', stakingController.getEarnings);

// Stake operations
router.post('/create', stakingController.createStake);
router.post('/claim', stakingController.claimRewards);
router.post('/compound', stakingController.compoundRewards);
router.post('/withdraw', stakingController.withdrawStake);
router.post('/extend', stakingController.extendLockPeriod);

// History & tools
router.get('/history', stakingController.getHistory);
router.get('/calculator', stakingController.calculateReturns);
router.get('/recommendations', stakingController.getRecommendations);
router.post('/automation', stakingController.setAutomation);

module.exports = router;
