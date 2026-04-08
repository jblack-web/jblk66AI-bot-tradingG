const mongoose = require('mongoose');

const automatedTradeScheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  isActive: { type: Boolean, default: true },
  tradingPair: { type: String, default: 'BTC/USDT' },
  tradeType: { type: String, enum: ['spot', 'futures'], default: 'spot' },
  strategy: { type: String, enum: ['momentum', 'mean_reversion', 'trend_following', 'ai_signals'], default: 'ai_signals' },
  tradeAmount: { type: Number, required: true },
  stopLossPercent: { type: Number, default: 2 },
  takeProfitPercent: { type: Number, default: 3 },
  scheduledTimes: [String],
  maxTradesPerDay: { type: Number, default: 5 },
  executedToday: { type: Number, default: 0 },
  totalExecuted: { type: Number, default: 0 },
  totalPnl: { type: Number, default: 0 },
  winCount: { type: Number, default: 0 },
  lossCount: { type: Number, default: 0 },
  lastExecutedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('AutomatedTradeSchedule', automatedTradeScheduleSchema);
