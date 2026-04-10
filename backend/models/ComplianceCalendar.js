const mongoose = require('mongoose');

const complianceCalendarSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },

  eventType: {
    type: String,
    enum: ['filing-deadline', 'audit', 'eoy-reporting', 'review', 'kyc-renewal', 'license-renewal', 'regulatory-submission', 'board-meeting', 'compliance-training', 'data-retention-review', 'policy-review', 'other'],
    required: true,
  },

  dueDate: { type: Date, required: true },
  startDate: { type: Date },

  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },

  status: {
    type: String,
    enum: ['upcoming', 'in-progress', 'completed', 'overdue', 'cancelled'],
    default: 'upcoming',
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalTeamMember' },
  assignedToName: String,

  // Notifications
  notifyDaysBefore: { type: Number, default: 7 },
  notificationSent: { type: Boolean, default: false },
  notificationSentAt: { type: Date },

  // Recurrence
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually'],
  },

  // Completion
  completedAt: { type: Date },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedByName: String,
  completionNotes: String,

  attachments: [{ name: String, url: String }],
  tags: [String],
  jurisdiction: String,

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: String,
}, { timestamps: true });

complianceCalendarSchema.index({ dueDate: 1, status: 1 });
complianceCalendarSchema.index({ eventType: 1 });
complianceCalendarSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('ComplianceCalendar', complianceCalendarSchema);
