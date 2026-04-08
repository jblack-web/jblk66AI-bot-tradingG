const mongoose = require('mongoose');

const templateCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  icon: String,
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'TemplateCategory' },
  sortOrder: { type: Number, default: 0 },
  templateCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('TemplateCategory', templateCategorySchema);
