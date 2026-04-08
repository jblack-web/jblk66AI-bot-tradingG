'use strict';

const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Promo code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    maxUses: {
      type: Number,
      required: true,
      min: 1
    },
    usedCount: {
      type: Number,
      default: 0
    },
    expiryDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    description: {
      type: String,
      maxlength: 500,
      default: null
    },
    applicableTo: {
      type: String,
      enum: ['deposit', 'subscription', 'all'],
      default: 'all'
    },
    minDepositAmount: {
      type: Number,
      default: 0
    },
    usedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        usedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

promoCodeSchema.methods.isValid = function () {
  return (
    this.isActive &&
    this.usedCount < this.maxUses &&
    new Date() < new Date(this.expiryDate)
  );
};

promoCodeSchema.methods.calculateDiscount = function (amount) {
  if (this.discountType === 'percentage') {
    return (amount * this.discountValue) / 100;
  }
  return Math.min(this.discountValue, amount);
};

promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ isActive: 1, expiryDate: 1 });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
