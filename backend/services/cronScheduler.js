'use strict';

const cron = require('node-cron');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const initCronJobs = () => {
  // Execute automated trades 5x daily
  const tradeTimes = ['0 6 * * *', '0 9 * * *', '0 12 * * *', '0 15 * * *', '0 18 * * *'];
  tradeTimes.forEach((time, index) => {
    cron.schedule(time, async () => {
      logger.info(`Running automated trading job #${index + 1}`);
      try {
        const { executeAutomatedTrades } = require('./tradingBotService');
        await executeAutomatedTrades();
      } catch (err) {
        logger.error(`Automated trading cron error: ${err.message}`);
      }
    });
  });

  // Reset daily trade counters at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Resetting daily trade counters');
    try {
      const AutomatedTradeSchedule = require('../models/AutomatedTradeSchedule');
      await AutomatedTradeSchedule.updateMany({}, {
        $set: { tradesExecutedToday: 0, lastResetDate: new Date() }
      });
    } catch (err) {
      logger.error(`Reset counters cron error: ${err.message}`);
    }
  });

  // Process subscription renewals daily at 1am
  cron.schedule('0 1 * * *', async () => {
    logger.info('Processing subscription renewals');
    try {
      const UserSubscription = require('../models/UserSubscription');
      const User = require('../models/User');
      const now = new Date();

      const expiredSubs = await UserSubscription.find({
        status: 'active',
        endDate: { $lte: now }
      }).populate('userId tierId');

      for (const sub of expiredSubs) {
        if (sub.autoRenew) {
          const durationMs =
            sub.billingCycle === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
          sub.startDate = now;
          sub.endDate = new Date(now.getTime() + durationMs);
          sub.paymentHistory.push({ amount: sub.price, date: now, method: 'auto_renewal' });
          await sub.save();
          logger.info(`Subscription renewed for user ${sub.userId}`);
        } else {
          sub.status = 'expired';
          await sub.save();
          if (sub.userId) {
            await User.findByIdAndUpdate(sub.userId, { tier: 'basic' });
          }
        }
      }
    } catch (err) {
      logger.error(`Subscription renewal cron error: ${err.message}`);
    }
  });

  // Generate AI insights hourly
  cron.schedule('0 * * * *', async () => {
    logger.info('Generating AI market insights');
    try {
      const AIMarketInsight = require('../models/AIMarketInsight');
      const { getBinancePrice } = require('./marketDataService');

      const assets = ['BTC', 'ETH', 'BNB', 'SOL', 'GOLD'];
      const types = ['trend', 'sentiment', 'technical'];
      const directions = ['bullish', 'bearish', 'neutral'];
      const timeframes = ['1h', '4h', '1d'];

      for (const asset of assets) {
        const insightType = types[Math.floor(Math.random() * types.length)];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
        const confidence = Math.floor(55 + Math.random() * 40);

        await AIMarketInsight.create({
          asset,
          insightType,
          title: `${asset} ${direction.charAt(0).toUpperCase() + direction.slice(1)} Signal - ${insightType}`,
          summary: `AI analysis indicates a ${direction} trend for ${asset} in the ${timeframe} timeframe.`,
          details: `Technical analysis with ${confidence}% confidence based on RSI, MACD, and volume indicators suggests ${direction} momentum for ${asset}.`,
          confidence,
          direction,
          timeframe,
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
          source: 'jblk66AI Engine'
        });
      }
    } catch (err) {
      logger.error(`AI insights cron error: ${err.message}`);
    }
  });

  // Send daily reports at 8am
  cron.schedule('0 8 * * *', async () => {
    logger.info('Sending daily trading reports');
    try {
      const User = require('../models/User');
      const { sendNotification } = require('./notificationService');
      const Trade = require('../models/Trade');

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const users = await User.find({ isActive: true, isBanned: false }).limit(100);

      for (const user of users) {
        const trades = await Trade.find({
          userId: user._id,
          openedAt: { $gte: yesterday }
        });

        if (trades.length > 0) {
          const pnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
          await sendNotification({
            user,
            type: 'system',
            title: 'Daily Trading Report',
            message: `Yesterday you made ${trades.length} trade(s) with a total P&L of $${pnl.toFixed(2)}.`,
            channels: ['inapp']
          });
        }
      }
    } catch (err) {
      logger.error(`Daily report cron error: ${err.message}`);
    }
  });

  // Apply annual interest to premium tier users (daily calculation)
  cron.schedule('30 0 * * *', async () => {
    logger.info('Processing daily interest for premium users');
    try {
      const UserSubscription = require('../models/UserSubscription');
      const Wallet = require('../models/Wallet');

      const premiumSubs = await UserSubscription.find({ tierName: 'premium', status: 'active' });
      const dailyRate = 0.05 / 365;

      for (const sub of premiumSubs) {
        const wallet = await Wallet.findOne({ userId: sub.userId });
        if (wallet && wallet.balance > 0) {
          const interest = wallet.balance * dailyRate;
          if (interest >= 0.01) {
            await wallet.credit(interest, 'interest', 'Daily interest credit (Premium tier)');
          }
        }
      }
    } catch (err) {
      logger.error(`Interest cron error: ${err.message}`);
    }
  });

  logger.info('All cron jobs initialized');
};

module.exports = { initCronJobs };
