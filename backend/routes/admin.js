const express = require('express');
const router = express.Router();
const {
  getStats,
  getMembers,
  updateUserMembership,
  getAnalytics,
  managePromotions,
  sendCampaignEmail,
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken, requireAdmin);

router.get('/stats', getStats);
router.get('/members', getMembers);
router.put('/members/:id/membership', updateUserMembership);
router.get('/analytics', getAnalytics);
router.get('/promotions', managePromotions);
router.post('/promotions', managePromotions);
router.put('/promotions/:id', managePromotions);
router.delete('/promotions/:id', managePromotions);
router.post('/email/campaign', sendCampaignEmail);

module.exports = router;
