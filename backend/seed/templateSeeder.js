require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Template = require('../models/Template');
const TemplateCategory = require('../models/TemplateCategory');
const UserTierPackage = require('../models/UserTierPackage');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jblk66ai-trading';

const categories = [
  { name: 'UI/UX Templates', slug: 'ui-ux', description: '500+ modern UI/UX templates', icon: '🎨', sortOrder: 1 },
  { name: 'eCommerce Templates', slug: 'ecommerce', description: '400+ eCommerce templates', icon: '🛒', sortOrder: 2 },
  { name: 'Trading/Finance', slug: 'trading-finance', description: '600+ trading & finance templates', icon: '📈', sortOrder: 3 },
  { name: 'Data Visualization', slug: 'data-visualization', description: '500+ data viz templates', icon: '📊', sortOrder: 4 },
  { name: 'Form Templates', slug: 'forms', description: '400+ form templates', icon: '📋', sortOrder: 5 },
  { name: 'Authentication', slug: 'authentication', description: '250+ auth templates', icon: '🔐', sortOrder: 6 },
  { name: 'Navigation', slug: 'navigation', description: '300+ navigation templates', icon: '🧭', sortOrder: 7 },
  { name: 'Cards & Layouts', slug: 'cards-layouts', description: '400+ card & layout templates', icon: '🃏', sortOrder: 8 },
  { name: 'Mobile Templates', slug: 'mobile', description: '350+ mobile templates', icon: '📱', sortOrder: 9 },
  { name: 'Analytics Dashboards', slug: 'analytics', description: '300+ analytics templates', icon: '📉', sortOrder: 10 },
  { name: 'Admin Panels', slug: 'admin', description: '250+ admin panel templates', icon: '⚙️', sortOrder: 11 },
  { name: 'Colors & Themes', slug: 'themes', description: '200+ color & theme templates', icon: '🎭', sortOrder: 12 },
];

const frameworks = ['react', 'vue', 'angular', 'svelte', 'html', 'solidjs', 'astro', 'remix'];
const uiLibraries = ['tailwind', 'bootstrap', 'material-ui', 'ant-design', 'chakra-ui', 'shadcn', 'custom'];
const designStyles = ['modern', 'glassmorphism', 'neumorphism', 'flat', 'material', 'minimal', 'dark', 'light'];
const colorSchemes = ['dark', 'light', 'colorful', 'monochrome', 'gradient'];
const animationLibs = ['framer-motion', 'react-spring', 'anime.js', 'gsap', 'css-animations', 'none'];

