const mongoose = require('mongoose');

const contractOptionSchema = new mongoose.Schema({
  duration: { type: Number, required: true },
  unit: { type: String, enum: ['month', 'year'], default: 'month' },
  discount: { type: Number, default: 0 },
});

const miningRigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    tier: { type: String, enum: ['entry', 'professional', 'enterprise', 'industrial'], required: true },
    hashRate: { type: Number, required: true },
    power: { type: Number, required: true },
    dailyEarnings: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    rentalCostPerTHPerDay: { type: Number, required: true },
    contractOptions: { type: [contractOptionSchema], default: [] },
    poolOptions: [{ type: String }],
    location: { type: String, default: '' },
    dataCenter: { type: String, default: '' },
    uptime: { type: Number, default: 99.5 },
    isAvailable: { type: Boolean, default: true },
    totalUnits: { type: Number, default: 1 },
    availableUnits: { type: Number, default: 1 },
    specifications: { type: Map, of: String, default: {} },
    image: { type: String, default: '' },
    algorithm: { type: String, default: 'SHA-256' },
    coin: { type: String, default: 'BTC' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MiningRig', miningRigSchema);
