const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String },
    discountPercentage: { type: Number },
    discountAmount: { type: Number },
    validFrom: { type: Date },
    validTo: { type: Date },
    maxUses: { type: Number },
    currentUses: { type: Number, default: 0 },
    tierRestrictions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Promotion', promotionSchema);
