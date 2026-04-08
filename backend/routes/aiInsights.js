'use strict';

const express = require('express');
const router = express.Router();
const { generateInsights, getInsights, getInsightById, getInsightsByAsset, getInsightAnalytics, getDailyReport } = require('../controllers/aiMarketInsightController');
const { protect, restrictTo } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: AIInsights
 *   description: AI Market Insights
 */

/**
 * @swagger
 * /api/ai-insights:
 *   get:
 *     summary: Get AI market insights
 *     tags: [AIInsights]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: direction
 *         schema: { type: string, enum: [bullish, bearish, neutral] }
 *       - in: query
 *         name: asset
 *         schema: { type: string }
 *       - in: query
 *         name: minConfidence
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: AI insights list
 */
router.get('/', protect, getInsights);

/**
 * @swagger
 * /api/ai-insights/report/daily:
 *   get:
 *     summary: Get daily AI report
 *     tags: [AIInsights]
 *     responses:
 *       200:
 *         description: Daily report
 */
router.get('/report/daily', protect, getDailyReport);

/**
 * @swagger
 * /api/ai-insights/analytics:
 *   get:
 *     summary: Get insight analytics
 *     tags: [AIInsights]
 *     responses:
 *       200:
 *         description: Analytics
 */
router.get('/analytics', protect, getInsightAnalytics);

/**
 * @swagger
 * /api/ai-insights/asset/{symbol}:
 *   get:
 *     summary: Get insights by asset
 *     tags: [AIInsights]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Asset insights
 */
router.get('/asset/:symbol', protect, getInsightsByAsset);

/**
 * @swagger
 * /api/ai-insights/generate:
 *   post:
 *     summary: Generate new AI insights (admin)
 *     tags: [AIInsights]
 *     responses:
 *       201:
 *         description: Insights generated
 */
router.post('/generate', protect, restrictTo('admin'), generateInsights);

/**
 * @swagger
 * /api/ai-insights/{id}:
 *   get:
 *     summary: Get insight by ID
 *     tags: [AIInsights]
 *     responses:
 *       200:
 *         description: Insight details
 */
router.get('/:id', protect, getInsightById);

module.exports = router;
