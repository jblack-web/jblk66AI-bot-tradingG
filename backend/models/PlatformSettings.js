const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    withdrawMode: { type: String, enum: ['manual', 'auto'], default: 'manual' },
    autoWithdrawThreshold: { type: Number, default: 100 },
    miningPayoutFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    marketplaceCommissionRate: { type: Number, default: 10 },
    referralCommissionRate: { type: Number, default: 5 },
    maintenanceFeeRate: { type: Number, default: 2 },
    electricityCostPerKWh: { type: Number, default: 0.05 },
    feeStructure: { type: Map, of: Number, default: {} },
    emailConfig: { type: Map, of: String, default: {} },
    smsConfig: { type: Map, of: String, default: {} },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
