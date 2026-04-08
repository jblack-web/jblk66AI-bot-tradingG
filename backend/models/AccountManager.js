const mongoose = require('mongoose');

const accountManagerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  displayName: { type: String, required: true },
  bio: String,
  specialization: [String],
  profileImage: String,
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  maxClients: { type: Number, default: 20 },
  currentClientCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  responseTime: { type: String, default: '< 24 hours' },
  communicationChannels: [{ type: String, enum: ['email', 'phone', 'whatsapp', 'telegram', 'video'] }],
  languages: [String],
  yearsExperience: Number,
}, { timestamps: true });

module.exports = mongoose.model('AccountManager', accountManagerSchema);
