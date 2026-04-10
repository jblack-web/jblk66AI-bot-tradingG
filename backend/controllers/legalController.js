const LegalTeamMember = require('../models/LegalTeamMember');
const LegalTicket = require('../models/LegalTicket');
const LegalDocument = require('../models/LegalDocument');
const LegalAlert = require('../models/LegalAlert');
const ComplianceCalendar = require('../models/ComplianceCalendar');
const LegalAuditLog = require('../models/LegalAuditLog');

// ─── Audit Helper ─────────────────────────────────────────────────────────────

async function logAction(req, action, resource, resourceId, resourceTitle, details, severity = 'low') {
  try {
    await LegalAuditLog.create({
      action,
      resource,
      resourceId,
      resourceTitle,
      performedBy: req.user?._id,
      performedByName: req.user?.username,
      performedByRole: req.user?.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details,
      severity,
    });
  } catch (err) {
    // Non-fatal: swallow audit log errors
    console.error('Audit log error:', err.message);
  }
}

// ─── Legal Team Members ───────────────────────────────────────────────────────

exports.getTeamMembers = async (req, res) => {
  try {
    const { role, area, active, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (active !== undefined) filter.isActive = active === 'true';
    if (area) filter.legalAreas = area;

    const skip = (Number(page) - 1) * Number(limit);
    const [members, total] = await Promise.all([
      LegalTeamMember.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)),
      LegalTeamMember.countDocuments(filter),
    ]);

    res.json({ success: true, members, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addTeamMember = async (req, res) => {
  try {
    const member = new LegalTeamMember({ ...req.body, addedBy: req.user._id });
    await member.save();
    await logAction(req, 'team.add', 'LegalTeamMember', member._id, member.name, { email: member.email }, 'medium');
    res.status(201).json({ success: true, member });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateTeamMember = async (req, res) => {
  try {
    const member = await LegalTeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    await logAction(req, 'team.update', 'LegalTeamMember', member._id, member.name, req.body, 'medium');
    res.json({ success: true, member });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteTeamMember = async (req, res) => {
  try {
    const member = await LegalTeamMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    await logAction(req, 'team.delete', 'LegalTeamMember', member._id, member.name, {}, 'high');
    res.json({ success: true, message: 'Legal team member removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Legal Tickets ────────────────────────────────────────────────────────────

exports.getTickets = async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 20, submittedBy } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (submittedBy) filter.submittedBy = submittedBy;

    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      LegalTicket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('assignedTo', 'name email role'),
      LegalTicket.countDocuments(filter),
    ]);

    res.json({ success: true, tickets, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const ticket = await LegalTicket.findById(req.params.id)
      .populate('submittedBy', 'username email')
      .populate('assignedTo', 'name email role phone');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    await logAction(req, 'ticket.view', 'LegalTicket', ticket._id, ticket.ticketNumber, {});
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and description are required.' });
    }

    const ticket = new LegalTicket({
      subject,
      description,
      category,
      priority,
      submittedBy: req.user._id,
      submittedByName: req.user.username,
      submittedByRole: req.user.role,
      statusHistory: [{
        status: 'pending',
        changedBy: req.user._id,
        changedByName: req.user.username,
        changedAt: new Date(),
        note: 'Ticket created',
      }],
    });
    await ticket.save();
    await logAction(req, 'ticket.create', 'LegalTicket', ticket._id, ticket.ticketNumber,
      { subject, category, priority }, 'medium');
    res.status(201).json({ success: true, ticket });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const { status, assignedTo, assignedToName, priority, resolution, note } = req.body;
    const ticket = await LegalTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    const prevStatus = ticket.status;
    if (status) ticket.status = status;
    if (assignedTo !== undefined) { ticket.assignedTo = assignedTo; ticket.assignedToName = assignedToName || ''; }
    if (priority) ticket.priority = priority;
    if (resolution) ticket.resolution = resolution;
    if (status === 'resolved' && !ticket.resolvedAt) ticket.resolvedAt = new Date();

    // Record status change in history
    if (status && status !== prevStatus) {
      ticket.statusHistory.push({
        status,
        changedBy: req.user._id,
        changedByName: req.user.username,
        changedAt: new Date(),
        note: note || `Status changed to ${status}`,
      });
    }

    await ticket.save();
    await logAction(req, 'ticket.update', 'LegalTicket', ticket._id, ticket.ticketNumber,
      { status, priority, assignedTo }, 'medium');
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.addTicketMessage = async (req, res) => {
  try {
    const { body, isInternal } = req.body;
    if (!body) return res.status(400).json({ success: false, message: 'Message body is required.' });

    const ticket = await LegalTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    ticket.messages.push({
      sender: req.user._id,
      senderName: req.user.username,
      senderRole: req.user.role,
      body,
      isInternal: isInternal === true,
      createdAt: new Date(),
    });
    // Reopen ticket if a user replies to a resolved/closed ticket
    if (['resolved', 'closed'].includes(ticket.status) && !isInternal) {
      ticket.status = 'in-progress';
      ticket.statusHistory.push({
        status: 'in-progress',
        changedBy: req.user._id,
        changedByName: req.user.username,
        changedAt: new Date(),
        note: 'Reopened by new reply',
      });
    }
    await ticket.save();
    await logAction(req, 'ticket.message', 'LegalTicket', ticket._id, ticket.ticketNumber,
      { isInternal });
    res.json({ success: true, message: 'Message added.', ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Legal Documents ──────────────────────────────────────────────────────────

exports.getDocuments = async (req, res) => {
  try {
    const { docType, category, accessLevel, archived = false, page = 1, limit = 20 } = req.query;
    const filter = { isArchived: archived === 'true' };
    if (docType) filter.docType = docType;
    if (category) filter.category = category;
    if (accessLevel) filter.accessLevel = accessLevel;

    const skip = (Number(page) - 1) * Number(limit);
    const [documents, total] = await Promise.all([
      LegalDocument.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      LegalDocument.countDocuments(filter),
    ]);

    res.json({ success: true, documents, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const doc = await LegalDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    doc.viewCount += 1;
    await doc.save();
    await logAction(req, 'document.view', 'LegalDocument', doc._id, doc.title, {});
    res.json({ success: true, document: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDocument = async (req, res) => {
  try {
    const doc = new LegalDocument({
      ...req.body,
      uploadedBy: req.user._id,
      uploadedByName: req.user.username,
    });
    // Seed first version entry
    if (req.body.fileUrl) {
      doc.versions.push({
        version: doc.currentVersion || '1.0',
        url: req.body.fileUrl,
        uploadedBy: req.user._id,
        uploadedByName: req.user.username,
        changeNotes: 'Initial upload',
      });
    }
    await doc.save();
    await logAction(req, 'document.create', 'LegalDocument', doc._id, doc.title,
      { docType: doc.docType }, 'medium');
    res.status(201).json({ success: true, document: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const doc = await LegalDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    const { newVersion, newFileUrl, changeNotes, ...rest } = req.body;
    Object.assign(doc, rest);

    // If a new file version is being uploaded
    if (newVersion && newFileUrl) {
      doc.currentVersion = newVersion;
      doc.fileUrl = newFileUrl;
      doc.versions.push({
        version: newVersion,
        url: newFileUrl,
        uploadedBy: req.user._id,
        uploadedByName: req.user.username,
        changeNotes: changeNotes || '',
      });
    }

    await doc.save();
    await logAction(req, 'document.update', 'LegalDocument', doc._id, doc.title, req.body, 'medium');
    res.json({ success: true, document: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await LegalDocument.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    await logAction(req, 'document.delete', 'LegalDocument', doc._id, doc.title, {}, 'high');
    res.json({ success: true, message: 'Document deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const doc = await LegalDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    doc.downloadCount += 1;
    await doc.save();
    await logAction(req, 'document.download', 'LegalDocument', doc._id, doc.title, {}, 'medium');
    res.json({ success: true, fileUrl: doc.fileUrl, fileName: doc.fileName });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Legal Alerts ─────────────────────────────────────────────────────────────

exports.getAlerts = async (req, res) => {
  try {
    const { alertType, severity, resolved = false, page = 1, limit = 20 } = req.query;
    const filter = { isResolved: resolved === 'true' };
    if (alertType) filter.alertType = alertType;
    if (severity) filter.severity = severity;

    const skip = (Number(page) - 1) * Number(limit);
    const [alerts, total] = await Promise.all([
      LegalAlert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      LegalAlert.countDocuments(filter),
    ]);
    const unreadCount = await LegalAlert.countDocuments({ isRead: false, isResolved: false });
    res.json({ success: true, alerts, total, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const alert = new LegalAlert({
      ...req.body,
      triggeredBy: req.body.triggeredBy || 'admin',
      triggeredByUser: req.user._id,
      triggeredByName: req.user.username,
    });
    await alert.save();
    await logAction(req, 'alert.create', 'LegalAlert', alert._id, alert.title,
      { alertType: alert.alertType, severity: alert.severity }, 'medium');
    res.status(201).json({ success: true, alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const alert = await LegalAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    alert.isResolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user._id;
    alert.resolvedByName = req.user.username;
    alert.resolutionNotes = req.body.resolutionNotes || '';
    alert.isRead = true;
    await alert.save();
    await logAction(req, 'alert.resolve', 'LegalAlert', alert._id, alert.title, {}, 'medium');
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAlertRead = async (req, res) => {
  try {
    const alert = await LegalAlert.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date(), readBy: req.user._id },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Compliance Calendar ──────────────────────────────────────────────────────

exports.getCalendarEvents = async (req, res) => {
  try {
    const { status, eventType, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (eventType) filter.eventType = eventType;
    if (from || to) {
      filter.dueDate = {};
      if (from) filter.dueDate.$gte = new Date(from);
      if (to) filter.dueDate.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      ComplianceCalendar.find(filter)
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('assignedTo', 'name email'),
      ComplianceCalendar.countDocuments(filter),
    ]);
    res.json({ success: true, events, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCalendarEvent = async (req, res) => {
  try {
    const event = new ComplianceCalendar({
      ...req.body,
      createdBy: req.user._id,
      createdByName: req.user.username,
    });
    await event.save();
    await logAction(req, 'calendar.create', 'ComplianceCalendar', event._id, event.title,
      { eventType: event.eventType, dueDate: event.dueDate }, 'low');
    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateCalendarEvent = async (req, res) => {
  try {
    const evt = await ComplianceCalendar.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!evt) return res.status(404).json({ success: false, message: 'Event not found.' });
    await logAction(req, 'calendar.update', 'ComplianceCalendar', evt._id, evt.title, req.body, 'low');
    res.json({ success: true, event: evt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.completeCalendarEvent = async (req, res) => {
  try {
    const evt = await ComplianceCalendar.findById(req.params.id);
    if (!evt) return res.status(404).json({ success: false, message: 'Event not found.' });
    evt.status = 'completed';
    evt.completedAt = new Date();
    evt.completedBy = req.user._id;
    evt.completedByName = req.user.username;
    evt.completionNotes = req.body.completionNotes || '';
    await evt.save();
    await logAction(req, 'calendar.complete', 'ComplianceCalendar', evt._id, evt.title, {}, 'low');
    res.json({ success: true, event: evt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCalendarEvent = async (req, res) => {
  try {
    const evt = await ComplianceCalendar.findByIdAndDelete(req.params.id);
    if (!evt) return res.status(404).json({ success: false, message: 'Event not found.' });
    await logAction(req, 'calendar.delete', 'ComplianceCalendar', evt._id, evt.title, {}, 'low');
    res.json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Audit Log ────────────────────────────────────────────────────────────────

exports.getAuditLog = async (req, res) => {
  try {
    const { action, resource, performedBy, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (resource) filter.resource = resource;
    if (performedBy) filter.performedBy = performedBy;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      LegalAuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      LegalAuditLog.countDocuments(filter),
    ]);
    res.json({ success: true, logs, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Dashboard Summary ────────────────────────────────────────────────────────

exports.getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      teamTotal, teamActive,
      ticketsPending, ticketsInProgress, ticketsResolved,
      docsTotal, docsPublished,
      alertsUnread, alertsCritical,
      upcomingEvents, overdueEvents,
    ] = await Promise.all([
      LegalTeamMember.countDocuments(),
      LegalTeamMember.countDocuments({ isActive: true }),
      LegalTicket.countDocuments({ status: 'pending' }),
      LegalTicket.countDocuments({ status: 'in-progress' }),
      LegalTicket.countDocuments({ status: 'resolved' }),
      LegalDocument.countDocuments({ isArchived: false }),
      LegalDocument.countDocuments({ isPublished: true, isArchived: false }),
      LegalAlert.countDocuments({ isRead: false, isResolved: false }),
      LegalAlert.countDocuments({ severity: 'critical', isResolved: false }),
      ComplianceCalendar.countDocuments({ status: 'upcoming', dueDate: { $gte: now, $lte: in30Days } }),
      ComplianceCalendar.countDocuments({ status: { $nin: ['completed', 'cancelled'] }, dueDate: { $lt: now } }),
    ]);

    const recentTickets = await LegalTicket.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('ticketNumber subject status priority createdAt');

    const urgentEvents = await ComplianceCalendar.find({
      status: 'upcoming',
      dueDate: { $gte: now, $lte: in7Days },
    }).sort({ dueDate: 1 }).limit(5).select('title eventType dueDate priority');

    res.json({
      success: true,
      summary: {
        team: { total: teamTotal, active: teamActive, inactive: teamTotal - teamActive },
        tickets: { pending: ticketsPending, inProgress: ticketsInProgress, resolved: ticketsResolved },
        documents: { total: docsTotal, published: docsPublished },
        alerts: { unread: alertsUnread, critical: alertsCritical },
        calendar: { upcoming: upcomingEvents, overdue: overdueEvents },
      },
      recentTickets,
      urgentEvents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
