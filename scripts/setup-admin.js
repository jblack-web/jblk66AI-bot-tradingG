#!/usr/bin/env node
/**
 * scripts/setup-admin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Post-deploy script: creates the root/admin account and seeds required data.
 *
 * Usage (run once after first deployment):
 *   NODE_ENV=production MONGO_URI=... JWT_SECRET=... \
 *     ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=S3cret! \
 *     node scripts/setup-admin.js
 *
 * The script is idempotent – safe to re-run; it skips creation if the admin
 * user already exists.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jblk66ai';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@jblk66ai.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('❌  ADMIN_PASSWORD environment variable is required.');
  process.exit(1);
}

async function main() {
  console.log('🔌  Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅  Connected.');

  // Dynamically load the User model (works with both backend layouts)
  let User;
  try {
    User = require('../backend/models/User');
  } catch {
    User = require('../models/User');
  }

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`ℹ️   Admin account already exists for ${ADMIN_EMAIL} – skipping creation.`);
    await mongoose.disconnect();
    return;
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

  await User.create({
    email: ADMIN_EMAIL,
    password: passwordHash,
    role: 'admin',
    isVerified: true,
    isActive: true,
    firstName: 'Admin',
    lastName: 'Root',
    createdAt: new Date(),
  });

  console.log(`✅  Admin account created: ${ADMIN_EMAIL}`);

  // Seed staking pools if the helper exists
  try {
    const { seedStakingPools } = require('../utils/seedPools');
    await seedStakingPools();
    console.log('✅  Staking pools seeded.');
  } catch {
    console.log('ℹ️   Staking pool seeder not found – skipping.');
  }

  await mongoose.disconnect();
  console.log('🏁  Setup complete.');
}

main().catch((err) => {
  console.error('❌  Setup failed:', err.message);
  process.exit(1);
});
