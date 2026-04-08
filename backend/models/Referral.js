const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referredId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    status: { type: String, enum: ['pending', 'active', 'paid'], default: 'pending' },
    commission: { type: Number, default: 0 },
    tier: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Referral', referralSchema);
