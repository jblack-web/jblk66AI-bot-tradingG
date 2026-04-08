const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true, trim: true },
    storeDescription: { type: String, default: '' },
    logo: { type: String, default: '' },
    kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    bankAccount: {
      accountNumber: { type: String, default: '' },
      routingNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
    },
    commissionRate: { type: Number, default: 10 },
    totalRevenue: { type: Number, default: 0 },
    pendingPayout: { type: Number, default: 0 },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    badge: { type: String, enum: ['none', 'silver', 'gold', 'platinum'], default: 'none' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Seller', sellerSchema);
