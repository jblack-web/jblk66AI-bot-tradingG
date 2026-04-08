const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  shortDescription: String,

  // Classification
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'TemplateCategory', required: true },
  categoryName: String,
  subcategory: String,
  tags: [String],

  // Technologies
  framework: {
    type: String,
    enum: ['react', 'vue', 'angular', 'svelte', 'solidjs', 'astro', 'remix', 'flutter', 'html', 'other'],
    default: 'react',
  },
  uiLibrary: {
    type: String,
    enum: ['tailwind', 'bootstrap', 'material-ui', 'ant-design', 'chakra-ui', 'shadcn', 'headless-ui', 'radix-ui', 'custom', 'none'],
    default: 'tailwind',
  },
  animationLibrary: { type: String },
  designStyle: {
    type: String,
    enum: ['modern', 'glassmorphism', 'neumorphism', 'flat', 'material', 'minimal', 'dark', 'light', 'high-contrast'],
    default: 'modern',
  },
  colorScheme: { type: String, enum: ['dark', 'light', 'colorful', 'monochrome', 'gradient'], default: 'light' },
  responsive: { type: Boolean, default: true },
  accessibility: { type: Boolean, default: true },

  // Media
  previewImages: [String],
  thumbnailUrl: String,
  demoUrl: String,
  videoUrl: String,

  // Code
  sourceCode: String,
  htmlCode: String,
  cssCode: String,
  jsCode: String,
  componentCode: String,

  // Metadata
  version: { type: String, default: '1.0.0' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: String,
  dependencies: [{ name: String, version: String }],
  installCommand: String,
  documentationUrl: String,

  // Quality
  codeQuality: { type: Number, min: 0, max: 100, default: 80 },
  performanceScore: { type: Number, min: 0, max: 100, default: 80 },
  accessibilityScore: { type: Number, min: 0, max: 100, default: 80 },
  seoScore: { type: Number, min: 0, max: 100, default: 80 },
  crossBrowserTested: { type: Boolean, default: false },
  mobileResponsive: { type: Boolean, default: true },
  securityReviewed: { type: Boolean, default: false },

  // Analytics
  downloadCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  usageCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },

  // Marketplace
  isFree: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  isTrending: { type: Boolean, default: false },
  trendingScore: { type: Number, default: 0 },

  // Version history
  changelog: [{
    version: String,
    date: Date,
    changes: [String],
    breaking: Boolean,
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  indexes: [
    { title: 'text', description: 'text', tags: 'text' },
  ],
});

// Text index for full-text search
templateSchema.index({ title: 'text', description: 'text', tags: 'text', shortDescription: 'text' });
templateSchema.index({ category: 1, isPublished: 1 });
templateSchema.index({ framework: 1, uiLibrary: 1 });
templateSchema.index({ downloadCount: -1 });
templateSchema.index({ averageRating: -1 });
templateSchema.index({ createdAt: -1 });
templateSchema.index({ trendingScore: -1 });

module.exports = mongoose.model('Template', templateSchema);
