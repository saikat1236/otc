import express from 'express';
import { DB, isMongoConnected } from '../db.js';

const router = express.Router();

// System status & DB mode
router.get('/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    dbMode: isMongoConnected ? 'MongoDB (Cluster/Local)' : 'High-Performance In-Memory (Zero Downtime)',
    timestamp: new Date().toISOString()
  });
});

// Fetch user profile & balance
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await DB.getUser(req.params.userId);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Deposit balance
router.post('/user/deposit', async (req, res) => {
  try {
    const { userId, amount, isDemo = true } = req.body;
    const numAmount = Number(amount);
    if (!userId || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid deposit amount' });
    }
    const user = await DB.updateUserBalance(userId, numAmount, isDemo);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset balance to demo starting default
router.post('/user/reset', async (req, res) => {
  try {
    const { userId, isDemo = true } = req.body;
    const user = await DB.setUserBalance(userId, isDemo ? 10000.00 : 9379.63, isDemo);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trade history
router.get('/trades/:userId', async (req, res) => {
  try {
    const trades = await DB.getTrades(req.params.userId, 40);
    res.json({ success: true, trades });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