// Template data templates per category
const templateConfigs = [
  {
    category: 'UI/UX Templates',
    templates: [
      'Modern Dashboard', 'Glassmorphism Dashboard', 'Neumorphism Card', 'Flat Design UI',
      'Material Design 3 Layout', 'Dark Mode Interface', 'Light Theme Dashboard',
      'High Contrast UI', 'Gradient Header', 'Minimal Navigation', 'Sidebar Layout',
      'Split Screen Layout', 'Hero Section', 'Feature Cards', 'Testimonial Carousel',
      'Pricing Table', 'Stats Overview', 'Activity Timeline', 'Notification Center',
      'User Profile Card', 'Team Section', 'Contact Section', 'Footer Design',
      'Banner Component', 'Alert System', 'Toast Notifications', 'Modal Dialog',
      'Drawer Navigation', 'Tab Panel', 'Accordion FAQ', 'Progress Tracker',
      'Loading Skeleton', 'Empty State', 'Error Page', 'Success Page',
      'Onboarding Flow', 'Settings Panel', 'Theme Switcher', 'Command Palette',
    ],
  },
  {
    category: 'eCommerce Templates',
    templates: [
      'Product Listing Page', 'Product Detail View', 'Shopping Cart Sidebar', 'Checkout Step 1',
      'Checkout Step 2', 'Order Confirmation', 'Invoice Template', 'Receipt Design',
      'Wishlist Page', 'Payment Form', 'Shipping Form', 'Order History',
      'Product Grid Layout', 'Product List Layout', 'Category Page', 'Search Results',
      'Flash Sale Banner', 'Deal of the Day', 'Related Products', 'Recently Viewed',
      'Bundle Offer Card', 'Gift Card Design', 'Coupon Code', 'Referral Banner',
      'Review Section', 'Rating Stars', 'Q&A Section', 'Store Locator',
      'Track Order Page', 'Return Portal', 'Account Dashboard', 'Loyalty Points',
    ],
  },
  {
    category: 'Trading/Finance',
    templates: [
      'Trading Dashboard', 'Chart Display', 'Portfolio Analytics', 'Real-time Ticker',
      'Market Data View', 'Candlestick Chart', 'Heatmap Display', 'Risk Management',
      'Trade History Table', 'P&L Statement', 'Asset Allocation', 'Performance Metrics',
      'Options Chain', 'Order Book', 'Trade Execution', 'Position Monitor',
      'Futures Dashboard', 'Crypto Portfolio', 'Stock Screener', 'Economic Calendar',
      'Market Overview', 'Sector Analysis', 'Volume Profile', 'Depth Chart',
      'News Feed Trading', 'Alert Manager', 'Strategy Builder', 'Backtest Results',
      'Copy Trading UI', 'Social Trading Feed', 'Signal Provider', 'Bot Config Panel',
      'Leverage Calculator', 'Margin Calculator', 'ROI Calculator', 'Tax Report',
    ],
  },
  {
    category: 'Data Visualization',
    templates: [
      'Line Chart Template', 'Bar Chart Design', 'Pie Chart Layout', 'Donut Chart',
      'Scatter Plot', 'Bubble Chart', 'Area Chart', 'Stacked Chart',
      'Treemap Layout', 'Sunburst Chart', 'Sankey Diagram', 'Network Graph',
      'Gantt Chart', 'Timeline View', 'Calendar Heatmap', 'Waterfall Chart',
      'Funnel Chart', 'Radar Chart', 'Polar Chart', 'Geo Map',
      'Choropleth Map', 'Force-Directed Graph', 'Hierarchy Tree', 'Flow Diagram',
      'KPI Dashboard', 'Metrics Cards', 'Comparison Chart', 'Ranking List',
      'Word Cloud', 'Box Plot', 'Histogram', 'Density Plot',
    ],
  },
  {
    category: 'Form Templates',
    templates: [
      'Login Form', 'Registration Form', 'Contact Form', 'Survey Form',
      'Multi-step Form', 'Dynamic Form Builder', 'Inline Form', 'Modal Form',
      'Search Form', 'Filter Form', 'Payment Form', 'Billing Form',
      'Profile Edit Form', 'Settings Form', 'Feedback Form', 'Report Form',
      'Job Application Form', 'Event Registration', 'Newsletter Signup', 'Quiz Form',
      'Appointment Booking', 'Reservation Form', 'Order Form', 'Quote Request',
      'Support Ticket', 'Bug Report Form', 'Feature Request', 'Onboarding Form',
    ],
  },
  {
    category: 'Authentication',
    templates: [
      'Login Page Modern', 'Signup Page Clean', '2FA Screen', 'Password Reset',
      'Email Verification', 'Biometric Auth UI', 'Magic Link Screen', 'Social Auth',
      'OAuth Login', 'SSO Login', 'Multi-tenant Login', 'Admin Login',
      'Mobile Login', 'Splash Screen Auth', 'PIN Entry', 'Face ID UI',
      'Forgot Password Flow', 'Account Recovery', 'Session Expired', 'Access Denied',
      'Lock Screen', 'Account Suspended', 'Verify Identity', 'Security Check',
    ],
  },
  {
    category: 'Navigation',
    templates: [
      'Sidebar Navigation', 'Top Navigation Bar', 'Tab Navigation', 'Breadcrumb Trail',
      'Mega Menu', 'Dropdown Menu', 'Mobile Navigation', 'Floating Menu',
      'Navbar with Auth', 'Dark Sidebar', 'Collapsible Sidebar', 'Icon Sidebar',
      'Bottom Tab Bar', 'Floating Action', 'Command Menu', 'Search Navigation',
      'Filter Navigation', 'Category Nav', 'Stepper Navigation', 'Wizard Nav',
      'Pagination Component', 'Infinite Scroll', 'Load More Button', 'Back to Top',
    ],
  },
  {
    category: 'Cards & Layouts',
    templates: [
      'Product Card', 'User Card', 'Blog Card', 'News Card',
      'Stat Card', 'Feature Card', 'Testimonial Card', 'Pricing Card',
      'Service Card', 'Portfolio Card', 'Team Member Card', 'Event Card',
      'Grid Layout 3col', 'Grid Layout 4col', 'Masonry Layout', 'Metro Layout',
      'Card with Image Top', 'Card with Side Image', 'Horizontal Card', 'Overlay Card',
      'Flip Card', 'Hover Effect Card', 'Dark Card', 'Glass Card',
      'Shadow Card', 'Bordered Card', 'Colored Card', 'Compact Card',
    ],
  },
  {
    category: 'Mobile Templates',
    templates: [
      'iOS App Home', 'Android Dashboard', 'Bottom Navigation', 'Mobile Settings',
      'Mobile Profile', 'Chat Interface', 'Notifications List', 'Search Mobile',
      'Onboarding Slides', 'Permission Screen', 'Tutorial Overlay', 'Deep Link Screen',
      'Swipeable Cards', 'Pull to Refresh', 'Infinite List', 'Grid Gallery',
      'Media Player', 'Story Viewer', 'Camera UI', 'Map View Mobile',
      'Mobile Form', 'Date Picker Mobile', 'Time Picker', 'Gesture Handler UI',
    ],
  },
  {
    category: 'Analytics Dashboards',
    templates: [
      'KPI Overview', 'Sales Dashboard', 'Marketing Dashboard', 'Finance Dashboard',
      'HR Analytics', 'Product Analytics', 'User Analytics', 'Revenue Dashboard',
      'Conversion Funnel', 'Cohort Analysis', 'Retention Chart', 'Churn Dashboard',
      'Performance Monitor', 'Real-time Dashboard', 'Executive Summary', 'Custom Metrics',
      'A/B Test Results', 'Campaign Dashboard', 'Social Media Analytics', 'SEO Dashboard',
      'Email Analytics', 'App Analytics', 'E-commerce Analytics', 'Support Dashboard',
    ],
  },
  {
    category: 'Admin Panels',
    templates: [
      'User Management Table', 'Settings Panel', 'Moderation Tools', 'Notification Center',
      'Audit Log Viewer', 'System Monitor', 'Config Panel', 'Admin Actions',
      'Role Management', 'Permission Matrix', 'Access Control', 'API Key Manager',
      'Webhook Manager', 'Email Templates', 'CMS Editor', 'Media Library',
      'Database Viewer', 'Cache Manager', 'Log Viewer', 'Error Tracker',
      'Feature Flags', 'AB Test Manager', 'Analytics Admin', 'Report Builder',
    ],
  },
  {
    category: 'Colors & Themes',
    templates: [
      'Ocean Blue Theme', 'Forest Green Theme', 'Sunset Orange Theme', 'Purple Galaxy',
      'Monochrome Light', 'Monochrome Dark', 'Pastel Rainbow', 'Corporate Blue',
      'Red Accent Theme', 'Gold Premium Theme', 'Neon Cyberpunk', 'Soft Lavender',
      'Earth Tones', 'Arctic Ice Theme', 'Desert Sand Theme', 'Emerald Green',
      'Rose Gold Theme', 'Midnight Black', 'Snow White Theme', 'Sky Blue Theme',
    ],
  },
];

