const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct, getFeaturedProducts, getCategories,
} = require('../controllers/marketplaceController');
const {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon,
} = require('../controllers/cartController');
const {
  createOrder, getOrders, getOrder, cancelOrder, trackOrder,
} = require('../controllers/orderController');

// Public
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.get('/categories', getCategories);
router.get('/featured', getFeaturedProducts);

// Seller
router.post('/products', protect, requireRole('seller', 'admin'), createProduct);
router.put('/products/:id', protect, requireRole('seller', 'admin'), updateProduct);
router.delete('/products/:id', protect, requireRole('seller', 'admin'), deleteProduct);

// Cart (auth required)
router.get('/cart', protect, getCart);
router.post('/cart/add', protect, addToCart);
router.put('/cart/items/:itemId', protect, updateCartItem);
router.delete('/cart/items/:itemId', protect, removeFromCart);
router.delete('/cart', protect, clearCart);
router.post('/cart/coupon', protect, applyCoupon);

// Orders
router.post('/orders', protect, createOrder);
router.get('/orders', protect, getOrders);
router.get('/orders/:id', protect, getOrder);
router.post('/orders/:id/cancel', protect, cancelOrder);
router.get('/orders/:id/track', protect, trackOrder);

module.exports = router;
