import 'dotenv/config';
import mongoose from 'mongoose';

// Flexible data store supporting MongoDB with automatic in-memory reactive fallback
class MemoryStore {
  constructor() {
    this.users = new Map();
    this.trades = [];
    this.rounds = [];
  }

  // User operations
  async getUser(id) {
    if (!this.users.has(id)) {
      this.users.set(id, {
        _id: id,
        userId: id,
        username: `Trader_${id.slice(-4)}`,
        balance: 9379.63,
        demoBalance: 10000.00,
        currency: 'USD',
        isDemo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return this.users.get(id);
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

  // Trade operations
  async createTrade(tradeData) {
    const trade = {
      _id: 'tr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      createdAt: new Date(),
      status: 'OPEN',
      pnl: 0,
      ...tradeData
    };
    this.trades.unshift(trade);
    if (this.trades.length > 500) this.trades.pop();
    return trade;
  }

  async updateTrade(id, updates) {
    const trade = this.trades.find(t => t._id === id);
    if (trade) {
      Object.assign(trade, updates);
      return trade;
    }
    return null;
  }

  async getTradesByUser(userId, limit = 50) {
    return this.trades.filter(t => t.userId === userId).slice(0, limit);
  }

  // Round history
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

// Mongoose Schemas if MongoDB is available
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, default: 'Trader' },
  balance: { type: Number, default: 9379.63 },
  demoBalance: { type: Number, default: 10000.00 },
  currency: { type: String, default: 'USD' },
  isDemo: { type: Boolean, default: true }
}, { timestamps: true });

const TradeSchema = new mongoose.Schema({
  tradeId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
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
    TradeModel = mongoose.models.Trade || mongoose.model('Trade', TradeSchema);
    RoundModel = mongoose.models.Round || mongoose.model('Round', RoundSchema);
    console.log(`[Database] MongoDB Atlas Connected successfully to ${conn.connection.host} (DB: ${conn.connection.name})`);
    return true;
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] MongoDB Atlas connection error (${err.message}). Operating in high-speed In-Memory DB Mode. All trades & rounds persist in memory.`);
    return false;
  }
}

// Unified Data Access Layer (automatically proxies to MongoDB if available, otherwise MemoryStore)
export const DB = {
  async getUser(userId) {
    if (isMongoConnected && UserModel) {
      let user = await UserModel.findOne({ userId });
      if (!user) {
        user = await UserModel.create({
          userId,
          username: `Trader_${userId.slice(-4)}`,
          balance: 9379.63,
          demoBalance: 10000.00
        });
      }
      return user.toObject();
    }
    return memoryStore.getUser(userId);
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
