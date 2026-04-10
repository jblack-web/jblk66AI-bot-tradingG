const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/legalController');

// Rate limiter for legal admin routes (admin-only, but still limit abuse)
const legalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                  // max 300 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// All legal routes require admin authentication and rate limiting
router.use(legalRateLimit, authMiddleware, adminMiddleware);

// Dashboard summary
router.get('/dashboard', ctrl.getDashboardSummary);

// ─── Team Members ─────────────────────────────────────────────────────────────
router.get('/team', ctrl.getTeamMembers);
router.post('/team', ctrl.addTeamMember);
router.put('/team/:id', ctrl.updateTeamMember);
router.delete('/team/:id', ctrl.deleteTeamMember);

// ─── Tickets ──────────────────────────────────────────────────────────────────
router.get('/tickets', ctrl.getTickets);
router.get('/tickets/:id', ctrl.getTicket);
router.post('/tickets', ctrl.createTicket);
router.put('/tickets/:id', ctrl.updateTicket);
router.post('/tickets/:id/message', ctrl.addTicketMessage);

// ─── Documents ────────────────────────────────────────────────────────────────
router.get('/documents', ctrl.getDocuments);
router.get('/documents/:id', ctrl.getDocument);
router.post('/documents', ctrl.createDocument);
router.put('/documents/:id', ctrl.updateDocument);
router.delete('/documents/:id', ctrl.deleteDocument);
router.post('/documents/:id/download', ctrl.downloadDocument);

// ─── Alerts ───────────────────────────────────────────────────────────────────
router.get('/alerts', ctrl.getAlerts);
router.post('/alerts', ctrl.createAlert);
router.patch('/alerts/:id/resolve', ctrl.resolveAlert);
router.patch('/alerts/:id/read', ctrl.markAlertRead);

// ─── Compliance Calendar ──────────────────────────────────────────────────────
router.get('/calendar', ctrl.getCalendarEvents);
router.post('/calendar', ctrl.createCalendarEvent);
router.put('/calendar/:id', ctrl.updateCalendarEvent);
router.patch('/calendar/:id/complete', ctrl.completeCalendarEvent);
router.delete('/calendar/:id', ctrl.deleteCalendarEvent);

// ─── Audit Log ────────────────────────────────────────────────────────────────
router.get('/audit-log', ctrl.getAuditLog);

module.exports = router;
