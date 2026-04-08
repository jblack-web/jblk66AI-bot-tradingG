const Seller = require('../models/Seller');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

exports.register = async (req, res) => {
  try {
    const { storeName, storeDescription, logo } = req.body;
    if (!storeName) return res.status(400).json({ success: false, message: 'Store name required' });

    const existing = await Seller.findOne({ userId: req.user._id });
    if (existing) return res.status(409).json({ success: false, message: 'Already registered as seller' });

    const seller = await Seller.create({ userId: req.user._id, storeName, storeDescription, logo });
    await User.findByIdAndUpdate(req.user._id, { role: 'seller' });

    res.status(201).json({ success: true, seller });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id }).populate('userId', 'name email');
    if (!seller) return res.status(404).json({ success: false, message: 'Seller profile not found' });
    res.json({ success: true, seller });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['storeName', 'storeDescription', 'logo', 'bankAccount'];
    const update = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    const seller = await Seller.findOneAndUpdate({ userId: req.user._id }, update, { new: true, runValidators: true });
    if (!seller) return res.status(404).json({ success: false, message: 'Seller profile not found' });
    res.json({ success: true, seller });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) return res.status(404).json({ success: false, message: 'Seller profile not found' });

    const products = await Product.countDocuments({ seller: req.user._id, isActive: true });
    const orderItems = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $match: { 'product.seller': req.user._id } },
      { $group: { _id: null, totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, totalOrders: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      dashboard: {
        totalProducts: products,
        totalSales: orderItems[0]?.totalSales || 0,
        totalOrders: orderItems[0]?.totalOrders || 0,
        totalRevenue: seller.totalRevenue,
        pendingPayout: seller.pendingPayout,
        badge: seller.badge,
        rating: seller.rating,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const myProductIds = await Product.find({ seller: req.user._id }).distinct('_id');

    const pipeline = [
      { $unwind: '$items' },
      { $match: { 'items.productId': { $in: myProductIds } } },
      { $group: { _id: '$_id', order: { $first: '$$ROOT' }, items: { $push: '$items' } } },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$order', { items: '$items' }] } } },
      { $sort: { createdAt: -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
    ];

    const orders = await Order.aggregate(pipeline);
    res.json({ success: true, orders, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Product.countDocuments({ seller: req.user._id });
    const products = await Product.find({ seller: req.user._id })
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
