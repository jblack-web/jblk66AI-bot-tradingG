const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  getDashboard, getUsers, updateUser, creditUser,
  createPromoCode, getPromoCodes, updatePromoCode, deletePromoCode,
  createCategory, updateCategory,
  getTierPackages, createTierPackage, updateTierPackage,
} = require('../controllers/adminController');

// Dashboard
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboard);

// Users
router.get('/users', authMiddleware, adminMiddleware, getUsers);
router.put('/users/:id', authMiddleware, adminMiddleware, updateUser);
router.post('/users/:id/credit', authMiddleware, adminMiddleware, creditUser);

// Promo Codes
router.get('/promo-codes', authMiddleware, adminMiddleware, getPromoCodes);
router.post('/promo-codes', authMiddleware, adminMiddleware, createPromoCode);
router.put('/promo-codes/:id', authMiddleware, adminMiddleware, updatePromoCode);
router.delete('/promo-codes/:id', authMiddleware, adminMiddleware, deletePromoCode);

// Template categories
router.post('/template-categories', authMiddleware, adminMiddleware, createCategory);
router.put('/template-categories/:id', authMiddleware, adminMiddleware, updateCategory);

// Tier packages
router.get('/tiers', authMiddleware, adminMiddleware, getTierPackages);
router.post('/tiers', authMiddleware, adminMiddleware, createTierPackage);
router.put('/tiers/:id', authMiddleware, adminMiddleware, updateTierPackage);

module.exports = router;
