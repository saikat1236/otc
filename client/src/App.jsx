import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import AssetBar from './components/AssetBar.jsx';
import Chart from './components/Chart.jsx';
import TradingPanel from './components/TradingPanel.jsx';
import OrdersDrawer from './components/Drawers/OrdersDrawer.jsx';
import DepositDrawer from './components/Drawers/DepositDrawer.jsx';
import MarketDrawer from './components/Drawers/MarketDrawer.jsx';
import ResultModal from './components/Drawers/ResultModal.jsx';
import PwaModal from './components/Drawers/PwaModal.jsx';
import AuthModal from './components/Drawers/AuthModal.jsx';
import AdminPanel from './components/Drawers/AdminPanel.jsx';
import TournamentsModal from './components/Drawers/TournamentsModal.jsx';
import SupportModal from './components/Drawers/SupportModal.jsx';
import { socket, userId } from './services/socket.js';
import { sounds } from './services/sound.js';

function generateInitialCandles(basePrice = 96420, count = 35) {
  const list = [];
  let price = basePrice - 140;
  const now = Date.now();
  for (let i = count; i >= 1; i--) {
    const time = now - i * 5000;
    const variance = (Math.random() - 0.48) * 35;
    const open = price;
    const close = price + variance;
    const high = Math.max(open, close) + Math.random() * 18;
    const low = Math.min(open, close) - Math.random() * 18;
    list.push({ time, open, high, low, close });
    price = close;
  }
  return list;
}

