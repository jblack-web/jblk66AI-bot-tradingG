const mongoose = require('mongoose');

const referralBonusSchema = new mongoose.Schema({
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referred: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bonusAmount: { type: Number, required: true },
  bonusPercent: { type: Number, required: true },
  sourceDepositAmount: { type: Number },
  status: { type: String, enum: ['pending', 'credited', 'withdrawn'], default: 'pending' },
  creditedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('ReferralBonus', referralBonusSchema);
