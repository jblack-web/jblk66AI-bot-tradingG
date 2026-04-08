const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { register, getProfile, updateProfile, getDashboard, getOrders, getProducts } = require('../controllers/sellerController');

router.use(protect);

router.post('/register', register);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard', getDashboard);
router.get('/orders', getOrders);
router.get('/products', getProducts);

module.exports = router;
