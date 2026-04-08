const Template = require('../models/Template');
const TemplateCategory = require('../models/TemplateCategory');
const TemplateReview = require('../models/TemplateReview');

// GET /api/templates
exports.getTemplates = async (req, res) => {
  try {
    const {
      page = 1, limit = 24, search, category, framework, uiLibrary,
      designStyle, colorScheme, responsive, isFree, isFeatured, isTrending,
      sort = 'createdAt', order = 'desc', minRating,
    } = req.query;

    const filter = { isPublished: true };

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) filter.categoryName = { $regex: category, $options: 'i' };
    if (framework) filter.framework = framework;
    if (uiLibrary) filter.uiLibrary = uiLibrary;
    if (designStyle) filter.designStyle = designStyle;
    if (colorScheme) filter.colorScheme = colorScheme;
    if (responsive !== undefined) filter.responsive = responsive === 'true';
    if (isFree !== undefined) filter.isFree = isFree === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (isTrending !== undefined) filter.isTrending = isTrending === 'true';
    if (minRating) filter.averageRating = { $gte: +minRating };

    const sortField = {};
    sortField[sort] = order === 'asc' ? 1 : -1;

    const templates = await Template.find(filter)
      .sort(sortField)
      .skip((page - 1) * limit)
      .limit(+limit)
      .populate('category', 'name slug');

    const total = await Template.countDocuments(filter);

    res.json({
      success: true,
      templates,
      total,
      page: +page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/templates/:id
exports.getTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('author', 'username');

    if (!template || !template.isPublished) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    // Increment view count
    await Template.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    const reviews = await TemplateReview.find({ template: req.params.id })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, template, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/templates/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await TemplateCategory.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/templates/:id/download
exports.downloadTemplate = async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1, usageCount: 1 } },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    res.json({
      success: true,
      message: 'Download started.',
      downloadUrl: template.demoUrl,
      sourceCode: template.sourceCode,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/templates/:id/review
exports.addReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const existing = await TemplateReview.findOne({ template: req.params.id, user: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this template.' });
    }

    const review = await TemplateReview.create({
      template: req.params.id,
      user: req.user._id,
      rating,
      title,
      comment,
    });

    // Update template average rating
    const stats = await TemplateReview.aggregate([
      { $match: { template: review.template } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await Template.findByIdAndUpdate(req.params.id, {
        averageRating: +stats[0].avg.toFixed(1),
        reviewCount: stats[0].count,
      });
    }

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/templates/featured
exports.getFeatured = async (req, res) => {
  try {
    const templates = await Template.find({ isPublished: true, isFeatured: true })
      .sort({ trendingScore: -1 })
      .limit(12);
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/templates/trending
exports.getTrending = async (req, res) => {
  try {
    const templates = await Template.find({ isPublished: true, isTrending: true })
      .sort({ trendingScore: -1 })
      .limit(12);
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: POST /api/templates
exports.createTemplate = async (req, res) => {
  try {
    const templateData = { ...req.body, author: req.user._id, authorName: req.user.username };
    if (!templateData.slug) {
      templateData.slug = templateData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    }
    const template = await Template.create(templateData);
    res.status(201).json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: PUT /api/templates/:id
exports.updateTemplate = async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found.' });
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: DELETE /api/templates/:id
exports.deleteTemplate = async (req, res) => {
  try {
    await Template.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Template deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: GET /api/templates/stats
exports.getTemplateStats = async (req, res) => {
  try {
    const total = await Template.countDocuments();
    const published = await Template.countDocuments({ isPublished: true });
    const featured = await Template.countDocuments({ isFeatured: true });
    const totalDownloads = await Template.aggregate([{ $group: { _id: null, total: { $sum: '$downloadCount' } } }]);
    const byFramework = await Template.aggregate([
      { $group: { _id: '$framework', count: { $sum: 1 }, downloads: { $sum: '$downloadCount' } } },
    ]);
    const byCategory = await Template.aggregate([
      { $group: { _id: '$categoryName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
    ]);
    const topTemplates = await Template.find({ isPublished: true })
      .sort({ downloadCount: -1 }).limit(10).select('title downloadCount averageRating');

    res.json({
      success: true,
      stats: {
        total, published, featured,
        totalDownloads: totalDownloads[0] ? totalDownloads[0].total : 0,
        byFramework, byCategory, topTemplates,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
