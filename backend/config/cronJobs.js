const cron = require('node-cron');
const AutomatedTradeSchedule = require('../models/AutomatedTradeSchedule');
const User = require('../models/User');

// Reset daily trade counts at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    await AutomatedTradeSchedule.updateMany({}, { executedToday: 0 });
    await User.updateMany({}, { dailyTradesUsed: 0, lastTradeReset: new Date() });
    console.log('[Cron] Daily trade counts reset.');
  } catch (err) {
    console.error('[Cron] Error resetting trade counts:', err.message);
  }
});

// Execute automated trades 5x per day at scheduled times
const tradeTimes = ['08:00', '11:00', '14:00', '17:00', '20:00'];
tradeTimes.forEach((time) => {
  const [hour, minute] = time.split(':');
  cron.schedule(`${minute} ${hour} * * *`, async () => {
    try {
      const schedules = await AutomatedTradeSchedule.find({ isActive: true }).populate('user');
      for (const schedule of schedules) {
        if (schedule.executedToday >= schedule.maxTradesPerDay) continue;

        // Simulate trade execution
        const isWin = Math.random() > 0.45;
        const pnl = isWin
          ? +(schedule.tradeAmount * (schedule.takeProfitPercent / 100)).toFixed(2)
          : -(schedule.tradeAmount * (schedule.stopLossPercent / 100)).toFixed(2);

        await AutomatedTradeSchedule.findByIdAndUpdate(schedule._id, {
          $inc: {
            executedToday: 1,
            totalExecuted: 1,
            totalPnl: pnl,
            winCount: isWin ? 1 : 0,
            lossCount: isWin ? 0 : 1,
          },
          lastExecutedAt: new Date(),
        });

        // Credit/debit user wallet
        if (schedule.user) {
          await User.findByIdAndUpdate(schedule.user._id, {
            $inc: { walletBalance: pnl, totalEarnings: pnl > 0 ? pnl : 0 },
          });
        }
      }
      console.log(`[Cron] Automated trades executed at ${time}.`);
    } catch (err) {
      console.error('[Cron] Error executing automated trades:', err.message);
    }
  });
});

console.log('[Cron] Scheduled jobs initialized.');
