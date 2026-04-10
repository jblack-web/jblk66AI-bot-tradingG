const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  changeDocumentStatus,
  deleteDocument,
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  startWorkflowInstance,
  advanceWorkflowInstance,
  getLegalStats,
} = require('../controllers/legalController');

// Public: published policy documents visible to users
router.get('/documents/public', getDocuments);

// Admin: document management
router.get('/documents', authMiddleware, adminMiddleware, getDocuments);
router.get('/documents/:id', authMiddleware, adminMiddleware, getDocument);
router.post('/documents', authMiddleware, adminMiddleware, createDocument);
router.put('/documents/:id', authMiddleware, adminMiddleware, updateDocument);
router.patch('/documents/:id/status', authMiddleware, adminMiddleware, changeDocumentStatus);
router.delete('/documents/:id', authMiddleware, adminMiddleware, deleteDocument);

// Admin: workflow management
router.get('/workflows', authMiddleware, adminMiddleware, getWorkflows);
router.get('/workflows/:id', authMiddleware, adminMiddleware, getWorkflow);
router.post('/workflows', authMiddleware, adminMiddleware, createWorkflow);
router.put('/workflows/:id', authMiddleware, adminMiddleware, updateWorkflow);
router.delete('/workflows/:id', authMiddleware, adminMiddleware, deleteWorkflow);

// Admin: workflow instances
router.post('/workflows/:id/start', authMiddleware, adminMiddleware, startWorkflowInstance);
router.patch('/workflows/:id/instances/:instanceId/advance', authMiddleware, adminMiddleware, advanceWorkflowInstance);

// Admin: stats
router.get('/stats', authMiddleware, adminMiddleware, getLegalStats);

module.exports = router;
