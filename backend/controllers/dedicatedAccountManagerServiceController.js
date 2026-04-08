'use strict';

const DedicatedAccountManagerService = require('../models/DedicatedAccountManagerService');
const AccountManager = require('../models/AccountManager');
const Wallet = require('../models/Wallet');

const subscribe = async (req, res) => {
  try {
    const { managerId, serviceType = 'monthly' } = req.body;
    const manager = await AccountManager.findById(managerId);
    if (!manager) return res.status(404).json({ error: 'Manager not found.' });
    if (!manager.isAvailable || manager.currentClients >= manager.maxClients) {
      return res.status(400).json({ error: 'Manager is not available.' });
    }

    const fee = serviceType === 'daily' ? 19.99 : 499.99;
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < fee) return res.status(400).json({ error: 'Insufficient balance.' });

    await wallet.debit(fee, 'manager_fee', `Account manager service (${serviceType}): ${manager.userId}`);

    const durationMs = serviceType === 'daily' ? 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const endDate = new Date(Date.now() + durationMs);

    const service = await DedicatedAccountManagerService.create({
      userId: req.user._id,
      managerId: manager._id,
      serviceType,
      currentFee: fee,
      endDate,
      nextBillingDate: endDate,
      totalPaid: fee
    });

    manager.currentClients += 1;
    manager.totalRevenue += fee;
    await manager.save();

    res.status(201).json({ success: true, service });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getService = async (req, res) => {
  try {
    const service = await DedicatedAccountManagerService.findOne({ userId: req.user._id, status: 'active' })
      .populate({ path: 'managerId', populate: { path: 'userId', select: 'name email profileImage' } });
    if (!service) return res.status(404).json({ error: 'No active service found.' });
    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const cancelService = async (req, res) => {
  try {
    const service = await DedicatedAccountManagerService.findOne({ _id: req.params.id, userId: req.user._id });
    if (!service) return res.status(404).json({ error: 'Service not found.' });
    service.status = 'cancelled';
    service.autoRenew = false;
    await service.save();

    const manager = await AccountManager.findById(service.managerId);
    if (manager) {
      manager.currentClients = Math.max(0, manager.currentClients - 1);
      await manager.save();
    }

    res.json({ success: true, message: 'Service cancelled.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const scheduleMeeting = async (req, res) => {
  try {
    const { scheduledAt, duration, platform, meetingLink } = req.body;
    const service = await DedicatedAccountManagerService.findOne({ userId: req.user._id, status: 'active' });
    if (!service) return res.status(404).json({ error: 'No active service found.' });

    service.meetings.push({ scheduledAt: new Date(scheduledAt), duration, platform, meetingLink });
    await service.save();
    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addMeetingNotes = async (req, res) => {
  try {
    const { meetingId, notes } = req.body;
    const service = await DedicatedAccountManagerService.findOne({ _id: req.params.id });
    if (!service) return res.status(404).json({ error: 'Service not found.' });

    const meeting = service.meetings.id(meetingId);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    meeting.notes = notes;
    meeting.status = 'completed';
    await service.save();

    res.json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getServiceStats = async (req, res) => {
  try {
    const services = await DedicatedAccountManagerService.find({});
    res.json({
      success: true,
      stats: {
        total: services.length,
        active: services.filter((s) => s.status === 'active').length,
        totalRevenue: services.reduce((acc, s) => acc + s.totalPaid, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { subscribe, getService, cancelService, scheduleMeeting, addMeetingNotes, getServiceStats };
