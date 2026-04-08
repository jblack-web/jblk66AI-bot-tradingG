const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  description: String,
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  minDepositAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number },
  maxUses: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  validFrom: { type: Date, default: Date.now },
  validUntil: Date,
  applicableTiers: [{ type: String, enum: ['free', 'basic', 'advanced', 'premium'] }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  usageHistory: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: Date,
    amountDiscounted: Number,
  }],
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
