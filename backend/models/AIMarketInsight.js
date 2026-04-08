const mongoose = require('mongoose');

const aiMarketInsightSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['trend_analysis', 'sentiment', 'price_prediction', 'technical_analysis',
      'risk_alert', 'opportunity', 'onchain', 'macro', 'correlation', 'anomaly'],
    required: true,
  },
  market: { type: String, required: true },
  title: { type: String, required: true },
  summary: String,
  content: mongoose.Schema.Types.Mixed,
  confidence: { type: Number, min: 0, max: 100 },
  sentiment: { type: String, enum: ['bullish', 'bearish', 'neutral'] },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  expiresAt: Date,
  isActive: { type: Boolean, default: true },
  generatedBy: { type: String, default: 'AI' },
  accuracy: Number,
  targetUsers: [{ type: String, enum: ['free', 'basic', 'advanced', 'premium'] }],
}, { timestamps: true });

module.exports = mongoose.model('AIMarketInsight', aiMarketInsightSchema);
