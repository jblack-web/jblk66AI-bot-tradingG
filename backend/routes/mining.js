const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getRigs, getRig, rentRig, getMyContracts, getContract,
  pauseContract, resumeContract, cancelContract,
  getDashboard, getEarnings, calculateEarnings, updatePool,
} = require('../controllers/miningController');

// Public rig browsing
router.get('/rigs', getRigs);
router.get('/rigs/:id', getRig);

// Auth required
router.use(protect);

router.post('/rent', rentRig);
router.get('/contracts', getMyContracts);
router.get('/contracts/:id', getContract);
router.put('/contracts/:id/pause', pauseContract);
router.put('/contracts/:id/resume', resumeContract);
router.delete('/contracts/:id', cancelContract);
router.get('/dashboard', getDashboard);
router.get('/earnings', getEarnings);
router.post('/calculate', calculateEarnings);
router.put('/contracts/:id/pool', updatePool);

module.exports = router;
