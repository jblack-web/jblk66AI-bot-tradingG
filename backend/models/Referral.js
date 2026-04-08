const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referred: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bonusAmount: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'completed', 'paid'],
      default: 'pending',
    },
    payoutDate: { type: Date },
    conversionTier: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Referral', referralSchema);
