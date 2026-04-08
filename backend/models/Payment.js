const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Parties
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderEmail: String,
  receiverEmail: String,
  receiverWalletAddress: String,

  // Transaction details
  type: {
    type: String,
    enum: ['send', 'receive', 'deposit', 'withdrawal', 'bonus', 'referral', 'subscription', 'fee', 'refund'],
    required: true,
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  cryptoCurrency: { type: String, enum: ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'ADA', 'MATIC', null] },
  cryptoAmount: Number,
  exchangeRate: Number,

  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
  },

  // Fees
  fee: { type: Number, default: 0 },
  networkFee: { type: Number, default: 0 },
  totalAmount: Number,

  // Reference
  transactionId: { type: String, unique: true, sparse: true },
  externalTransactionId: String,
  walletAddress: String,
  blockchainHash: String,
  network: String,

  // Payment gateway
  paymentMethod: {
    type: String,
    enum: ['wallet', 'crypto', 'bank_transfer', 'card', 'paypal', 'stripe', 'manual'],
    default: 'wallet',
  },
  paymentGateway: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,

  // Notes
  description: String,
  note: String,
  adminNote: String,

  // Processing
  processedAt: Date,
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,

  // Metadata
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

paymentSchema.index({ sender: 1, createdAt: -1 });
paymentSchema.index({ receiver: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
