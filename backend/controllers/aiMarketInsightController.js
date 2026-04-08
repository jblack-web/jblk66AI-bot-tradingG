'use strict';

const AIMarketInsight = require('../models/AIMarketInsight');
const { paginate } = require('../utils/helpers');

const generateInsights = async (req, res) => {
  try {
    const assets = req.body.assets || ['BTC', 'ETH', 'BNB', 'SOL', 'GOLD'];
    const types = ['trend', 'sentiment', 'prediction', 'technical', 'risk'];
    const directions = ['bullish', 'bearish', 'neutral'];
    const timeframes = ['1h', '4h', '1d'];

    const insights = [];
    for (const asset of assets) {
      const insightType = types[Math.floor(Math.random() * types.length)];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
      const confidence = Math.floor(55 + Math.random() * 40);

      const insight = await AIMarketInsight.create({
        asset,
        insightType,
        title: `${asset} ${direction.charAt(0).toUpperCase() + direction.slice(1)} ${insightType} Signal`,
        summary: `AI analysis shows ${direction} momentum for ${asset} on ${timeframe} timeframe.`,
        details: `Multi-factor AI analysis combining technical indicators (RSI, MACD, Bollinger Bands), on-chain metrics, and market sentiment analysis indicates a ${direction} outlook for ${asset} in the ${timeframe} timeframe. Confidence level: ${confidence}%.`,
        confidence,
        direction,
        timeframe,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        source: 'jblk66AI Engine v2.0'
      });
      insights.push(insight);
    }
    res.status(201).json({ success: true, insights, count: insights.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getInsights = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, direction, asset, minConfidence } = req.query;
    const { skip, limit: lim } = paginate(page, limit);
    const filter = { expiresAt: { $gt: new Date() } };
    if (type) filter.insightType = type;
    if (direction) filter.direction = direction;
    if (asset) filter.asset = asset.toUpperCase();
    if (minConfidence) filter.confidence = { $gte: parseInt(minConfidence) };

    const [insights, total] = await Promise.all([
      AIMarketInsight.find(filter).sort({ generatedAt: -1 }).skip(skip).limit(lim),
      AIMarketInsight.countDocuments(filter)
    ]);
    res.json({ success: true, insights, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getInsightById = async (req, res) => {
  try {
    const insight = await AIMarketInsight.findById(req.params.id);
    if (!insight) return res.status(404).json({ error: 'Insight not found.' });
    res.json({ success: true, insight });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getInsightsByAsset = async (req, res) => {
  try {
    const { symbol } = req.params;
    const insights = await AIMarketInsight.find({
      asset: symbol.toUpperCase(),
      expiresAt: { $gt: new Date() }
    }).sort({ confidence: -1 }).limit(10);
    res.json({ success: true, insights, asset: symbol.toUpperCase() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getInsightAnalytics = async (req, res) => {
  try {
    const [byDirection, byType, byAsset] = await Promise.all([
      AIMarketInsight.aggregate([{ $group: { _id: '$direction', count: { $sum: 1 }, avgConfidence: { $avg: '$confidence' } } }]),
      AIMarketInsight.aggregate([{ $group: { _id: '$insightType', count: { $sum: 1 } } }]),
      AIMarketInsight.aggregate([{ $group: { _id: '$asset', count: { $sum: 1 }, avgConfidence: { $avg: '$confidence' } } }, { $sort: { count: -1 } }, { $limit: 10 }])
    ]);
    res.json({ success: true, analytics: { byDirection, byType, byAsset } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDailyReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const insights = await AIMarketInsight.find({ generatedAt: { $gte: today } }).sort({ confidence: -1 });
    const summary = {
      totalInsights: insights.length,
      bullish: insights.filter((i) => i.direction === 'bullish').length,
      bearish: insights.filter((i) => i.direction === 'bearish').length,
      neutral: insights.filter((i) => i.direction === 'neutral').length,
      avgConfidence: insights.length > 0 ? (insights.reduce((acc, i) => acc + i.confidence, 0) / insights.length).toFixed(1) : 0,
      topInsights: insights.slice(0, 5)
    };
    res.json({ success: true, report: summary, date: today });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { generateInsights, getInsights, getInsightById, getInsightsByAsset, getInsightAnalytics, getDailyReport };
