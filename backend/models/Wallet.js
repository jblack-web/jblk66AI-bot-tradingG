const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['deposit', 'withdrawal', 'send', 'receive', 'mining_earning', 'purchase', 'refund'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, uppercase: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'rejected'], default: 'pending' },
  address: { type: String, default: '' },
  txHash: { type: String, default: '' },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  processedAt: { type: Date, default: null },
});

const balanceSchema = {
  BTC: { type: Number, default: 0 },
  ETH: { type: Number, default: 0 },
  LTC: { type: Number, default: 0 },
  XMR: { type: Number, default: 0 },
  USDT: { type: Number, default: 0 },
  USDC: { type: Number, default: 0 },
  USD: { type: Number, default: 0 },
};

const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balances: { type: balanceSchema, default: () => ({}) },
    pendingBalance: { type: balanceSchema, default: () => ({}) },
    withdrawMode: { type: String, enum: ['manual', 'auto'], default: 'manual' },
    autoWithdrawThreshold: { type: Number, default: 0 },
    autoWithdrawAddress: { type: String, default: '' },
    transactions: { type: [transactionSchema], default: [] },
    depositAddresses: {
      BTC: { type: String, default: '' },
      ETH: { type: String, default: '' },
      LTC: { type: String, default: '' },
      XMR: { type: String, default: '' },
      USDT: { type: String, default: '' },
      USDC: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);
