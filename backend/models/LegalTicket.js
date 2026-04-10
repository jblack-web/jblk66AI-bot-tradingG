const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: { type: String },
  senderRole: { type: String, enum: ['user', 'admin', 'legal'] },
  body: { type: String, required: true },
  attachments: [{ name: String, url: String, size: Number }],
  isInternal: { type: Boolean, default: false }, // internal legal team note
  createdAt: { type: Date, default: Date.now },
});

const legalTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true },

  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['compliance', 'kyc-aml', 'contracts', 'disputes', 'regulatory', 'data-privacy', 'general-inquiry', 'document-request', 'other'],
    default: 'general-inquiry',
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },

  status: {
    type: String,
    enum: ['pending', 'in-progress', 'awaiting-response', 'resolved', 'closed', 'escalated'],
    default: 'pending',
  },

  // Who submitted the ticket
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedByName: { type: String },
  submittedByRole: { type: String, enum: ['user', 'admin'] },

  // Assigned legal team member
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalTeamMember' },
  assignedToName: { type: String },

  // Thread of messages
  messages: [messageSchema],

  tags: [String],

  // Resolution
  resolvedAt: { type: Date },
  resolution: { type: String },

  // SLA
  dueDate: { type: Date },

  // Audit
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: String,
    changedAt: { type: Date, default: Date.now },
    note: String,
  }],
}, { timestamps: true });

// Auto-generate ticket number before save
legalTicketSchema.pre('save', async function (next) {
  if (!this.ticketNumber) {
    const count = await this.constructor.countDocuments();
    this.ticketNumber = `LT-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

legalTicketSchema.index({ status: 1, priority: 1 });
legalTicketSchema.index({ submittedBy: 1 });
legalTicketSchema.index({ assignedTo: 1 });
legalTicketSchema.index({ createdAt: -1 });
legalTicketSchema.index({ ticketNumber: 1 });

module.exports = mongoose.model('LegalTicket', legalTicketSchema);
