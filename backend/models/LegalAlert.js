const mongoose = require('mongoose');

const legalAlertSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  summary: { type: String, required: true },
  body: { type: String },

  alertType: {
    type: String,
    enum: ['regulatory-update', 'kyc-trigger', 'aml-flag', 'suspicious-activity', 'compliance-deadline', 'audit-reminder', 'legal-change', 'data-request', 'sanction-hit', 'policy-change', 'other'],
    required: true,
  },

  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
  },

  // Who triggered this alert (system or user)
  triggeredBy: { type: String, enum: ['system', 'admin', 'user'], default: 'system' },
  triggeredByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  triggeredByName: String,

  // Affected user (for KYC/AML triggers)
  affectedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  affectedUserName: String,

  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  readBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedByName: String,
  resolutionNotes: String,

  // For suspicious activity log
  activityDetails: { type: mongoose.Schema.Types.Mixed },
  relatedTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalTicket' },
  relatedDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalDocument' },

  expiresAt: { type: Date },
}, { timestamps: true });

legalAlertSchema.index({ alertType: 1, isResolved: 1 });
legalAlertSchema.index({ severity: 1 });
legalAlertSchema.index({ isRead: 1 });
legalAlertSchema.index({ createdAt: -1 });
legalAlertSchema.index({ affectedUser: 1 });

module.exports = mongoose.model('LegalAlert', legalAlertSchema);
