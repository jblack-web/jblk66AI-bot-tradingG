require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const MiningRig = require('../models/MiningRig');

const rigs = [
  {
    name: 'Starter Miner S1',
    description: 'Perfect entry-level mining rig for beginners. Low barrier to entry with reliable daily earnings.',
    tier: 'entry',
    hashRate: 100,
    power: 3500,
    dailyEarnings: { min: 0.00008, max: 0.00014 },
    rentalCostPerTHPerDay: 0.30,
    contractOptions: [
      { duration: 1, unit: 'month', discount: 0 },
      { duration: 3, unit: 'month', discount: 5 },
      { duration: 6, unit: 'month', discount: 10 },
      { duration: 1, unit: 'year', discount: 20 },
    ],
    poolOptions: ['Antpool', 'F2Pool', 'Slush Pool', 'ViaBTC'],
    location: 'Texas, USA',
    dataCenter: 'Alpha DC-01',
    uptime: 99.2,
    isAvailable: true,
    totalUnits: 50,
    availableUnits: 50,
    algorithm: 'SHA-256',
    coin: 'BTC',
    specifications: new Map([
      ['Manufacturer', 'Bitmain'],
      ['Model', 'Antminer S19j Pro'],
      ['Efficiency', '29.5 J/TH'],
      ['Cooling', 'Air Cooled'],
    ]),
  },
  {
    name: 'Pro Miner P5',
    description: 'Professional-grade mining rig delivering 500 TH/s. Optimal balance between cost and performance for serious miners.',
    tier: 'professional',
    hashRate: 500,
    power: 15000,
    dailyEarnings: { min: 0.00042, max: 0.00068 },
    rentalCostPerTHPerDay: 0.25,
    contractOptions: [
      { duration: 1, unit: 'month', discount: 0 },
      { duration: 3, unit: 'month', discount: 7 },
      { duration: 6, unit: 'month', discount: 12 },
      { duration: 1, unit: 'year', discount: 22 },
    ],
    poolOptions: ['Antpool', 'F2Pool', 'Slush Pool', 'ViaBTC', 'Poolin', 'BTC.com'],
    location: 'Nevada, USA',
    dataCenter: 'Beta DC-05',
    uptime: 99.5,
    isAvailable: true,
    totalUnits: 30,
    availableUnits: 30,
    algorithm: 'SHA-256',
    coin: 'BTC',
    specifications: new Map([
      ['Manufacturer', 'MicroBT'],
      ['Model', 'Whatsminer M50S'],
      ['Efficiency', '26 J/TH'],
      ['Cooling', 'Immersion Cooled'],
    ]),
  },
  {
    name: 'Enterprise X10',
    description: 'Enterprise-class mining array delivering 2000 TH/s. Dedicated support, higher efficiency, and maximized uptime.',
    tier: 'enterprise',
    hashRate: 2000,
    power: 56000,
    dailyEarnings: { min: 0.0016, max: 0.0028 },
    rentalCostPerTHPerDay: 0.20,
    contractOptions: [
      { duration: 3, unit: 'month', discount: 5 },
      { duration: 6, unit: 'month', discount: 15 },
      { duration: 1, unit: 'year', discount: 25 },
      { duration: 2, unit: 'year', discount: 35 },
    ],
    poolOptions: ['Antpool', 'F2Pool', 'Slush Pool', 'ViaBTC', 'Poolin', 'BTC.com', 'Luxor', 'MARA Pool'],
    location: 'Wyoming, USA',
    dataCenter: 'Gamma DC-10',
    uptime: 99.7,
    isAvailable: true,
    totalUnits: 15,
    availableUnits: 15,
    algorithm: 'SHA-256',
    coin: 'BTC',
    specifications: new Map([
      ['Manufacturer', 'Canaan'],
      ['Model', 'AvalonMiner A1366'],
      ['Efficiency', '21.5 J/TH'],
      ['Cooling', 'Liquid Cooled'],
      ['Redundancy', 'Dual PSU'],
    ]),
  },
  {
    name: 'Industrial Mega I50',
    description: 'Massive industrial-scale mining operation. 10,000 TH/s of raw power for institutional investors and high-volume miners.',
    tier: 'industrial',
    hashRate: 10000,
    power: 250000,
    dailyEarnings: { min: 0.0082, max: 0.014 },
    rentalCostPerTHPerDay: 0.15,
    contractOptions: [
      { duration: 6, unit: 'month', discount: 10 },
      { duration: 1, unit: 'year', discount: 30 },
      { duration: 2, unit: 'year', discount: 45 },
    ],
    poolOptions: ['Antpool', 'F2Pool', 'Slush Pool', 'ViaBTC', 'Poolin', 'BTC.com', 'Luxor', 'MARA Pool', 'Foundry USA'],
    location: 'Montana, USA',
    dataCenter: 'Omega Industrial Complex',
    uptime: 99.9,
    isAvailable: true,
    totalUnits: 5,
    availableUnits: 5,
    algorithm: 'SHA-256',
    coin: 'BTC',
    specifications: new Map([
      ['Manufacturer', 'Multiple OEMs'],
      ['Efficiency', '19 J/TH'],
      ['Cooling', 'Immersion + Hydro Cooling'],
      ['Redundancy', 'Triple Redundant Power'],
      ['Connectivity', '10 Gbps dedicated fiber'],
      ['Security', 'Biometric + 24/7 guards'],
    ]),
  },
];

const seed = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jblk66ai';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await MiningRig.deleteMany({});
  const inserted = await MiningRig.insertMany(rigs);
  console.log(`Seeded ${inserted.length} mining rigs`);

  await mongoose.disconnect();
  console.log('Done');
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
