const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: { type: String, ref: 'AdminUser' },
  adminEmail: { type: String },
  action: { type: String, required: true },
  resource: {
    type: String,
    enum: ['pools', 'users', 'payouts', 'admins', 'settings', 'auth', 'security', 'profile', 'analytics'],
  },
  resourceId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: ['Success', 'Failure'], default: 'Success' },
  errorMessage: { type: String },
  timestamp: { type: Date, default: Date.now },
});

auditLogSchema.index({ adminId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ resource: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
