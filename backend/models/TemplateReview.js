const mongoose = require('mongoose');

const templateReviewSchema = new mongoose.Schema({
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  comment: String,
  isVerifiedPurchase: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 },
  reported: { type: Boolean, default: false },
}, { timestamps: true });

templateReviewSchema.index({ template: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('TemplateReview', templateReviewSchema);
