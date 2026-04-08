const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['mining_equipment', 'hardware', 'educational', 'software', 'merchandise', 'premium_services', 'bundles', 'featured'],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: null },
    images: [{ type: String }],
    inventory: { type: Number, default: 0, min: 0 },
    stockLevel: { type: String, enum: ['in_stock', 'low_stock', 'out_of_stock'], default: 'in_stock' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    specifications: { type: Map, of: String, default: {} },
    tags: [{ type: String }],
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    slug: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  }
  if (this.inventory === 0) this.stockLevel = 'out_of_stock';
  else if (this.inventory <= 5) this.stockLevel = 'low_stock';
  else this.stockLevel = 'in_stock';
  next();
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
