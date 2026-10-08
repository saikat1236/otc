import { DB } from '../db.js';

export class TradingEngine {
  constructor(io) {
    this.io = io;
    this.asset = 'BTC/USD OTC';
    this.currentPrice = 96420.50;
    this.roundDurationSec = 30; // 30-second binary round
    this.lockWindowSec = 6;     // Final 6s locked for resolution
    this.candleDurationMs = 5000; // 5-second candlesticks
    
    this.candles = [];
    this.currentCandle = null;
    this.activeTrades = [];
    this.currentRound = null;
    
    // Wave tracking for realistic alternating candle patterns
    this.trendDirection = 1; // 1 = Bullish bias, -1 = Bearish bias
    this.candlesInTrend = 0;
    this.maxCandlesInTrend = 2; // mini-waves of 1 to 3 candles
    
    this.tickInterval = null;
    this.botBetInterval = null;
    
    // Dynamic Algorithm & Game Mode Settings
    this.algoMode = 'LOWEST_POOL_WINS'; // 'LOWEST_POOL_WINS' | 'FORCE_CALL' | 'FORCE_PUT' | 'RANDOM'
    this.botTradingEnabled = true;
    this.payoutRate = 0.85;

    this.initHistoricalCandles(60);
    this.loadSettings();
    this.startNewRound();
    this.startPriceLoop();
    this.startSimulatedMarketFlow();
  }

  async loadSettings() {
    try {
      const s = await DB.getSettings();
      if (s) {
        if (s.algoMode) this.algoMode = s.algoMode;
        if (typeof s.botTradingEnabled === 'boolean') this.botTradingEnabled = s.botTradingEnabled;
        if (typeof s.payoutRate === 'number') this.payoutRate = s.payoutRate;
        if (typeof s.roundDurationSec === 'number') this.roundDurationSec = s.roundDurationSec;
      }
    } catch (e) {
      console.warn('[Engine] Error loading settings:', e.message);
    }
  }

  // Generate realistic 2-way historical candles with both UP and DOWN bars
  initHistoricalCandles(count = 60) {
    const now = Math.floor(Date.now() / this.candleDurationMs) * this.candleDurationMs;
    let price = 96380.00;
    let waveDir = 1;
    let waveLen = 2;
    let countInWave = 0;
    
    for (let i = count; i >= 1; i--) {
      countInWave++;
      if (countInWave >= waveLen) {
        waveDir = -waveDir; // Reverse: creates balanced green and red candles
        countInWave = 0;
        waveLen = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3 candles per wave
      }
      
      const open = price;
      // Real 5s price move: 1.5 to 5.5 points in wave direction with micro noise
      const move = (Math.random() * 4.0 + 1.2) * waveDir + (Math.random() - 0.5) * 1.5;
      const close = +(open + move).toFixed(2);
      
      // Real Upper and Lower Wicks
      const maxBody = Math.max(open, close);
      const minBody = Math.min(open, close);
      const upperWick = +(Math.random() * 3.2 + 0.8).toFixed(2);
      const lowerWick = +(Math.random() * 3.2 + 0.8).toFixed(2);
      
      const high = +(maxBody + upperWick).toFixed(2);
      const low = +(minBody - lowerWick).toFixed(2);
      const timestamp = now - i * this.candleDurationMs;
      
      this.candles.push({
        time: timestamp,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 65 + 20)
      });
      price = close;
    }
    
    this.currentPrice = price;

