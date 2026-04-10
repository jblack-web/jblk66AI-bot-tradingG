const mongoose = require('mongoose');

const legalTeamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  title: { type: String, trim: true },

  // Role: admin = full access, in-house = internal counsel, external = outside firm
  role: {
    type: String,
    enum: ['admin', 'in-house', 'external'],
    default: 'in-house',
  },

  // Legal specialization areas
  legalAreas: [{
    type: String,
    enum: ['compliance', 'kyc-aml', 'contracts', 'disputes', 'regulatory', 'data-privacy', 'intellectual-property', 'corporate', 'litigation', 'general'],
  }],

  organization: { type: String, trim: true },
  barNumber: { type: String, trim: true },
  jurisdiction: { type: String, trim: true },
  bio: { type: String },
  avatarUrl: { type: String },

  isActive: { type: Boolean, default: true },

  // Permissions
  canViewDocuments: { type: Boolean, default: true },
  canUploadDocuments: { type: Boolean, default: false },
  canManageTickets: { type: Boolean, default: true },
  canViewAuditLog: { type: Boolean, default: false },
  canManageTeam: { type: Boolean, default: false },

  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

legalTeamMemberSchema.index({ email: 1 });
legalTeamMemberSchema.index({ isActive: 1, role: 1 });

module.exports = mongoose.model('LegalTeamMember', legalTeamMemberSchema);
