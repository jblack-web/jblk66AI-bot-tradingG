const LegalDocument = require('../models/LegalDocument');
const LegalWorkflow = require('../models/LegalWorkflow');

// ─── Legal Documents ────────────────────────────────────────────────────────

// GET /api/legal/documents
exports.getDocuments = async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (status) filter.status = status;
    const docs = await LegalDocument.find(filter)
      .select('-versions')
      .sort({ type: 1, updatedAt: -1 });
    res.json({ success: true, documents: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/legal/documents/:id
exports.getDocument = async (req, res) => {
  try {
    const doc = await LegalDocument.findById(req.params.id)
      .populate('workflowId', 'name stages');
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    res.json({ success: true, document: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/legal/documents (admin)
exports.createDocument = async (req, res) => {
  try {
    const { title, type, description, content, tags, effectiveDate, workflowId, notifyUsersOnPublish, requiresWorkflow } = req.body;

    if (!title || !type) {
      return res.status(400).json({ success: false, message: 'Title and type are required.' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const doc = await LegalDocument.create({
      title,
      slug,
      type,
      description,
      currentContent: content || '',
      currentVersion: '1.0.0',
      status: 'draft',
      tags: tags || [],
      effectiveDate,
      workflowId: workflowId || undefined,
      requiresWorkflow: !!requiresWorkflow,
      notifyUsersOnPublish: notifyUsersOnPublish !== false,
      createdBy: req.user._id,
      createdByName: req.user.username,
      lastUpdatedBy: req.user._id,
      lastUpdatedByName: req.user.username,
      versions: [{
        versionNumber: '1.0.0',
        content: content || '',
        changedBy: req.user._id,
        changedByName: req.user.username,
        changeNote: 'Initial creation',
        status: 'draft',
      }],
    });

    res.status(201).json({ success: true, document: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/legal/documents/:id (admin) - save new draft version
exports.updateDocument = async (req, res) => {
  try {
    const doc = await LegalDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    const { content, changeNote, title, description, tags, effectiveDate, workflowId, notifyUsersOnPublish, requiresWorkflow } = req.body;

    // Increment version if content changed
    let newVersion = doc.currentVersion;
    if (content !== undefined && content !== doc.currentContent) {
      const parts = doc.currentVersion.split('.').map(Number);
      parts[2] = (parts[2] || 0) + 1;
      newVersion = parts.join('.');

      doc.versions.push({
        versionNumber: newVersion,
        content,
        changedBy: req.user._id,
        changedByName: req.user.username,
        changeNote: changeNote || 'Content updated',
        status: doc.status,
      });
      doc.currentContent = content;
      doc.currentVersion = newVersion;
    }

    if (title !== undefined) doc.title = title;
    if (description !== undefined) doc.description = description;
    if (tags !== undefined) doc.tags = tags;
    if (effectiveDate !== undefined) doc.effectiveDate = effectiveDate;
    if (workflowId !== undefined) doc.workflowId = workflowId || undefined;
    if (notifyUsersOnPublish !== undefined) doc.notifyUsersOnPublish = notifyUsersOnPublish;
    if (requiresWorkflow !== undefined) doc.requiresWorkflow = !!requiresWorkflow;

    doc.lastUpdatedBy = req.user._id;
    doc.lastUpdatedByName = req.user.username;

    await doc.save();
    res.json({ success: true, document: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/legal/documents/:id/status (admin) - draft | publish | archive
exports.changeDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const doc = await LegalDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    doc.status = status;
    if (status === 'published') doc.publishedAt = new Date();
    if (status === 'archived') doc.archivedAt = new Date();

    // Record version status change in audit trail
    if (doc.versions.length > 0) {
      doc.versions[doc.versions.length - 1].status = status;
      if (status === 'published') doc.versions[doc.versions.length - 1].publishedAt = new Date();
    }

    doc.lastUpdatedBy = req.user._id;
    doc.lastUpdatedByName = req.user.username;

    await doc.save();
    res.json({ success: true, document: doc, message: `Document ${status} successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/legal/documents/:id (admin) - soft delete
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await LegalDocument.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    res.json({ success: true, message: 'Document deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Legal Workflows ────────────────────────────────────────────────────────

// GET /api/legal/workflows
exports.getWorkflows = async (req, res) => {
  try {
    const workflows = await LegalWorkflow.find({ isActive: true })
      .select('-instances')
      .sort({ isDefault: -1, name: 1 });
    res.json({ success: true, workflows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/legal/workflows/:id
exports.getWorkflow = async (req, res) => {
  try {
    const workflow = await LegalWorkflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found.' });
    res.json({ success: true, workflow });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/legal/workflows (admin)
exports.createWorkflow = async (req, res) => {
  try {
    const { name, description, stages, applicableDocTypes, isDefault, autoAssign, calendarDeadlines } = req.body;

    if (!name || !stages || stages.length === 0) {
      return res.status(400).json({ success: false, message: 'Name and at least one stage are required.' });
    }

    const workflow = await LegalWorkflow.create({
      name,
      description,
      stages,
      applicableDocTypes: applicableDocTypes || [],
      isDefault: !!isDefault,
      autoAssign: !!autoAssign,
      calendarDeadlines: calendarDeadlines || [],
      createdBy: req.user._id,
      createdByName: req.user.username,
      lastUpdatedBy: req.user._id,
    });

    res.status(201).json({ success: true, workflow });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/legal/workflows/:id (admin)
exports.updateWorkflow = async (req, res) => {
  try {
    const allowed = ['name', 'description', 'stages', 'applicableDocTypes', 'isDefault', 'isActive', 'autoAssign', 'calendarDeadlines'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    updates.lastUpdatedBy = req.user._id;

    const workflow = await LegalWorkflow.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found.' });
    res.json({ success: true, workflow });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/legal/workflows/:id (admin) - soft delete
exports.deleteWorkflow = async (req, res) => {
  try {
    const workflow = await LegalWorkflow.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found.' });
    res.json({ success: true, message: 'Workflow deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/legal/workflows/:id/start (admin) - start a workflow instance for a document
exports.startWorkflowInstance = async (req, res) => {
  try {
    const { documentId, notes } = req.body;
    const workflow = await LegalWorkflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found.' });

    const doc = await LegalDocument.findById(documentId);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    workflow.instances.push({
      documentId,
      documentTitle: doc.title,
      currentStage: 0,
      status: 'active',
      startedBy: req.user._id,
      startedByName: req.user.username,
      notes,
      stageHistory: workflow.stages.length > 0 ? [{
        stageIndex: 0,
        stageName: workflow.stages[0].name,
        stageType: workflow.stages[0].type,
        enteredAt: new Date(),
      }] : [],
    });

    await workflow.save();
    res.json({ success: true, message: 'Workflow instance started.', workflow });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/legal/workflows/:id/instances/:instanceId/advance (admin)
exports.advanceWorkflowInstance = async (req, res) => {
  try {
    const { action, note } = req.body;
    const workflow = await LegalWorkflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found.' });

    const instance = workflow.instances.id(req.params.instanceId);
    if (!instance) return res.status(404).json({ success: false, message: 'Instance not found.' });

    if (instance.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Instance is not active.' });
    }

    // Close current stage
    const lastHistory = instance.stageHistory[instance.stageHistory.length - 1];
    if (lastHistory && !lastHistory.exitedAt) {
      lastHistory.exitedAt = new Date();
      lastHistory.actionTakenBy = req.user._id;
      lastHistory.actionTakenByName = req.user.username;
      lastHistory.action = action || 'approved';
      lastHistory.note = note;
    }

    const nextStageIndex = instance.currentStage + 1;

    if (nextStageIndex >= workflow.stages.length) {
      instance.status = 'completed';
      instance.completedAt = new Date();
    } else {
      instance.currentStage = nextStageIndex;
      const nextStage = workflow.stages[nextStageIndex];
      instance.stageHistory.push({
        stageIndex: nextStageIndex,
        stageName: nextStage.name,
        stageType: nextStage.type,
        enteredAt: new Date(),
      });
    }

    await workflow.save();
    res.json({ success: true, message: action === 'approved' ? 'Stage advanced.' : 'Action recorded.', workflow });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/legal/stats (admin)
exports.getLegalStats = async (req, res) => {
  try {
    const [totalDocs, publishedDocs, draftDocs, archivedDocs, totalWorkflows, activeWorkflows] = await Promise.all([
      LegalDocument.countDocuments({ isActive: true }),
      LegalDocument.countDocuments({ isActive: true, status: 'published' }),
      LegalDocument.countDocuments({ isActive: true, status: 'draft' }),
      LegalDocument.countDocuments({ isActive: true, status: 'archived' }),
      LegalWorkflow.countDocuments(),
      LegalWorkflow.countDocuments({ isActive: true }),
    ]);

    const docsByType = await LegalDocument.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalDocs, publishedDocs, draftDocs, archivedDocs,
        totalWorkflows, activeWorkflows,
        docsByType,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
