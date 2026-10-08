import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DB, isMongoConnected } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'otc_super_secret_jwt_key_2026';

// Middleware to authenticate admin via PIN or token
const adminAuth = async (req, res, next) => {
  const pin = req.headers['x-admin-pin'] || req.query.pin;
  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (pin === '8888') {
    return next();
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'admin') {
        req.adminUser = decoded;
        return next();
      }
    } catch (e) {
      // Invalid token
    }
  }

  return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin PIN or Token' });
};

// ── 1. System Status ──
router.get('/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    dbMode: isMongoConnected ? 'MongoDB (Cluster/Atlas)' : 'High-Performance In-Memory (Zero Downtime)',
    timestamp: new Date().toISOString()
  });
});

// ── 2. Multi-User Authentication ──
router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = (email || `${cleanUsername}@otc.trade`).trim().toLowerCase();

    // Check if user already exists
    const existing = await DB.getUserByEmailOrUsername(cleanUsername) || await DB.getUserByEmailOrUsername(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username or email already registered' });
    }

    const userId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const hashedPassword = bcrypt.hashSync(password, 8);

    const newUser = await DB.createUser({
      userId,
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: 'user',
      balance: 0.00,
      demoBalance: 10000.00
    });

    const token = jwt.sign(
      { userId: newUser.userId, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        userId: newUser.userId,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        balance: newUser.balance,
        demoBalance: newUser.demoBalance
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Email/Username and password required' });
    }

    const cleanIdentifier = identifier.trim();
    let user = await DB.getUserByEmailOrUsername(cleanIdentifier);

    // If identifier is admin@otc.trade and not found, auto-fetch admin_root
    if (!user && (cleanIdentifier === 'admin@otc.trade' || cleanIdentifier === 'admin')) {
      user = await DB.getUser('admin_root');
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, error: 'Your account has been suspended by the platform administrator' });
    }

    const isMatch = bcrypt.compareSync(password, user.password || '');
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid password credentials' });
    }

    const token = jwt.sign(
      { userId: user.userId, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        demoBalance: user.demoBalance
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user by token or userId
router.get('/auth/me', async (req, res) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    let uid = req.query.userId;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        uid = decoded.userId;
      } catch (e) {
        // Fall back to query param
      }
    }

    if (!uid) {
      return res.status(400).json({ success: false, error: 'User identifier required' });
    }

    const user = await DB.getUser(uid);
    res.json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        demoBalance: user.demoBalance,
        isBanned: user.isBanned
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 3. Legacy & User Profile Routes ──
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await DB.getUser(req.params.userId);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

router.post('/user/reset', async (req, res) => {
  try {
    const { userId, isDemo = true } = req.body;
    const user = await DB.setUserBalance(userId, isDemo ? 10000.00 : 0.00, isDemo);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/trades/:userId', async (req, res) => {
  try {
    const trades = await DB.getTrades(req.params.userId, 40);
    res.json({ success: true, trades });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 4. Payment Management (Deposits & Withdrawals) ──
router.post('/payments/deposit', async (req, res) => {
  try {
    const { userId, amount, method, reference } = req.body;
    const numAmount = Number(amount);
    if (!userId || isNaN(numAmount) || numAmount < 5) {
      return res.status(400).json({ success: false, error: 'Minimum deposit is $5.00' });
    }

    const user = await DB.getUser(userId);
    const payment = await DB.createPayment({
      paymentId: 'DEP-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 900 + 100),
      userId,
      username: user.username,
      type: 'DEPOSIT',
      amount: numAmount,
      method: method || 'USDT_TRC20',
      reference: reference || 'TX-' + Date.now(),
      status: 'PENDING'
    });

    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/payments/withdraw', async (req, res) => {
  try {
    const { userId, amount, method, address } = req.body;
    const numAmount = Number(amount);
    if (!userId || isNaN(numAmount) || numAmount < 10) {
      return res.status(400).json({ success: false, error: 'Minimum withdrawal is $10.00' });
    }

    const user = await DB.getUser(userId);
    if (user.balance < numAmount) {
      return res.status(400).json({ success: false, error: 'Insufficient real balance' });
    }

    // Reserve funds immediately
    await DB.updateUserBalance(userId, -numAmount, false);

    const payment = await DB.createPayment({
      paymentId: 'WTH-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 900 + 100),
      userId,
      username: user.username,
      type: 'WITHDRAWAL',
      amount: numAmount,
      method: method || 'USDT_TRC20',
      reference: address || 'ADDR-' + Date.now(),
      status: 'PENDING'
    });

    const updatedUser = await DB.getUser(userId);
    res.json({ success: true, payment, newBalance: updatedUser.balance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/payments/my/:userId', async (req, res) => {
  try {
    const payments = await DB.getPayments(req.params.userId);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── 5. Full Admin Panel Management (Game, Users, Payments) ──
// Platform Stats
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const users = await DB.getAllUsers();
    const payments = await DB.getPayments();
    const settings = await DB.getSettings();
    const engine = req.app.get('engine');

    const totalUsers = users.length;
    const totalDeposited = payments
      .filter(p => p.type === 'DEPOSIT' && p.status === 'APPROVED')
      .reduce((acc, p) => acc + p.amount, 0);
    const totalWithdrawn = payments
      .filter(p => p.type === 'WITHDRAWAL' && p.status === 'APPROVED')
      .reduce((acc, p) => acc + p.amount, 0);
    const pendingDeposits = payments.filter(p => p.type === 'DEPOSIT' && p.status === 'PENDING').length;
    const pendingWithdrawals = payments.filter(p => p.type === 'WITHDRAWAL' && p.status === 'PENDING').length;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalDeposited: +totalDeposited.toFixed(2),
        totalWithdrawn: +totalWithdrawn.toFixed(2),
        netProfit: +(totalDeposited - totalWithdrawn).toFixed(2),
        pendingDeposits,
        pendingWithdrawals,
        algoMode: engine ? engine.algoMode : settings.algoMode,
        botTradingEnabled: engine ? engine.botTradingEnabled : settings.botTradingEnabled,
        currentRound: engine ? engine.getRoundPublicState() : null,
        activeTradesCount: engine ? engine.activeTrades.length : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// User Management
router.get('/admin/users', adminAuth, async (req, res) => {
  try {
    const users = await DB.getAllUsers();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admin/user/:userId/balance', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, isDemo = false, action = 'ADD' } = req.body;
    const numAmount = Number(amount);

    if (isNaN(numAmount)) {
      return res.status(400).json({ success: false, error: 'Invalid balance amount' });
    }

    let updatedUser;
    if (action === 'SET') {
      updatedUser = await DB.setUserBalance(userId, numAmount, Boolean(isDemo));
    } else {
      updatedUser = await DB.updateUserBalance(userId, numAmount, Boolean(isDemo));
    }

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admin/user/:userId/ban', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBanned } = req.body;
    const user = await DB.updateUser(userId, { isBanned: Boolean(isBanned) });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Payments Desk (Cashier approval/rejection)
router.get('/admin/payments', adminAuth, async (req, res) => {
  try {
    const payments = await DB.getPayments();
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admin/payment/:paymentId/action', adminAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { action, note = '' } = req.body; // 'APPROVE' | 'REJECT'

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Action must be APPROVE or REJECT' });
    }

    const payments = await DB.getPayments();
    const payment = payments.find(p => p.paymentId === paymentId || p._id?.toString() === paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: `Payment already settled as ${payment.status}` });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    if (payment.type === 'DEPOSIT') {
      if (action === 'APPROVE') {
        // Credit Real Money to user account
        await DB.updateUserBalance(payment.userId, payment.amount, false);
      }
    } else if (payment.type === 'WITHDRAWAL') {
      if (action === 'REJECT') {
        // Refund reserved funds back to real balance
        await DB.updateUserBalance(payment.userId, payment.amount, false);
      }
    }

    const updatedPayment = await DB.updatePayment(paymentId, {
      status: newStatus,
      adminNote: note
    });

    res.json({ success: true, payment: updatedPayment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Game & Algorithm Settings Management
router.get('/admin/settings', adminAuth, async (req, res) => {
  try {
    const settings = await DB.getSettings();
    const engine = req.app.get('engine');
    if (engine) {
      settings.algoMode = engine.algoMode;
      settings.botTradingEnabled = engine.botTradingEnabled;
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admin/settings', adminAuth, async (req, res) => {
  try {
    const { algoMode, botTradingEnabled, payoutRate, roundDurationSec } = req.body;
    const updates = {};

    if (algoMode) updates.algoMode = algoMode;
    if (typeof botTradingEnabled === 'boolean') updates.botTradingEnabled = botTradingEnabled;
    if (typeof payoutRate === 'number') updates.payoutRate = payoutRate;
    if (typeof roundDurationSec === 'number') updates.roundDurationSec = roundDurationSec;

    const updatedSettings = await DB.updateSettings(updates);
    const engine = req.app.get('engine');
    if (engine) {
      if (algoMode) engine.setAlgoMode(algoMode);
      if (typeof botTradingEnabled === 'boolean') engine.setBotTrading(botTradingEnabled);
      if (typeof payoutRate === 'number') engine.payoutRate = payoutRate;
    }

    res.json({ success: true, settings: updatedSettings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
