const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  getTemplates, getTemplate, getCategories, downloadTemplate,
  addReview, getFeatured, getTrending,
  createTemplate, updateTemplate, deleteTemplate, getTemplateStats,
} = require('../controllers/templateController');

// Public routes
router.get('/', getTemplates);
router.get('/featured', getFeatured);
router.get('/trending', getTrending);
router.get('/categories', getCategories);
router.get('/:id', getTemplate);

// Auth routes
router.post('/:id/download', authMiddleware, downloadTemplate);
router.post('/:id/review', authMiddleware, addReview);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, createTemplate);
router.put('/:id', authMiddleware, adminMiddleware, updateTemplate);
router.delete('/:id', authMiddleware, adminMiddleware, deleteTemplate);
router.get('/admin/stats', authMiddleware, adminMiddleware, getTemplateStats);

module.exports = router;
