'use strict';

const mongoose = require('mongoose');

const aiMarketInsightSchema = new mongoose.Schema(
  {
    asset: {
      type: String,
      required: true,
      uppercase: true
    },
    insightType: {
      type: String,
      enum: [
        'trend', 'sentiment', 'prediction', 'technical',
        'risk', 'opportunity', 'onchain', 'macro',
        'correlation', 'anomaly'
      ],
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    summary: {
      type: String,
      required: true,
      maxlength: 500
    },
    details: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    direction: {
      type: String,
      enum: ['bullish', 'bearish', 'neutral'],
      required: true
    },
    timeframe: {
      type: String,
      enum: ['1h', '4h', '1d', '1w', '1m'],
      default: '1d'
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    },
    source: {
      type: String,
      default: 'AI Engine'
    },
    accuracy: {
      type: Number,
      default: null,
      min: 0,
      max: 100
    },
    isActioned: {
      type: Boolean,
      default: false
    },
    targetPrice: {
      type: Number,
      default: null
    },
    supportLevel: {
      type: Number,
      default: null
    },
    resistanceLevel: {
      type: Number,
      default: null
    },
    tags: {
      type: [String],
      default: []
    },
    relatedAssets: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

aiMarketInsightSchema.index({ asset: 1, generatedAt: -1 });
aiMarketInsightSchema.index({ insightType: 1, direction: 1 });
aiMarketInsightSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('AIMarketInsight', aiMarketInsightSchema);
