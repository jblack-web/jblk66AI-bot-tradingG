const mongoose = require('mongoose');

const documentVersionSchema = new mongoose.Schema({
  version: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedByName: String,
  uploadedAt: { type: Date, default: Date.now },
  changeNotes: String,
  fileSize: Number,
});

const legalDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },

  docType: {
    type: String,
    enum: ['terms', 'privacy-policy', 'disclosure', 'risk-warning', 'license', 'filing', 'contract', 'audit-report', 'compliance-report', 'kyc-policy', 'aml-policy', 'data-request', 'regulatory', 'company-policy', 'other'],
    required: true,
  },

  category: {
    type: String,
    enum: ['compliance', 'kyc-aml', 'contracts', 'disputes', 'regulatory', 'data-privacy', 'corporate', 'internal', 'external'],
    default: 'compliance',
  },

  // Current version metadata
  currentVersion: { type: String, default: '1.0' },
  fileUrl: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  mimeType: { type: String },

  // Version history
  versions: [documentVersionSchema],

  // Access control
  accessLevel: {
    type: String,
    enum: ['admin-only', 'legal-team', 'all-staff', 'public'],
    default: 'admin-only',
  },

  isPublished: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },

  // Dates
  effectiveDate: { type: Date },
  expiryDate: { type: Date },
  reviewDate: { type: Date },

  tags: [String],
  jurisdiction: String,

  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedByName: String,

  // Download/view tracking
  downloadCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
}, { timestamps: true });

legalDocumentSchema.index({ docType: 1, isArchived: 1 });
legalDocumentSchema.index({ category: 1 });
legalDocumentSchema.index({ isPublished: 1, accessLevel: 1 });
legalDocumentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LegalDocument', legalDocumentSchema);
