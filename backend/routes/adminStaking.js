const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const adminStakingController = require('../controllers/adminStakingController');

// All admin routes require authentication + admin role
router.use(authMiddleware, adminMiddleware);

// Dashboard overview
router.get('/dashboard', adminStakingController.getDashboard);

// Pool management
router.get('/pools', adminStakingController.getPools);
router.post('/pools', adminStakingController.createPool);
router.put('/pools/:id', adminStakingController.updatePool);

// Staker management
router.get('/stakers', adminStakingController.getStakers);
router.get('/stakers/:id', adminStakingController.getStakerDetails);

// Payouts & bonuses
router.post('/payout', adminStakingController.manualPayout);
router.post('/bonus', adminStakingController.issueBonus);

// Analytics & reports
router.get('/analytics', adminStakingController.getAnalytics);
router.get('/reports', adminStakingController.getReports);

// Campaigns & revenue
router.post('/campaigns', adminStakingController.createCampaign);
router.get('/revenue', adminStakingController.getRevenue);

module.exports = router;
