const MiningRig = require('../models/MiningRig');
const MiningContract = require('../models/MiningContract');
const MiningEarning = require('../models/MiningEarning');
const Wallet = require('../models/Wallet');
const PlatformSettings = require('../models/PlatformSettings');

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};
const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

exports.getRigs = async (req, res) => {
  try {
    const { tier, minHashRate, maxHashRate, available, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (tier) filter.tier = tier;
    if (available === 'true') filter.isAvailable = true;
    if (minHashRate || maxHashRate) {
      filter.hashRate = {};
      if (minHashRate) filter.hashRate.$gte = Number(minHashRate);
      if (maxHashRate) filter.hashRate.$lte = Number(maxHashRate);
    }

    const total = await MiningRig.countDocuments(filter);
    const rigs = await MiningRig.find(filter)
      .sort('rentalCostPerTHPerDay')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, rigs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRig = async (req, res) => {
  try {
    const rig = await MiningRig.findById(req.params.id);
    if (!rig) return res.status(404).json({ success: false, message: 'Rig not found' });
    res.json({ success: true, rig });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rentRig = async (req, res) => {
  try {
    const { rigId, hashRate, duration, durationUnit = 'month', selectedPool, autoReinvest = false, currency = 'USD' } = req.body;

    const rig = await MiningRig.findById(rigId);
    if (!rig || !rig.isAvailable) return res.status(404).json({ success: false, message: 'Rig not available' });
    if (hashRate > rig.availableUnits * rig.hashRate) {
      return res.status(400).json({ success: false, message: 'Requested hashrate exceeds availability' });
    }

    const durationDays = durationUnit === 'year' ? duration * 365 : duration * 30;
    const paymentAmount = +(hashRate * rig.rentalCostPerTHPerDay * durationDays).toFixed(2);

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || (wallet.balances[currency] || 0) < paymentAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    wallet.balances[currency] -= paymentAmount;
    wallet.transactions.push({
      type: 'purchase',
      amount: paymentAmount,
      currency,
      status: 'completed',
      note: `Mining contract: ${rig.name} ${hashRate} TH/s for ${duration} ${durationUnit}(s)`,
    });
    await wallet.save();

    const endDate = durationUnit === 'year' ? addYears(new Date(), duration) : addMonths(new Date(), duration);
    const contract = await MiningContract.create({
      userId: req.user._id,
      rigId,
      hashRate,
      endDate,
      contractDuration: duration,
      contractDurationUnit: durationUnit,
      paymentAmount,
      currency,
      selectedPool: selectedPool || (rig.poolOptions[0] || 'Antpool'),
      autoReinvest,
    });

    res.status(201).json({ success: true, contract, paymentAmount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyContracts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const total = await MiningContract.countDocuments(filter);
    const contracts = await MiningContract.find(filter)
      .populate('rigId', 'name tier algorithm coin')
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, contracts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getContract = async (req, res) => {
  try {
    const contract = await MiningContract.findOne({ _id: req.params.id, userId: req.user._id }).populate('rigId');
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    res.json({ success: true, contract });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.pauseContract = async (req, res) => {
  try {
    const contract = await MiningContract.findOne({ _id: req.params.id, userId: req.user._id });
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    if (contract.status !== 'active') return res.status(400).json({ success: false, message: 'Contract not active' });
    contract.status = 'paused';
    contract.pausedAt = new Date();
    await contract.save();
    res.json({ success: true, message: 'Contract paused', contract });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resumeContract = async (req, res) => {
  try {
    const contract = await MiningContract.findOne({ _id: req.params.id, userId: req.user._id });
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    if (contract.status !== 'paused') return res.status(400).json({ success: false, message: 'Contract not paused' });

    if (contract.pausedAt) {
      const pausedDays = Math.ceil((Date.now() - contract.pausedAt) / 86400000);
      contract.pauseDurationDays += pausedDays;
      const newEnd = new Date(contract.endDate);
      newEnd.setDate(newEnd.getDate() + pausedDays);
      contract.endDate = newEnd;
    }
    contract.status = 'active';
    contract.pausedAt = null;
    await contract.save();
    res.json({ success: true, message: 'Contract resumed', contract });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelContract = async (req, res) => {
  try {
    const contract = await MiningContract.findOne({ _id: req.params.id, userId: req.user._id });
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    if (contract.status === 'cancelled') return res.status(400).json({ success: false, message: 'Already cancelled' });
    contract.status = 'cancelled';
    await contract.save();
    res.json({ success: true, message: 'Contract cancelled', contract });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const contracts = await MiningContract.find({ userId: req.user._id, status: 'active' }).populate('rigId', 'name tier');
    const totalHashRate = contracts.reduce((s, c) => s + c.hashRate, 0);
    const totalEarned = contracts.reduce((s, c) => s + c.totalEarned, 0);
    const totalEarnings = await MiningEarning.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, total: { $sum: '$netEarning' }, paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netEarning', 0] } } } },
    ]);

    res.json({
      success: true,
      dashboard: {
        activeContracts: contracts.length,
        totalHashRate,
        totalEarned,
        earningsSummary: totalEarnings[0] || { total: 0, paid: 0 },
        contracts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEarnings = async (req, res) => {
  try {
    const { contractId, page = 1, limit = 30, from, to } = req.query;
    const filter = { userId: req.user._id };
    if (contractId) filter.contractId = contractId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const total = await MiningEarning.countDocuments(filter);
    const earnings = await MiningEarning.find(filter)
      .sort('-date')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, earnings, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.calculateEarnings = async (req, res) => {
  try {
    const { rigId, hashRate, duration, durationUnit = 'month' } = req.body;
    const rig = await MiningRig.findById(rigId);
    if (!rig) return res.status(404).json({ success: false, message: 'Rig not found' });

    const settings = await PlatformSettings.findOne() || {};
    const electricityCostPerDay = (rig.power / 1000) * 24 * (settings.electricityCostPerKWh || 0.05);
    const maintenanceFeeRate = (settings.maintenanceFeeRate || 2) / 100;

    const durationDays = durationUnit === 'year' ? duration * 365 : duration * 30;
    const totalCost = +(hashRate * rig.rentalCostPerTHPerDay * durationDays).toFixed(4);

    const dailyGrossEarning = hashRate * ((rig.dailyEarnings.min + rig.dailyEarnings.max) / 2);
    const dailyFees = dailyGrossEarning * maintenanceFeeRate;
    const dailyNet = dailyGrossEarning - dailyFees - electricityCostPerDay;
    const totalNet = +(dailyNet * durationDays).toFixed(8);
    const roi = totalCost > 0 ? +(((totalNet - totalCost) / totalCost) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      estimate: {
        totalCost,
        dailyGross: +dailyGrossEarning.toFixed(8),
        dailyNet: +dailyNet.toFixed(8),
        totalNet,
        roi,
        breakEvenDays: dailyNet > 0 ? Math.ceil(totalCost / dailyNet) : null,
        durationDays,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePool = async (req, res) => {
  try {
    const { pool } = req.body;
    const contract = await MiningContract.findOne({ _id: req.params.id, userId: req.user._id }).populate('rigId');
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    if (contract.status !== 'active') return res.status(400).json({ success: false, message: 'Contract not active' });

    const validPools = contract.rigId.poolOptions || [];
    if (validPools.length && !validPools.includes(pool)) {
      return res.status(400).json({ success: false, message: `Invalid pool. Options: ${validPools.join(', ')}` });
    }

    contract.selectedPool = pool;
    await contract.save();
    res.json({ success: true, message: 'Pool updated', selectedPool: contract.selectedPool });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