export default function App() {
  // Connection & User State
  const [isOnline, setIsOnline] = useState(false);
  const [user, setUser] = useState({ userId: userId, username: 'Trader', demoBalance: 10000, balance: 0, role: 'user' });
  const [isDemo, setIsDemo] = useState(true);
  const [currency, setCurrency] = useState('INR'); // 'INR' or 'USD'

  // Multi-Asset Tabs State (matching screenshot)
  const [openTabs, setOpenTabs] = useState([
    { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar OTC', payout: 60, icon: '🇺🇸🇨🇦' },
    { symbol: 'BTC/USDT OTC', name: 'Bitcoin Rapid OTC', payout: 85, icon: '₿' },
    { symbol: 'EUR/USD OTC', name: 'Euro / US Dollar OTC', payout: 82, icon: '🇪🇺🇺🇸' },
    { symbol: 'USD/PKR OTC', name: 'US Dollar / Pakistani Rupee OTC', payout: 75, icon: '🇺🇸🇵🇰' }
  ]);
  const [activeAsset, setActiveAsset] = useState('USD/CAD');

  // Market & Engine State
  const [serverPrice, setServerPrice] = useState(96420.50);
  const [rawCandles, setRawCandles] = useState(() => generateInitialCandles());
  const [rawCurrentCandle, setRawCurrentCandle] = useState(null);
  const [round, setRound] = useState(null);
  const [remainingSec, setRemainingSec] = useState(35);
  const [candleRemainingSec, setCandleRemainingSec] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [pool, setPool] = useState({ callAmount: 180, putAmount: 120, callPct: 74, putPct: 26 });

  // User Trades State (Default 10,900 for INR matching screenshot)
  const [activeTrades, setActiveTrades] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [betAmount, setBetAmount] = useState(10900);

  // Audio & UI Controls
  const [isMuted, setIsMuted] = useState(false);
  const [activeNav, setActiveNav] = useState('trade');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Drawers & Modals
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [pwaOpen, setPwaOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [tournamentsOpen, setTournamentsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [toast, setToast] = useState(null);

  // PWA Install Prompt Handler
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    const token = localStorage.getItem('otc_token');
    const storedUid = localStorage.getItem('otc_user_id') || userId;
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`/api/auth/me?userId=${storedUid}`, { headers });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.warn('Session check error', e);
    }
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('Quotex PWA Installed!', 'success');
      }
      setDeferredPrompt(null);
      setPwaOpen(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Switch currency helper
  const handleToggleCurrency = () => {
    setCurrency(prev => {
      const next = prev === 'INR' ? 'USD' : 'INR';
      if (next === 'INR') {
        setBetAmount(10900);
      } else {
        setBetAmount(50);
      }
      showToast(`Switched currency to ${next === 'INR' ? '₹ INR' : '$ USD'}`, 'info');
      return next;
    });
  };

  // Socket.io Subscriptions
  useEffect(() => {
    socket.on('connect', () => {
      setIsOnline(true);
      console.log('[Socket] Connected to OTC Engine with userId:', userId);
    });

    socket.on('disconnect', () => {
      setIsOnline(false);
    });

    socket.on('INITIAL_STATE', (data) => {
      if (data.user) {
        setUser(prev => prev || data.user);
      }
      if (data.candles) setRawCandles(data.candles);
      if (data.currentCandle) setRawCurrentCandle(data.currentCandle);
      if (data.currentPrice) setServerPrice(data.currentPrice);
      if (data.round) {
        setRound(data.round);
        setRemainingSec(data.round.remainingSec);
        setIsLocked(data.round.isLocked);
        if (data.round.pool) setPool(data.round.pool);
      }
      if (data.activeTrades) setActiveTrades(data.activeTrades);
    });

    socket.on('TICK', (data) => {
      setServerPrice(data.price);
      if (data.candle) setRawCurrentCandle(data.candle);
      if (typeof data.remainingSec === 'number') {
        setRemainingSec(data.remainingSec);
      }
      if (typeof data.candleRemainingSec === 'number') {
        setCandleRemainingSec(data.candleRemainingSec);
      }
    });

    socket.on('CANDLE_CLOSE', (data) => {
      if (data.candle) {
        setRawCandles(prev => {
          const next = [...prev, data.candle];
          return next.length > 70 ? next.slice(-70) : next;
        });
      }
      if (data.newCandle) {
        setRawCurrentCandle(data.newCandle);
      }
    });

    socket.on('POOL_UPDATE', (updatedPool) => {
      setPool(updatedPool);
    });

    socket.on('ROUND_LOCKED', () => {
      setIsLocked(true);
      showToast('Bets locked. Settling round...', 'warning');
    });

    socket.on('NEW_ROUND', (roundData) => {
      setRound(roundData);
      setRemainingSec(roundData.remainingSec);
      setIsLocked(false);
      setPool(roundData.pool);
      setActiveTrades([]);
    });

    socket.on('TRADE_CONFIRMED', (data) => {
      sounds.playBet();
      setActiveTrades(prev => [...prev, data.trade]);
      setUser(prev => {
        if (!prev) return prev;
        return isDemo 
          ? { ...prev, demoBalance: data.newBalance }
          : { ...prev, balance: data.newBalance };
      });
      const sym = currency === 'INR' ? '₹' : '$';
      showToast(`Trade Placed: ${data.trade.direction} ${sym}${betAmount}`, 'success');
      fetchTradeHistory();
    });

    socket.on('TRADE_ERROR', (err) => {
      showToast(err.message || 'Trade Error', 'error');
    });

    socket.on('ROUND_RESOLVED', (data) => {
      const currentUid = user?.userId || userId;
      const myResult = data.results?.find(r => r.userId === currentUid);
      if (myResult) {
        if (myResult.isWin) {
          sounds.playWin();
        } else {
          sounds.playLoss();
        }
        setResultData({
          winningDirection: data.winningDirection,
          userResult: myResult,
          closePrice: data.closePrice
        });
      }

      fetchUserProfile();
      fetchTradeHistory();
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('INITIAL_STATE');
      socket.off('TICK');
      socket.off('CANDLE_CLOSE');
      socket.off('POOL_UPDATE');
      socket.off('ROUND_LOCKED');
      socket.off('NEW_ROUND');
      socket.off('TRADE_CONFIRMED');
      socket.off('TRADE_ERROR');
      socket.off('ROUND_RESOLVED');
    };
  }, [user, isDemo, betAmount, currency]);

  const fetchUserProfile = async () => {
    const currentUid = user?.userId || userId;
    try {
      const res = await fetch(`/api/user/${currentUid}`);
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.warn('Error fetching user', e);
    }
  };

  const fetchTradeHistory = async () => {
    const currentUid = user?.userId || userId;
    try {
      const res = await fetch(`/api/trades/${currentUid}`);
      const data = await res.json();
      if (data.success && data.trades) {
        setTradeHistory(data.trades);
      }
    } catch (e) {
      console.warn('Error fetching trades', e);
    }
  };

  // Standalone / offline continuous ticker fallback
  useEffect(() => {
    if (isOnline) return;

    const interval = setInterval(() => {
      setServerPrice(prev => {
        const delta = (Math.random() - 0.49) * 8;
        const nextPrice = +(prev + delta).toFixed(2);
        setRawCurrentCandle(curr => {
          if (!curr) return { time: Date.now(), open: prev, high: Math.max(prev, nextPrice), low: Math.min(prev, nextPrice), close: nextPrice };
          return {
            ...curr,
            high: Math.max(curr.high, nextPrice),
            low: Math.min(curr.low, nextPrice),
            close: nextPrice
          };
        });
        return nextPrice;
      });

      setCandleRemainingSec(prev => {
        if (prev <= 1) {
          setRawCandles(list => {
            const last = list[list.length - 1];
            const closeP = last ? last.close : 96420;
            const variance = (Math.random() - 0.48) * 20;
            const nextClose = closeP + variance;
            return [...list.slice(-50), {
              time: Date.now(),
              open: closeP,
              high: Math.max(closeP, nextClose) + Math.random() * 10,
              low: Math.min(closeP, nextClose) - Math.random() * 10,
              close: nextClose
            }];
          });
          return 5;
        }
        return prev - 1;
      });

      setRemainingSec(prev => {
        if (prev <= 1) {
          // Resolve standalone trades
          setActiveTrades(trades => {
            if (trades.length > 0) {
              trades.forEach(t => {
                const isWin = Math.random() > 0.45;
                if (isWin) sounds.playWin();
                else sounds.playLoss();
                const payoutMult = 0.6;
                const winProfit = Math.round(t.amount * (1 + payoutMult));
                setTradeHistory(hist => [
                  {
                    asset: activeAsset,
                    time: new Date().toLocaleTimeString().slice(0, 5),
                    amount: t.amount,
                    profit: isWin ? winProfit : 0,
                    isWin,
                    direction: t.direction
                  },
                  ...hist
                ]);
                if (isWin) {
                  setUser(u => u ? { ...u, demoBalance: (u.demoBalance || 10000) + (winProfit / inrRate) } : u);
                }
              });
            }
            return [];
          });
          return 35;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnline, activeAsset]);

  // Place Trade Action
  const handlePlaceTrade = (direction) => {
    const inrRate = 85.5;
    const rawBal = isDemo ? Number(user?.demoBalance ?? 10000) : Number(user?.balance ?? 0);
    const effectiveBalance = currency === 'INR' ? rawBal * inrRate : rawBal;

    if (effectiveBalance < betAmount) {
      showToast(`Insufficient balance for this trade`, 'error');
      return;
    }

    if (socket.connected) {
      const serverAmount = currency === 'INR' ? +(betAmount / inrRate).toFixed(2) : betAmount;
      socket.emit('PLACE_TRADE', {
        amount: serverAmount,
        direction,
        isDemo
      });
    } else {
      // Standalone / offline trade placement
      sounds.playBet();
      const localTrade = {
        tradeId: 't_' + Math.random().toString(36).slice(2, 7),
        amount: betAmount,
        direction,
        entryPrice: displayCurrentPrice,
        asset: activeAsset,
        isDemo: true,
        createdAt: Date.now()
      };
      setActiveTrades(prev => [...prev, localTrade]);
      setUser(prev => {
        const cur = prev?.demoBalance ?? 10000;
        const sub = currency === 'INR' ? betAmount / inrRate : betAmount;
        return { ...(prev || {}), demoBalance: Math.max(0, cur - sub) };
      });
      const sym = currency === 'INR' ? '₹' : '$';
      showToast(`Trade Placed: ${direction} ${sym}${betAmount.toLocaleString()}`, 'success');
    }
  };

  // Deposit Actions
  const handleDeposit = async (amount) => {
    const currentUid = user?.userId || userId;
    try {
      const res = await fetch('/api/user/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUid, amount, isDemo })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        showToast(`Successfully deposited +$${amount.toFixed(2)}`, 'success');
      }
    } catch (e) {
      showToast('Deposit failed', 'error');
    }
  };

  const handleResetBalance = async () => {
    const currentUid = user?.userId || userId;
    try {
      const res = await fetch('/api/user/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUid, isDemo: true })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        showToast('Demo balance refilled!', 'info');
      }
    } catch (e) {
      showToast('Reset failed', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('otc_token');
    localStorage.removeItem('otc_user_id');
    setUser(null);
    showToast('Logged out successfully', 'info');
    setTimeout(() => window.location.reload(), 500);
  };

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    showToast(muted ? 'Sound Muted' : 'Sound Enabled', 'info');
  };

  // Tab Handlers
  const handleSelectTab = (sym) => {
    setActiveAsset(sym);
  };

  const handleCloseTab = (sym) => {
    if (openTabs.length <= 1) return;
    const nextTabs = openTabs.filter(t => t.symbol !== sym);
    setOpenTabs(nextTabs);
    if (activeAsset === sym) {
      setActiveAsset(nextTabs[0].symbol);
    }
  };

  const handleAddAssetTab = (sym) => {
    if (!openTabs.find(t => t.symbol === sym)) {
      setOpenTabs(prev => [...prev, { symbol: sym, name: sym, payout: 80, icon: '📈' }]);
    }
    setActiveAsset(sym);
  };

  // Get active tab details
  const activeTabMeta = openTabs.find(t => t.symbol === activeAsset) || {
    symbol: activeAsset,
    payout: 60
  };

  // Price & Candle Scaling: When USD/CAD is selected, adapt to 1.42415
  const isUsdCad = activeAsset.includes('USD/CAD');
  const usdCadScale = 1.42415 / 96420;

  const displayCurrentPrice = isUsdCad 
    ? +(serverPrice * usdCadScale).toFixed(5) 
    : serverPrice;

  const displayCandles = isUsdCad
    ? rawCandles.map(c => ({
        ...c,
        open: +(c.open * usdCadScale).toFixed(5),
        high: +(c.high * usdCadScale).toFixed(5),
        low: +(c.low * usdCadScale).toFixed(5),
        close: +(c.close * usdCadScale).toFixed(5)
      }))
    : rawCandles;

  const displayCurrentCandle = rawCurrentCandle && isUsdCad
    ? {
        ...rawCurrentCandle,
        open: +(rawCurrentCandle.open * usdCadScale).toFixed(5),
        high: +(rawCurrentCandle.high * usdCadScale).toFixed(5),
        low: +(rawCurrentCandle.low * usdCadScale).toFixed(5),
        close: +(rawCurrentCandle.close * usdCadScale).toFixed(5)
      }
    : rawCurrentCandle;

  // Active trades formatted for chart & panel
  const displayActiveTrades = activeTrades.map(t => ({
    ...t,
    amount: currency === 'INR' ? Math.round(t.amount * 85.5) : t.amount,
    entryPrice: isUsdCad ? +(t.entryPrice * usdCadScale).toFixed(5) : t.entryPrice
  }));

  const inrRate = 85.5;
  const rawBal = isDemo ? Number(user?.demoBalance ?? 10000) : Number(user?.balance ?? 0);
  const currentDisplayBalance = currency === 'INR' ? rawBal * inrRate : rawBal;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      height: '100dvh',
      background: '#111622',
      color: '#e8edf5',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* ── Quotex Top Header ── */}
      <Header
        user={user}
        isDemo={isDemo}
        onToggleAccountMode={(demoMode) => {
          setIsDemo(demoMode);
          showToast(demoMode ? 'Switched to Demo Account' : 'Switched to Real Account', 'info');
        }}
        isOnline={isOnline}
        currency={currency}
        onToggleCurrency={handleToggleCurrency}
        onOpenDeposit={() => setDepositOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        onLogout={handleLogout}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onResetBalance={handleResetBalance}
        onOpenMobileMenu={() => setIsMobileNavOpen(true)}
      />

      {/* ── Main Trading Studio (Responsive Studio Layout) ── */}
      <div
        className="trading-studio-layout"
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Left Navigation Rail (Quotex Sidebar + Mobile Drawer) */}
        <Sidebar
          activeNav={activeNav}
          onSelectNav={(nav) => setActiveNav(nav)}
          onOpenSupport={() => setSupportOpen(true)}
          onOpenAccount={() => setAuthOpen(true)}
          onOpenTournaments={() => setTournamentsOpen(true)}
          onOpenMarket={() => setMarketOpen(true)}
          onOpenAdmin={() => setAdminOpen(true)}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onOpenAssetSelect={() => setMarketOpen(true)}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Center: Multi-Asset Tabs + Canvas Chart */}
        <div
          className="chart-area-responsive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Multi-Asset Tabs Bar */}
          <AssetBar
            openTabs={openTabs}
            activeAsset={activeAsset}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onOpenAssetSelect={() => setMarketOpen(true)}
            investmentAmount={betAmount}
            currency={currency}
          />

          {/* Canvas Chart with Quotex Vertical Sentiment Gauge */}
          <Chart
            candles={displayCandles}
            currentCandle={displayCurrentCandle}
            currentPrice={displayCurrentPrice}
            activeTrades={displayActiveTrades}
            roundTimeRemaining={remainingSec}
            candleRemainingSec={candleRemainingSec}
            asset={activeAsset}
            sentimentPool={pool}
            currency={currency}
          />
        </div>

        {/* Right Trading Panel (Exact Quotex Time, Investment, Payout, Buy/Sell, Trades) */}
        <TradingPanel
          amount={betAmount}
          setAmount={setBetAmount}
          balance={currentDisplayBalance}
          isLocked={isLocked}
          onPlaceTrade={handlePlaceTrade}
          asset={activeAsset}
          payoutPct={activeTabMeta.payout}
          currency={currency}
          activeTrades={displayActiveTrades}
          tradeHistory={tradeHistory}
          roundTimeRemaining={remainingSec}
        />
      </div>

      {/* ── Modals & Drawers ── */}
      <TournamentsModal
        isOpen={tournamentsOpen}
        onClose={() => setTournamentsOpen(false)}
      />

      <SupportModal
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
      />

      <OrdersDrawer
        isOpen={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        trades={tradeHistory}
      />

      <DepositDrawer
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        user={user}
        isDemo={isDemo}
        onDeposit={handleDeposit}
        onReset={handleResetBalance}
        showToast={showToast}
      />

      <MarketDrawer
        isOpen={marketOpen}
        onClose={() => setMarketOpen(false)}
        currentAsset={activeAsset}
        onSelectAsset={(selected) => handleAddAssetTab(selected)}
      />

      <ResultModal
        result={resultData}
        onClose={() => setResultData(null)}
      />

      <PwaModal
        isOpen={pwaOpen}
        onClose={() => setPwaOpen(false)}
        installPrompt={deferredPrompt}
        onInstallApp={handleInstallApp}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          showToast(`Logged in as ${authenticatedUser.username}`, 'success');
        }}
        showToast={showToast}
      />

      <AdminPanel
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        showToast={showToast}
      />

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'error' ? 'rgba(255, 74, 74, 0.95)' : 
                      toast.type === 'success' ? 'rgba(15, 175, 89, 0.95)' : 
                      'rgba(0, 119, 255, 0.95)',
          color: '#fff',
          padding: '8px 18px',
          borderRadius: 20,
          fontSize: '0.82rem',
          fontWeight: 700,
          zIndex: 2000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          animation: 'fadeIn 0.2s ease'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
