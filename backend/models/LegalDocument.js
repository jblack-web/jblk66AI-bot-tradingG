const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  versionNumber: { type: String, required: true },
  content: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByName: String,
  changeNote: String,
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishedAt: Date,
  archivedAt: Date,
  notifyUsers: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const legalDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['terms_of_service', 'privacy_policy', 'disclosure', 'agreement', 'cookie_policy', 'other'],
    required: true,
  },
  description: String,

  // Current state
  currentVersion: { type: String, default: '1.0.0' },
  currentContent: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },

  // Version history (audit trail)
  versions: [versionSchema],

  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: String,
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastUpdatedByName: String,
  publishedAt: Date,
  archivedAt: Date,

  // Workflow linkage
  requiresWorkflow: { type: Boolean, default: false },
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalWorkflow' },

  // Notification settings
  notifyUsersOnPublish: { type: Boolean, default: true },
  effectiveDate: Date,

  // Tags
  tags: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

legalDocumentSchema.index({ type: 1, status: 1 });
legalDocumentSchema.index({ slug: 1 });

module.exports = mongoose.model('LegalDocument', legalDocumentSchema);