function slugify(str, suffix = '') {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + (suffix ? `-${suffix}` : '');
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTemplateCode(title, framework) {
  if (framework === 'react') {
    return `import React from 'react';\n\nexport const ${title.replace(/[^a-zA-Z]/g, '')} = () => {\n  return (\n    <div className="template-container">\n      <h1>${title}</h1>\n    </div>\n  );\n};\n\nexport default ${title.replace(/[^a-zA-Z]/g, '')};`;
  }
  if (framework === 'vue') {
    return `<template>\n  <div class="template-container">\n    <h1>${title}</h1>\n  </div>\n</template>\n\n<script>\nexport default {\n  name: '${title.replace(/[^a-zA-Z]/g, '')}',\n};\n</script>`;
  }
  return `<!-- ${title} -->\n<div class="template-container">\n  <h1>${title}</h1>\n</div>`;
}

async function seedTemplates() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
    console.log('Connected to MongoDB');

    // Seed categories
    const categoryMap = {};
    for (const cat of categories) {
      const existing = await TemplateCategory.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true }
      );
      categoryMap[cat.name] = existing;
    }
    console.log(`Seeded ${categories.length} categories.`);

    // Seed tier packages
    const tierPackages = [
      {
        name: 'Free', slug: 'free', displayName: 'Free', description: 'Get started for free',
        color: '#gray', sortOrder: 0, monthlyPrice: 0, yearlyPrice: 0,
        maxDailyTrades: 3, maxTradingPairs: 2, maxLeverage: 1, automatedTradesPerDay: 0,
        annualInterestRate: 0, referralBonusPercent: 5, promoCodes: 0,
        features: { futuresTradingAllowed: false, advancedAnalyticsAccess: false, apiAccess: false, dedicatedAccountManager: false, prioritySupport: false, templateLibraryAccess: true, advancedTemplates: false },
        benefits: ['3 daily trades', '2 trading pairs', 'Basic templates'],
        limitations: ['No futures trading', 'No advanced analytics', 'No API access'],
      },
      {
        name: 'Basic', slug: 'basic', displayName: 'Basic', description: 'Perfect for beginners',
        color: '#3B82F6', sortOrder: 1, monthlyPrice: 9.99, yearlyPrice: 99.99,
        maxDailyTrades: 10, maxTradingPairs: 5, maxLeverage: 1, automatedTradesPerDay: 0,
        annualInterestRate: 2, referralBonusPercent: 5, promoCodes: 1,
        features: { futuresTradingAllowed: false, advancedAnalyticsAccess: false, apiAccess: false, dedicatedAccountManager: false, prioritySupport: false, templateLibraryAccess: true, advancedTemplates: false },
        benefits: ['10 daily trades', '5 trading pairs', '2% annual interest', 'Email support', 'Template library'],
        limitations: ['No futures trading', 'No advanced analytics', 'No API access'],
      },
      {
        name: 'Advanced', slug: 'advanced', displayName: 'Advanced', description: 'For serious traders',
        color: '#8B5CF6', sortOrder: 2, monthlyPrice: 49.99, yearlyPrice: 499.99,
        maxDailyTrades: 50, maxTradingPairs: 25, maxLeverage: 5, automatedTradesPerDay: 3,
        annualInterestRate: 5, referralBonusPercent: 10, promoCodes: 2,
        features: { futuresTradingAllowed: true, advancedAnalyticsAccess: true, apiAccess: false, dedicatedAccountManager: false, prioritySupport: true, portfolioRebalancing: true, backtestingAccess: true, templateLibraryAccess: true, advancedTemplates: true, customTradingRules: true, riskManagementSuite: true, aiSignalsAccess: true },
        benefits: ['50 daily trades', '25 trading pairs', '5x leverage', '5% annual interest', 'Priority support', 'Advanced templates'],
        limitations: ['No dedicated account manager', 'No API access'],
      },
      {
        name: 'Premium', slug: 'premium', displayName: 'Premium', description: 'Ultimate trading power',
        color: '#F59E0B', sortOrder: 3, monthlyPrice: 199.99, yearlyPrice: 1999.99,
        maxDailyTrades: 500, maxTradingPairs: 100, maxLeverage: 20, automatedTradesPerDay: 5,
        annualInterestRate: 10, referralBonusPercent: 20, promoCodes: 5,
        features: { futuresTradingAllowed: true, advancedAnalyticsAccess: true, apiAccess: true, dedicatedAccountManager: true, prioritySupport: true, portfolioRebalancing: true, backtestingAccess: true, multiAccountManagement: true, whiteLabelSolutions: true, botOptimizationAccess: true, aiSignalsAccess: true, riskManagementSuite: true, customTradingRules: true, templateLibraryAccess: true, advancedTemplates: true },
        benefits: ['500 daily trades', '100+ trading pairs', '20x leverage', '10% annual interest', '24/7 support', 'Dedicated account manager', 'Full API access', 'All templates'],
        limitations: [],
        isFeatured: true,
      },
    ];

    for (const tp of tierPackages) {
      await UserTierPackage.findOneAndUpdate({ slug: tp.slug }, tp, { upsert: true, new: true });
    }
    console.log('Seeded tier packages.');

    // Seed templates
    let totalSeeded = 0;
    const batchSize = 100;
    const allTemplates = [];

    for (const config of templateConfigs) {
      const category = categoryMap[config.category];
      if (!category) continue;

      // Generate multiple variants per template name to reach high numbers
      const variantsPerTemplate = Math.ceil(5000 / (templateConfigs.reduce((a, c) => a + c.templates.length, 0)));

      for (const templateName of config.templates) {
        for (let v = 1; v <= variantsPerTemplate; v++) {
          const framework = randomItem(frameworks);
          const uiLib = randomItem(uiLibraries);
          const style = randomItem(designStyles);
          const colorScheme = randomItem(colorSchemes);
          const suffix = v > 1 ? `-v${v}` : '';
          const slugBase = slugify(templateName);
          const slug = `${slugBase}${suffix}-${category.slug}-${Math.random().toString(36).substring(2, 6)}`;

          allTemplates.push({
            title: v > 1 ? `${templateName} v${v}` : templateName,
            slug,
            description: `A ${style} ${templateName} template built with ${framework} and ${uiLib}. Fully responsive, accessible, and optimized for performance.`,
            shortDescription: `${style} ${templateName} - ${framework}/${uiLib}`,
            category: category._id,
            categoryName: config.category,
            subcategory: templateName,
            tags: [framework, uiLib, style, colorScheme, config.category.toLowerCase()],
            framework,
            uiLibrary: uiLib,
            animationLibrary: randomItem(animationLibs),
            designStyle: style,
            colorScheme,
            responsive: true,
            accessibility: Math.random() > 0.2,
            thumbnailUrl: `https://picsum.photos/seed/${slugBase}${v}/400/300`,
            previewImages: [
              `https://picsum.photos/seed/${slugBase}${v}a/800/600`,
              `https://picsum.photos/seed/${slugBase}${v}b/800/600`,
              `https://picsum.photos/seed/${slugBase}${v}c/800/600`,
            ],
            componentCode: generateTemplateCode(templateName, framework),
            version: '1.0.0',
            authorName: 'JBLK66 Team',
            dependencies: [
              { name: framework, version: 'latest' },
              { name: uiLib, version: 'latest' },
            ],
            codeQuality: Math.floor(75 + Math.random() * 25),
            performanceScore: Math.floor(70 + Math.random() * 30),
            accessibilityScore: Math.floor(70 + Math.random() * 30),
            downloadCount: Math.floor(Math.random() * 5000),
            viewCount: Math.floor(Math.random() * 20000),
            averageRating: +(3 + Math.random() * 2).toFixed(1),
            reviewCount: Math.floor(Math.random() * 200),
            isFree: Math.random() > 0.3,
            price: Math.random() > 0.3 ? 0 : +(Math.random() * 49).toFixed(2),
            isFeatured: Math.random() > 0.85,
            isPublished: true,
            isTrending: Math.random() > 0.8,
            trendingScore: Math.floor(Math.random() * 100),
            crossBrowserTested: true,
            mobileResponsive: true,
            securityReviewed: Math.random() > 0.5,
          });
        }
      }
    }

    // Insert in batches
    for (let i = 0; i < allTemplates.length; i += batchSize) {
      const batch = allTemplates.slice(i, i + batchSize);
      await Template.insertMany(batch, { ordered: false });
      totalSeeded += batch.length;
      process.stdout.write(`\rSeeded ${totalSeeded} templates...`);
    }

    console.log(`\n✅ Seeded ${totalSeeded} templates across ${categories.length} categories.`);

    // Update category template counts
    for (const cat of Object.values(categoryMap)) {
      const count = await Template.countDocuments({ category: cat._id });
      await TemplateCategory.findByIdAndUpdate(cat._id, { templateCount: count });
    }

    console.log('✅ Category counts updated.');
    process.exit(0);
  } catch (err) {
    console.error('Seeder error:', err);
    process.exit(1);
  }
}

seedTemplates();
