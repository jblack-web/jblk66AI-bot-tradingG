'use strict';

const mongoose = require('mongoose');

const accountManagerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    bio: {
      type: String,
      maxlength: 1000,
      default: null
    },
    specialization: {
      type: [String],
      default: ['crypto', 'forex']
    },
    maxClients: {
      type: Number,
      default: 20
    },
    currentClients: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    reviews: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, maxlength: 500 },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    responseTime: {
      type: String,
      default: 'within 24 hours'
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    communicationChannels: {
      type: [String],
      enum: ['email', 'phone', 'whatsapp', 'telegram', 'zoom', 'skype'],
      default: ['email']
    },
    languages: {
      type: [String],
      default: ['English']
    },
    yearsExperience: {
      type: Number,
      default: 0
    },
    certifications: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

accountManagerSchema.methods.addReview = function (userId, rating, comment) {
  this.reviews.push({ userId, rating, comment });
  this.totalReviews = this.reviews.length;
  const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  this.rating = parseFloat((sum / this.totalReviews).toFixed(1));
};

accountManagerSchema.index({ isAvailable: 1, rating: -1 });

module.exports = mongoose.model('AccountManager', accountManagerSchema);
