const StakingPool = require('../models/StakingPool');

/**
 * Seeds the default 6 staking pools defined in the specification.
 * Runs only if no pools exist in the database.
 */
async function seedStakingPools() {
  const count = await StakingPool.countDocuments();
  if (count > 0) return;

  const pools = [
    {
      name: 'Standard BTC',
      description: 'Entry-level Bitcoin staking pool with stable yields and very low risk.',
      blockchain: 'Bitcoin',
      minimumStake: 0.001,
      maximumStake: 10,
      annualYieldMin: 8,
      annualYieldMax: 12,
      lockPeriodOptions: [7, 30, 60, 90, 180, 365],
      fee: 0.5,
      riskLevel: 'Very Low',
      capacity: 200,
      tier: 'Starter',
      earlyWithdrawalFee: 5,
    },
    {
      name: 'Premium BTC',
      description: 'Advanced Bitcoin staking with priority processing and API access.',
      blockchain: 'Bitcoin',
      minimumStake: 0.01,
      maximumStake: 20,
      annualYieldMin: 12,
      annualYieldMax: 16,
      lockPeriodOptions: [14, 30, 60, 90, 180, 365],
      fee: 1,
      riskLevel: 'Low',
      capacity: 100,
      tier: 'Advanced',
      earlyWithdrawalFee: 2,
    },
    {
      name: 'Elite BTC',
      description: 'Professional staking with dedicated support and yield optimization.',
      blockchain: 'Bitcoin',
      minimumStake: 0.1,
      maximumStake: 50,
      annualYieldMin: 16,
      annualYieldMax: 20,
      lockPeriodOptions: [30, 60, 90, 180, 365],
      fee: 1.5,
      riskLevel: 'Low-Medium',
      capacity: 50,
      tier: 'Professional',
      earlyWithdrawalFee: 1,
    },
    {
      name: 'Institutional BTC',
      description: 'Elite institutional-grade staking with personal account managers and daily payouts.',
      blockchain: 'Bitcoin',
      minimumStake: 1.0,
      maximumStake: 100,
      annualYieldMin: 20,
      annualYieldMax: 25,
      lockPeriodOptions: [60, 90, 180, 365],
      fee: 2,
      riskLevel: 'Medium',
      capacity: 20,
      tier: 'Elite',
      earlyWithdrawalFee: 0,
    },
    {
      name: 'DeFi Yield',
      description: 'Multi-chain DeFi staking with highest yields for risk-tolerant investors.',
      blockchain: 'Multiple',
      minimumStake: 0.01,
      maximumStake: 25,
      annualYieldMin: 25,
      annualYieldMax: 50,
      lockPeriodOptions: [90, 180, 365],
      fee: 3,
      riskLevel: 'High',
      capacity: 50,
      tier: 'DeFi',
      earlyWithdrawalFee: 5,
    },
    {
      name: 'Liquid BTC',
      description: 'No lock-up liquid staking — withdraw anytime and receive liquid staking tokens.',
      blockchain: 'Bitcoin/Ethereum',
      minimumStake: 0.001,
      maximumStake: 15,
      annualYieldMin: 10,
      annualYieldMax: 15,
      lockPeriodOptions: [7, 30, 60, 90, 180, 365],
      fee: 1,
      riskLevel: 'Very Low',
      capacity: 300,
      tier: 'Liquid',
      isLiquid: true,
      earlyWithdrawalFee: 0,
    },
  ];

  await StakingPool.insertMany(pools);
  console.log('✅ Default staking pools seeded');
}

module.exports = { seedStakingPools };
