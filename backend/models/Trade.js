const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['options', 'futures', 'spot'],
      required: true,
    },
    asset: {
      type: String,
      enum: ['BTC', 'ETH', 'GOLD', 'SILVER'],
      required: true,
    },
    direction: {
      type: String,
      enum: ['call', 'put', 'long', 'short'],
      required: true,
    },
    amount: { type: Number, required: true },
    leverage: { type: Number, default: 1 },
    strikePrice: { type: Number },
    expiryDate: { type: Date },
    entryPrice: { type: Number },
    exitPrice: { type: Number },
    status: {
      type: String,
      enum: ['open', 'closed', 'expired', 'cancelled'],
      default: 'open',
    },
    pnl: { type: Number },
    fee: { type: Number },
    contractSize: { type: Number },
    margin: { type: Number },
    stopLoss: { type: Number },
    takeProfit: { type: Number },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trade', tradeSchema);
