const Cart = require('../models/Cart');
const Product = require('../models/Product');

const COUPON_CODES = { WELCOME10: 10, SAVE20: 20, MINING15: 15 };

const recalcCart = (cart) => {
  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  cart.totalPrice = Math.max(0, subtotal - (cart.discount || 0));
  return cart;
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name images stockLevel');
    if (!cart) return res.json({ success: true, cart: { items: [], totalPrice: 0 } });
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stockLevel === 'out_of_stock') {
      return res.status(400).json({ success: false, message: 'Product out of stock' });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) cart = new Cart({ userId: req.user._id, items: [] });

    const price = product.salePrice || product.price;
    const existing = cart.items.find((i) => i.productId.toString() === productId && i.variant === (variant || ''));
    if (existing) {
      existing.quantity += Number(quantity);
      existing.price = price;
    } else {
      cart.items.push({ productId, quantity: Number(quantity), price, variant: variant || '' });
    }

    recalcCart(cart);
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (Number(quantity) <= 0) {
      cart.items.pull(req.params.itemId);
    } else {
      item.quantity = Number(quantity);
    }

    recalcCart(cart);
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    cart.items.pull(req.params.itemId);
    recalcCart(cart);
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.json({ success: true, message: 'Cart already empty' });
    cart.items = [];
    cart.coupon = '';
    cart.discount = 0;
    cart.totalPrice = 0;
    await cart.save();
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.applyCoupon = async (req, res) => {
  try {
    const { coupon } = req.body;
    const discount = COUPON_CODES[coupon ? coupon.toUpperCase() : ''];
    if (!discount) return res.status(400).json({ success: false, message: 'Invalid coupon code' });

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    cart.coupon = coupon.toUpperCase();
    cart.discount = (subtotal * discount) / 100;
    cart.totalPrice = Math.max(0, subtotal - cart.discount);
    await cart.save();

    res.json({ success: true, message: `Coupon applied: ${discount}% off`, discount: cart.discount, totalPrice: cart.totalPrice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
