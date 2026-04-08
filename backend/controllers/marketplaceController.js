const Product = require('../models/Product');

const CATEGORIES = ['mining_equipment', 'hardware', 'educational', 'software', 'merchandise', 'premium_services', 'bundles', 'featured'];

exports.getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, tags, featured, page = 1, limit = 20, sort = 'createdAt' } = req.query;
    const filter = { isActive: true };

    if (category && CATEGORIES.includes(category)) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (tags) filter.tags = { $in: tags.split(',') };
    if (search) filter.$text = { $search: search };

    const sortMap = { createdAt: '-createdAt', price_asc: 'price', price_desc: '-price', rating: '-ratings.average' };
    const sortField = sortMap[sort] || '-createdAt';

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('seller', 'name email')
      .sort(sortField)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const data = { ...req.body, seller: req.user._id };
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const isOwner = product.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    Object.assign(product, req.body);
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const isOwner = product.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    product.isActive = false;
    await product.save();
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('seller', 'name')
      .sort('-createdAt')
      .limit(20);
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const counts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const categories = CATEGORIES.map((c) => ({
      name: c,
      count: (counts.find((x) => x._id === c) || { count: 0 }).count,
    }));
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
