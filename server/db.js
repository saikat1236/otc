import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// In-Memory Storage Fallback for High Availability & Zero Downtime
class MemoryStore {
  constructor() {
    this.users = new Map();
    this.trades = [];
    this.rounds = [];
    this.payments = [];
    this.settings = {
      algoMode: 'LOWEST_POOL_WINS', // 'LOWEST_POOL_WINS' | 'FORCE_CALL' | 'FORCE_PUT' | 'RANDOM'
      payoutRate: 0.85,
      roundDurationSec: 30,
      botTradingEnabled: true,
      adminPin: '8888'
    };

    // Pre-seed default admin
    const adminId = 'admin_root';
    this.users.set(adminId, {
      _id: adminId,
      userId: adminId,
      username: 'Administrator',
      email: 'admin@otc.trade',
      password: bcrypt.hashSync('admin123', 8),
      role: 'admin',
      balance: 50000.00,
      demoBalance: 100000.00,
      isBanned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Users
  async getUser(id) {
    if (!this.users.has(id)) {
      this.users.set(id, {
        _id: id,
        userId: id,
        username: `Trader_${id.slice(-4)}`,
        email: `${id}@trader.local`,
        password: '',
        role: 'user',
        balance: 0.00,
        demoBalance: 10000.00,
        isBanned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return this.users.get(id);
  }

  async getUserByEmailOrUsername(identifier) {
    for (const user of this.users.values()) {
      if (user.email === identifier || user.username === identifier || user.userId === identifier) {
        return user;
      }
    }
    return null;
  }

  async createUser(data) {
    const userId = data.userId || 'usr_' + Date.now();
    const user = {
      _id: userId,
      userId,
      username: data.username || `Trader_${userId.slice(-4)}`,
      email: data.email || `${userId}@trader.local`,
      password: data.password ? (data.password.startsWith('$2') ? data.password : bcrypt.hashSync(data.password, 8)) : '',
      role: data.role || 'user',
      balance: data.balance ?? 0.00,
      demoBalance: data.demoBalance ?? 10000.00,
      isBanned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(userId, user);
    return user;
  }

  async getAllUsers() {
    return Array.from(this.users.values());
  }

  async updateUser(userId, updates) {
    const user = await this.getUser(userId);
    Object.assign(user, updates, { updatedAt: new Date() });
    return user;
  }

  async updateUserBalance(id, amount, isDemo = true) {
    const user = await this.getUser(id);
    if (isDemo) {
      user.demoBalance = Math.max(0, +(user.demoBalance + amount).toFixed(2));
    } else {
      user.balance = Math.max(0, +(user.balance + amount).toFixed(2));
    }
    user.updatedAt = new Date();
    return user;
  }

  async setUserBalance(id, newBalance, isDemo = true) {
    const user = await this.getUser(id);
    if (isDemo) {
      user.demoBalance = Math.max(0, +Number(newBalance).toFixed(2));
    } else {
      user.balance = Math.max(0, +Number(newBalance).toFixed(2));
    }
    user.updatedAt = new Date();
    return user;
  }

  // Payments
  async createPayment(data) {
    const payment = {
      _id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      paymentId: data.paymentId || 'PAY-' + Date.now(),
      userId: data.userId,
      username: data.username || 'Trader',
      type: data.type, // 'DEPOSIT' | 'WITHDRAWAL'
      amount: Number(data.amount),
      method: data.method || 'USDT_TRC20',
      reference: data.reference || 'REF-' + Date.now(),
      status: 'PENDING', // 'PENDING' | 'APPROVED' | 'REJECTED'
      adminNote: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.payments.unshift(payment);
    return payment;
  }

  async getPayments(userId = null) {
    if (userId) return this.payments.filter(p => p.userId === userId);
    return this.payments;
  }

  async updatePayment(paymentId, updates) {
    const pay = this.payments.find(p => p.paymentId === paymentId || p._id === paymentId);
    if (pay) {
      Object.assign(pay, updates, { updatedAt: new Date() });
      return pay;
    }
    return null;
  }

  // Settings
  async getSettings() {
    return { ...this.settings };
  }

  async updateSettings(updates) {
    Object.assign(this.settings, updates);
    return { ...this.settings };
  }

  // Trades
  async createTrade(tradeData) {
    const trade = {
      _id: 'tr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date(),
      status: 'OPEN',
      pnl: 0,
      ...tradeData
    };
    this.trades.unshift(trade);
    if (this.trades.length > 500) this.trades.pop();
    return trade;
  }

  async updateTrade(tradeId, updates) {
    const trade = this.trades.find(t => t.tradeId === tradeId || t._id === tradeId);
    if (trade) {
      Object.assign(trade, updates);
      return trade;
    }
    return null;
  }

  async getTradesByUser(userId, limit = 50) {
    return this.trades.filter(t => t.userId === userId).slice(0, limit);
  }

  async getAllTrades(limit = 100) {
    return this.trades.slice(0, limit);
  }

  // Rounds
  async saveRound(roundData) {
    const round = {
      _id: 'rnd_' + Date.now(),
      createdAt: new Date(),
      ...roundData
    };
    this.rounds.unshift(round);
    if (this.rounds.length > 100) this.rounds.pop();
    return round;
  }
}

export const memoryStore = new MemoryStore();
export let isMongoConnected = false;

// ── Mongoose Schemas ──
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, sparse: true },
  password: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  balance: { type: Number, default: 0.00 }, // Real Money Balance
  demoBalance: { type: Number, default: 10000.00 }, // Demo Trading Balance
  currency: { type: String, default: 'USD' },
  isBanned: { type: Boolean, default: false }
}, { timestamps: true });

const PaymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  username: { type: String, default: 'Trader' },
  type: { type: String, enum: ['DEPOSIT', 'WITHDRAWAL'], required: true },
  amount: { type: Number, required: true },
  method: { type: String, default: 'USDT_TRC20' },
  reference: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  adminNote: { type: String, default: '' }
}, { timestamps: true });

const SettingSchema = new mongoose.Schema({
  key: { type: String, default: 'platform_settings', unique: true },
  algoMode: { type: String, enum: ['LOWEST_POOL_WINS', 'FORCE_CALL', 'FORCE_PUT', 'RANDOM', 'MIN_BALANCE'], default: 'LOWEST_POOL_WINS' },
  payoutRate: { type: Number, default: 0.85 },
  roundDurationSec: { type: Number, default: 30 },
  botTradingEnabled: { type: Boolean, default: true },
  adminPin: { type: String, default: '8888' }
}, { timestamps: true });

const TradeSchema = new mongoose.Schema({
  tradeId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  username: { type: String, default: 'Trader' },
  asset: { type: String, default: 'BTC/USD OTC' },
  direction: { type: String, enum: ['CALL', 'PUT'], required: true },
  amount: { type: Number, required: true },
  entryPrice: { type: Number, required: true },
  closePrice: { type: Number },
  payoutRate: { type: Number, default: 0.85 },
  pnl: { type: Number, default: 0 },
  status: { type: String, enum: ['OPEN', 'WON', 'LOST', 'TIE'], default: 'OPEN' },
  roundId: { type: String, required: true },
  isDemo: { type: Boolean, default: true }
}, { timestamps: true });

const RoundSchema = new mongoose.Schema({
  roundId: { type: String, required: true, unique: true },
  asset: { type: String, default: 'BTC/USD OTC' },
  openPrice: { type: Number, required: true },
  closePrice: { type: Number },
  winningDirection: { type: String, enum: ['CALL', 'PUT', 'TIE'] },
  callPool: { type: Number, default: 0 },
  putPool: { type: Number, default: 0 },
  settledAt: { type: Date }
}, { timestamps: true });

export let UserModel = null;
export let PaymentModel = null;
export let SettingModel = null;
export let TradeModel = null;
export let RoundModel = null;

export async function connectDB(mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/otc_trade') {
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000
    });
    isMongoConnected = true;
    UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
    PaymentModel = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
    SettingModel = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
    TradeModel = mongoose.models.Trade || mongoose.model('Trade', TradeSchema);
    RoundModel = mongoose.models.Round || mongoose.model('Round', RoundSchema);
    console.log(`[Database] MongoDB Atlas Connected successfully to ${conn.connection.host} (DB: ${conn.connection.name})`);

    // Ensure default admin exists in MongoDB
    const adminExists = await UserModel.findOne({ role: 'admin' });
    if (!adminExists) {
      await UserModel.create({
        userId: 'admin_root',
        username: 'Administrator',
        email: 'admin@otc.trade',
        password: bcrypt.hashSync('admin123', 8),
        role: 'admin',
        balance: 50000.00,
        demoBalance: 100000.00
      });
      console.log('[Database] Seeded initial Admin Account (Email: admin@otc.trade, Pass: admin123)');
    }

    return true;
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB Atlas connection error (${err.message}). Operating in high-speed In-Memory DB Mode.`);
    return false;
  }
}

// Unified Data Access Layer
export const DB = {
  // User Management
  async getUser(userId) {
    if (isMongoConnected && UserModel) {
      let user = await UserModel.findOne({ userId });
      if (!user) {
        user = await UserModel.create({
          userId,
          username: `Trader_${userId.slice(-4)}`,
          email: `${userId}@trader.local`,
          balance: 0.00,
          demoBalance: 10000.00
        });
      }
      return user.toObject();
    }
    return memoryStore.getUser(userId);
  },

  async getUserByEmailOrUsername(identifier) {
    if (isMongoConnected && UserModel) {
      const user = await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }, { userId: identifier }]
      });
      return user ? user.toObject() : null;
    }
    return memoryStore.getUserByEmailOrUsername(identifier);
  },

  async createUser(data) {
    if (isMongoConnected && UserModel) {
      const user = await UserModel.create({
        userId: data.userId || 'usr_' + Date.now(),
        username: data.username,
        email: data.email,
        password: data.password ? (data.password.startsWith('$2') ? data.password : bcrypt.hashSync(data.password, 8)) : '',
        role: data.role || 'user',
        balance: data.balance ?? 0.00,
        demoBalance: data.demoBalance ?? 10000.00
      });
      return user.toObject();
    }
    return memoryStore.createUser(data);
  },

  async getAllUsers() {
    if (isMongoConnected && UserModel) {
      return UserModel.find({}).sort({ createdAt: -1 }).lean();
    }
    return memoryStore.getAllUsers();
  },

  async updateUser(userId, updates) {
    if (isMongoConnected && UserModel) {
      const user = await UserModel.findOneAndUpdate({ userId }, { $set: updates }, { new: true });
      return user ? user.toObject() : null;
    }
    return memoryStore.updateUser(userId, updates);
  },

  async updateUserBalance(userId, amount, isDemo = true) {
    if (isMongoConnected && UserModel) {
      const field = isDemo ? 'demoBalance' : 'balance';
      const user = await UserModel.findOneAndUpdate(
        { userId },
        { $inc: { [field]: amount } },
        { new: true, upsert: true }
      );
      return user.toObject();
    }
    return memoryStore.updateUserBalance(userId, amount, isDemo);
  },

  async setUserBalance(userId, newBalance, isDemo = true) {
    if (isMongoConnected && UserModel) {
      const field = isDemo ? 'demoBalance' : 'balance';
      const user = await UserModel.findOneAndUpdate(
        { userId },
        { $set: { [field]: Math.max(0, +Number(newBalance).toFixed(2)) } },
        { new: true, upsert: true }
      );
      return user.toObject();
    }
    return memoryStore.setUserBalance(userId, newBalance, isDemo);
  },

  // Payment Management (Deposits & Withdrawals)
  async createPayment(paymentData) {
    if (isMongoConnected && PaymentModel) {
      const pay = await PaymentModel.create({
        paymentId: paymentData.paymentId || 'PAY-' + Date.now(),
        ...paymentData
      });
      return pay.toObject();
    }
    return memoryStore.createPayment(paymentData);
  },

  async getPayments(userId = null) {
    if (isMongoConnected && PaymentModel) {
      const query = userId ? { userId } : {};
      return PaymentModel.find(query).sort({ createdAt: -1 }).lean();
    }
    return memoryStore.getPayments(userId);
  },

  async updatePayment(paymentId, updates) {
    if (isMongoConnected && PaymentModel) {
      const pay = await PaymentModel.findOneAndUpdate(
        { $or: [{ paymentId }, { _id: mongoose.isValidObjectId(paymentId) ? paymentId : null }] },
        { $set: updates },
        { new: true }
      );
      return pay ? pay.toObject() : null;
    }
    return memoryStore.updatePayment(paymentId, updates);
  },

  // Platform & Game Engine Settings
  async getSettings() {
    if (isMongoConnected && SettingModel) {
      let s = await SettingModel.findOne({ key: 'platform_settings' });
      if (!s) {
        s = await SettingModel.create({ key: 'platform_settings' });
      }
      return s.toObject();
    }
    return memoryStore.getSettings();
  },

  async updateSettings(updates) {
    if (isMongoConnected && SettingModel) {
      const s = await SettingModel.findOneAndUpdate(
        { key: 'platform_settings' },
        { $set: updates },
        { new: true, upsert: true }
      );
      return s.toObject();
    }
    return memoryStore.updateSettings(updates);
  },

  // Trades
  async createTrade(tradeData) {
    if (isMongoConnected && TradeModel) {
      const trade = await TradeModel.create(tradeData);
      return trade.toObject();
    }
    return memoryStore.createTrade(tradeData);
  },

  async updateTrade(tradeId, updates) {
    if (isMongoConnected && TradeModel) {
      const trade = await TradeModel.findOneAndUpdate(
        { tradeId },
        { $set: updates },
        { new: true }
      );
      return trade ? trade.toObject() : null;
    }
    return memoryStore.updateTrade(tradeId, updates);
  },

  async getTrades(userId, limit = 50) {
    if (isMongoConnected && TradeModel) {
      return TradeModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
    }
    return memoryStore.getTradesByUser(userId, limit);
  },

  async getAllTrades(limit = 100) {
    if (isMongoConnected && TradeModel) {
      return TradeModel.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    }
    return memoryStore.getAllTrades(limit);
  },

  // Rounds
  async saveRound(roundData) {
    if (isMongoConnected && RoundModel) {
      const round = await RoundModel.findOneAndUpdate(
        { roundId: roundData.roundId },
        { $set: roundData },
        { new: true, upsert: true }
      );
      return round ? round.toObject() : null;
    }
    return memoryStore.saveRound(roundData);
  }
};
