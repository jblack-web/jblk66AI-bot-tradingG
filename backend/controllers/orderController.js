const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Wallet = require('../models/Wallet');
const Product = require('../models/Product');

exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = 'wallet' } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = +(subtotal * 0.08).toFixed(2);
    const shippingCost = subtotal > 100 ? 0 : 9.99;
    const total = +(subtotal + tax + shippingCost - (cart.discount || 0)).toFixed(2);

    if (paymentMethod === 'wallet') {
      const wallet = await Wallet.findOne({ userId: req.user._id });
      if (!wallet || (wallet.balances.USD || 0) < total) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }
      wallet.balances.USD -= total;
      wallet.transactions.push({
        type: 'purchase',
        amount: total,
        currency: 'USD',
        status: 'completed',
        note: 'Marketplace order payment',
      });
      await wallet.save();
    }

    const orderItems = cart.items.map((i) => ({
      productId: i.productId._id,
      name: i.productId.name,
      price: i.price,
      quantity: i.quantity,
      image: (i.productId.images || [])[0] || '',
    }));

    // Deduct inventory
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.productId._id, { $inc: { inventory: -item.quantity } });
    }

    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      subtotal,
      tax,
      shippingCost,
      total,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending',
      status: paymentMethod === 'wallet' ? 'paid' : 'pending',
    });

    // Clear cart
    cart.items = [];
    cart.coupon = '';
    cart.discount = 0;
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['pending', 'paid'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel order at this stage' });
    }

    order.status = 'cancelled';

    // Refund if paid via wallet
    if (order.paymentStatus === 'paid' && order.paymentMethod === 'wallet') {
      const wallet = await Wallet.findOne({ userId: req.user._id });
      if (wallet) {
        wallet.balances.USD = (wallet.balances.USD || 0) + order.total;
        wallet.transactions.push({
          type: 'refund',
          amount: order.total,
          currency: 'USD',
          status: 'completed',
          note: `Refund for cancelled order ${order.orderNumber}`,
        });
        await wallet.save();
      }
      order.paymentStatus = 'refunded';
    }

    await order.save();
    res.json({ success: true, message: 'Order cancelled', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id }).select(
      'orderNumber status trackingNumber shippingAddress updatedAt'
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, tracking: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAdminOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
