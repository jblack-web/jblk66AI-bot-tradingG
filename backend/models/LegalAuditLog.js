const mongoose = require('mongoose');

const legalAuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. 'document.download', 'ticket.create', 'team.add'
  resource: { type: String },              // e.g. 'LegalDocument', 'LegalTicket'
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  resourceTitle: { type: String },

  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String },
  performedByRole: { type: String },

  ipAddress: { type: String },
  userAgent: { type: String },

  details: { type: mongoose.Schema.Types.Mixed },

  // Severity/classification of the action
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },

  createdAt: { type: Date, default: Date.now },
});

legalAuditLogSchema.index({ createdAt: -1 });
legalAuditLogSchema.index({ performedBy: 1 });
legalAuditLogSchema.index({ action: 1 });
legalAuditLogSchema.index({ resource: 1, resourceId: 1 });

module.exports = mongoose.model('LegalAuditLog', legalAuditLogSchema);
