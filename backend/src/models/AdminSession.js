const mongoose = require('mongoose');

const adminSessionSchema = new mongoose.Schema(
  {
    adminId: { type: String, ref: 'AdminUser', required: true },
    token: { type: String, required: true },
    refreshToken: { type: String, required: true },
    deviceFingerprint: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    location: { type: String },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

adminSessionSchema.index({ adminId: 1, isActive: 1 });
adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AdminSession', adminSessionSchema);