    // Start working live candle with initial micro-wicks
    this.currentCandle = {
      time: now,
      open: this.currentPrice,
      high: +(this.currentPrice + 0.6).toFixed(2),
      low: +(this.currentPrice - 0.6).toFixed(2),
      close: this.currentPrice,
      volume: 1
    };
  }

  startNewRound() {
    const now = Date.now();
    const roundId = 'RND-' + now;
    
    // Seed pools with balanced organic activity
    const baseCall = +(Math.random() * 120 + 60).toFixed(2);
    const basePut = +(Math.random() * 120 + 60).toFixed(2);
    
    this.currentRound = {
      roundId,
      asset: this.asset,
      startTime: now,
      endTime: now + this.roundDurationSec * 1000,
      openPrice: this.currentPrice,
      pool: {
        callAmount: baseCall,
        callCount: Math.floor(Math.random() * 4 + 2),
        putAmount: basePut,
        putCount: Math.floor(Math.random() * 4 + 2)
      },
      status: 'OPEN'
    };

    this.activeTrades = [];

    // Broadcast new round
    this.io.emit('NEW_ROUND', this.getRoundPublicState());
  }

  getRoundPublicState() {
    if (!this.currentRound) return null;
    const now = Date.now();
    const remainingMs = Math.max(0, this.currentRound.endTime - now);
    const remainingSec = Math.ceil(remainingMs / 1000);
    const isLocked = remainingSec <= this.lockWindowSec;

    const total = this.currentRound.pool.callAmount + this.currentRound.pool.putAmount;
    const callPct = total > 0 ? Math.round((this.currentRound.pool.callAmount / total) * 100) : 50;
    const putPct = 100 - callPct;

    return {
      roundId: this.currentRound.roundId,
      asset: this.asset,
      startTime: this.currentRound.startTime,
      endTime: this.currentRound.endTime,
      openPrice: this.currentRound.openPrice,
      currentPrice: this.currentPrice,
      remainingSec,
      isLocked,
      status: this.currentRound.status,
      pool: {
        callAmount: +this.currentRound.pool.callAmount.toFixed(2),
        callCount: this.currentRound.pool.callCount,
        callPct,
        putAmount: +this.currentRound.pool.putAmount.toFixed(2),
        putCount: this.currentRound.pool.putCount,
        putPct
      }
    };
  }

  placeTrade(tradeData) {
    const { userId, direction, amount, isDemo } = tradeData;
    const now = Date.now();
    const remainingSec = Math.ceil((this.currentRound.endTime - now) / 1000);

    if (remainingSec <= this.lockWindowSec) {
      return { success: false, error: 'Round is locked for settlement. Next round starting shortly.' };
    }

    const trade = {
      tradeId: 'TR-' + now + '-' + Math.floor(Math.random() * 1000),
      userId,
      asset: this.asset,
      direction,
      amount: Number(amount),
      userBalance: Number(tradeData.userBalance ?? (isDemo ? 10000 : 0)),
      entryPrice: this.currentPrice,
      entryTime: now,
      roundId: this.currentRound.roundId,
      isDemo: Boolean(isDemo),
      payoutRate: 0.85,
      status: 'OPEN'
    };

    if (direction === 'CALL') {
      this.currentRound.pool.callAmount += trade.amount;
      this.currentRound.pool.callCount += 1;
    } else {
      this.currentRound.pool.putAmount += trade.amount;
      this.currentRound.pool.putCount += 1;
    }

    this.activeTrades.push(trade);

    DB.createTrade(trade).catch(err => console.error('Error saving trade to DB:', err));

    this.io.emit('POOL_UPDATE', this.getRoundPublicState().pool);

    return { success: true, trade };
  }

  determineWinningDirection() {
    // 1. Explicit Admin Force Overrides
    if (this.algoMode === 'FORCE_CALL') return 'CALL';
    if (this.algoMode === 'FORCE_PUT') return 'PUT';
    if (this.algoMode === 'RANDOM') return Math.random() > 0.5 ? 'CALL' : 'PUT';

    // 2. Minimum Balance Account Priority
    // Example: Player 1 has 10$ BUY (acc: 100$) and Player 2 has 10$ SELL (acc: 1000$) -> Player 1 wins!
    const callTrades = this.activeTrades.filter(t => t.direction === 'CALL');
    const putTrades = this.activeTrades.filter(t => t.direction === 'PUT');

    if (callTrades.length > 0 && putTrades.length > 0) {
      const minCallBalance = Math.min(...callTrades.map(t => (typeof t.userBalance === 'number' && !isNaN(t.userBalance)) ? t.userBalance : Infinity));
      const minPutBalance = Math.min(...putTrades.map(t => (typeof t.userBalance === 'number' && !isNaN(t.userBalance)) ? t.userBalance : Infinity));

      if (minCallBalance < minPutBalance) {
        return 'CALL'; // Min balance account placed BUY/CALL -> CALL wins
      } else if (minPutBalance < minCallBalance) {
        return 'PUT';  // Min balance account placed SELL/PUT -> PUT wins
      }
      // If min balances are tied, fall through to pool comparison
    } else if (this.algoMode === 'MIN_BALANCE') {
      // In explicit MIN_BALANCE mode, any active player trade with low balance wins
      if (callTrades.length > 0 && putTrades.length === 0) return 'CALL';
      if (putTrades.length > 0 && callTrades.length === 0) return 'PUT';
    }

    // 3. Lowest Pool Wins (House keeps the larger betting pool)
    const callPool = this.currentRound ? this.currentRound.pool.callAmount : 0;
    const putPool = this.currentRound ? this.currentRound.pool.putAmount : 0;

    if (callPool > putPool) {
      return 'PUT';
    } else if (putPool > callPool) {
      return 'CALL';
    }

    return Math.random() > 0.5 ? 'CALL' : 'PUT';
  }

  startPriceLoop() {
    // 250ms ticks for fluid, living price action
    this.tickInterval = setInterval(() => {
      this.stepPrice();
    }, 250);
  }

  stepPrice() {
    if (!this.currentRound) return;

    const now = Date.now();
    const remainingSec = Math.max(0, Math.ceil((this.currentRound.endTime - now) / 1000));
    const roundOpen = this.currentRound.openPrice;

    // Check round expiration
    if (remainingSec <= 0 && this.currentRound.status !== 'RESOLVING') {
      this.resolveRound();
      return;
    }

    // ── Continuous Candlestick Formation (Every 5 Seconds) ──
    if (this.currentCandle && now >= this.currentCandle.time + this.candleDurationMs) {
      // Ensure the closing candle has authentic wicks
      const closedCandle = { ...this.currentCandle };
      closedCandle.high = Math.max(closedCandle.high, Math.max(closedCandle.open, closedCandle.close) + +(Math.random() * 0.8 + 0.3).toFixed(2));
      closedCandle.low = Math.min(closedCandle.low, Math.min(closedCandle.open, closedCandle.close) - +(Math.random() * 0.8 + 0.3).toFixed(2));

      this.candles.push(closedCandle);
      if (this.candles.length > 70) this.candles.shift();

      // Cycle trend mini-wave
      this.candlesInTrend++;
      if (this.candlesInTrend >= this.maxCandlesInTrend) {
        this.trendDirection = -this.trendDirection; // alternate between Green and Red waves
        this.candlesInTrend = 0;
        this.maxCandlesInTrend = Math.floor(Math.random() * 3) + 1; // 1-3 candles per wave
      }

      // Begin new candle with immediate micro-wicks so it never looks flat
      const nextCandleTime = Math.floor(now / this.candleDurationMs) * this.candleDurationMs;
      this.currentCandle = {
        time: nextCandleTime,
        open: this.currentPrice,
        high: +(this.currentPrice + 0.5).toFixed(2),
        low: +(this.currentPrice - 0.5).toFixed(2),
        close: this.currentPrice,
        volume: 1
      };

      this.io.emit('CANDLE_CLOSE', {
        candle: closedCandle,
        newCandle: this.currentCandle
      });
    }

    // ── Algorithm Engine Mode: Min Balance Account Priority & House Advantage ──
    const targetWinningDirection = this.determineWinningDirection();

    // Authentic two-way financial market micro-ticks (Laplace noise)
    const microJitter = (Math.random() - Math.random()) * 0.95;
    let drift = 0;

    if (remainingSec > this.lockWindowSec) {
      // Early/Mid phase (> 6s): Follow mini-wave for organic green/red candle alternation
      const waveBias = this.trendDirection * 0.28;
      drift = microJitter + waveBias;
    } else {
      // Final Lock Window (last 6 seconds): Smoothly steer toward target side
      // While maintaining two-way micro-ticks so candles still show both UP and DOWN movement!
      const targetThreshold = targetWinningDirection === 'CALL' ? (roundOpen + 1.20) : (roundOpen - 1.20);
      const targetDelta = targetThreshold - this.currentPrice;
      
      // Proportional progressive steering: grows stronger as seconds count down to 0
      const urgency = 1 + (this.lockWindowSec - remainingSec) * 0.25;
      const steerBias = Math.max(-1.1, Math.min(1.1, targetDelta * 0.42 * urgency));
      
      // Keep realistic two-way micro-ticks while pulling firmly to the target
      drift = microJitter * 0.45 + steerBias;
    }

    // Update current price
    this.currentPrice = +(this.currentPrice + drift).toFixed(2);

    // Update live working candle with dynamic high/low bounds
    if (this.currentCandle) {
      this.currentCandle.close = this.currentPrice;
      this.currentCandle.high = Math.max(this.currentCandle.high, this.currentPrice);
      this.currentCandle.low = Math.min(this.currentCandle.low, this.currentPrice);
      this.currentCandle.volume += 1;
    }

    // Lock transition
    if (remainingSec <= this.lockWindowSec && this.currentRound.status === 'OPEN') {
      this.currentRound.status = 'LOCKED';
      this.io.emit('ROUND_LOCKED', {
        roundId: this.currentRound.roundId,
        lockPrice: this.currentPrice
      });
    }

    const candleRemainingMs = Math.max(0, (this.currentCandle.time + this.candleDurationMs) - now);

    // Broadcast tick
    this.io.emit('TICK', {
      price: this.currentPrice,
      time: now,
      candle: this.currentCandle,
      remainingSec,
      candleRemainingSec: Math.ceil(candleRemainingMs / 1000)
    });
  }

  async resolveRound() {
    this.currentRound.status = 'RESOLVING';
    const openPrice = this.currentRound.openPrice;
    const callPool = this.currentRound.pool.callAmount;
    const putPool = this.currentRound.pool.putAmount;

    // ── STRICT HOUSE ADVANTAGE & MIN BALANCE PRIORITY ENGINE ──
    const winningDirection = this.determineWinningDirection();

    // Mathematically enforce close price to match the winning direction cleanly
    let closePrice = this.currentPrice;
    if (winningDirection === 'CALL' && closePrice <= openPrice) {
      closePrice = +(openPrice + +(Math.random() * 0.8 + 0.4).toFixed(2)).toFixed(2);
    } else if (winningDirection === 'PUT' && closePrice >= openPrice) {
      closePrice = +(openPrice - +(Math.random() * 0.8 + 0.4).toFixed(2)).toFixed(2);
    }

    this.currentPrice = closePrice;
    if (this.currentCandle) {
      this.currentCandle.close = closePrice;
      this.currentCandle.high = Math.max(this.currentCandle.high, closePrice);
      this.currentCandle.low = Math.min(this.currentCandle.low, closePrice);
    }

    const roundId = this.currentRound.roundId;
    const results = [];

    for (const trade of this.activeTrades) {
      let isWin = false;
      let pnl = 0;
      let status = 'LOST';

      if (trade.direction === winningDirection) {
        isWin = true;
        status = 'WON';
        pnl = +(trade.amount * trade.payoutRate).toFixed(2);
        await DB.updateUserBalance(trade.userId, trade.amount + pnl, trade.isDemo);
      } else if (winningDirection === 'TIE') {
        status = 'TIE';
        pnl = 0;
        await DB.updateUserBalance(trade.userId, trade.amount, trade.isDemo);
      } else {
        pnl = -trade.amount;
        status = 'LOST';
      }

      trade.closePrice = closePrice;
      trade.status = status;
      trade.pnl = pnl;

      await DB.updateTrade(trade.tradeId, { closePrice, status, pnl });

      results.push({
        tradeId: trade.tradeId,
        userId: trade.userId,
        direction: trade.direction,
        amount: trade.amount,
        entryPrice: trade.entryPrice,
        closePrice,
        status,
        pnl,
        isWin
      });
    }

    await DB.saveRound({
      roundId,
      asset: this.asset,
      openPrice,
      closePrice,
      winningDirection,
      callPool: this.currentRound.pool.callAmount,
      putPool: this.currentRound.pool.putAmount,
      settledAt: new Date()
    });

    this.io.emit('ROUND_RESOLVED', {
      roundId,
      openPrice,
      closePrice,
      winningDirection,
      results
    });

    setTimeout(() => {
      this.startNewRound();
    }, 1200);
  }

  startSimulatedMarketFlow() {
    this.botBetInterval = setInterval(() => {
      if (!this.botTradingEnabled) return;
      if (!this.currentRound || this.currentRound.status !== 'OPEN') return;
      
      const now = Date.now();
      const remainingSec = Math.ceil((this.currentRound.endTime - now) / 1000);
      if (remainingSec <= this.lockWindowSec + 1) return;

      if (Math.random() < 0.6) {
        const dir = Math.random() > 0.5 ? 'CALL' : 'PUT';
        const amt = +(Math.random() * 80 + 10).toFixed(2);
        if (dir === 'CALL') {
          this.currentRound.pool.callAmount += amt;
          this.currentRound.pool.callCount += 1;
        } else {
          this.currentRound.pool.putAmount += amt;
          this.currentRound.pool.putCount += 1;
        }
        this.io.emit('POOL_UPDATE', this.getRoundPublicState().pool);
      }
    }, 2800);
  }

  setAlgoMode(mode) {
    this.algoMode = mode;
  }

  setBotTrading(enabled) {
    this.botTradingEnabled = enabled;
  }

  destroy() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.botBetInterval) clearInterval(this.botBetInterval);
  }
}
