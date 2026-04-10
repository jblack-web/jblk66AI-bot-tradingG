const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['review', 'approval', 'dispute', 'escalation', 'resolution'],
    required: true,
  },
  order: { type: Number, required: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedToNames: [String],
  description: String,
  durationDays: { type: Number, default: 3 },
  requiresApproval: { type: Boolean, default: false },
  notifyOnEntry: { type: Boolean, default: true },
  notifyOnExit: { type: Boolean, default: true },
  escalateAfterDays: Number,
  escalateTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  escalateToName: String,
});

const workflowInstanceSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'LegalDocument' },
  documentTitle: String,
  currentStage: Number,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'escalated'],
    default: 'active',
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startedByName: String,
  notes: String,
  stageHistory: [{
    stageIndex: Number,
    stageName: String,
    stageType: String,
    enteredAt: Date,
    exitedAt: Date,
    actionTakenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actionTakenByName: String,
    action: String,
    note: String,
  }],
});

const legalWorkflowSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,

  // Workflow stages
  stages: [stageSchema],

  // Who can use this workflow
  applicableDocTypes: [{
    type: String,
    enum: ['terms_of_service', 'privacy_policy', 'disclosure', 'agreement', 'cookie_policy', 'other'],
  }],

  // Settings
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  autoAssign: { type: Boolean, default: false },

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: String,
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Active instances
  instances: [workflowInstanceSchema],

  // Compliance calendar linkage
  calendarDeadlines: [{
    label: String,
    dueDays: Number,
    stageType: String,
  }],
}, { timestamps: true });

legalWorkflowSchema.index({ isActive: 1 });
legalWorkflowSchema.index({ isDefault: 1 });

module.exports = mongoose.model('LegalWorkflow', legalWorkflowSchema);
