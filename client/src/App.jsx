import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import AssetBar from './components/AssetBar.jsx';
import Chart from './components/Chart.jsx';
import PoolBar from './components/PoolBar.jsx';
import TradingPanel from './components/TradingPanel.jsx';
import BottomNav from './components/BottomNav.jsx';
import OrdersDrawer from './components/Drawers/OrdersDrawer.jsx';
import DepositDrawer from './components/Drawers/DepositDrawer.jsx';
import MarketDrawer from './components/Drawers/MarketDrawer.jsx';
import ResultModal from './components/Drawers/ResultModal.jsx';
import PwaModal from './components/Drawers/PwaModal.jsx';
import { socket, userId } from './services/socket.js';
import { sounds } from './services/sound.js';

export default function App() {
  // Connection & User State
  const [isOnline, setIsOnline] = useState(false);
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(9379.63);

  // Market & Engine State
  const [asset, setAsset] = useState('BTC/USDT OTC');
  const [currentPrice, setCurrentPrice] = useState(96420.50);
  const [candles, setCandles] = useState([]);
  const [currentCandle, setCurrentCandle] = useState(null);
  const [round, setRound] = useState(null);
  const [remainingSec, setRemainingSec] = useState(30);
  const [candleRemainingSec, setCandleRemainingSec] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [pool, setPool] = useState({ callAmount: 180, putAmount: 120, callPct: 60, putPct: 40 });

  // User Trades State
  const [activeTrades, setActiveTrades] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [betAmount, setBetAmount] = useState(50);

  // Audio & UI Controls
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('trade');

  // Drawers & Modals
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [pwaOpen, setPwaOpen] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [toast, setToast] = useState(null);

  // PWA Install Prompt Handler
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('TradeNext PWA Installed!', 'success');
      }
      setDeferredPrompt(null);
      setPwaOpen(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
        setUser(data.user);
        setBalance(data.user.demoBalance ?? 9379.63);
      }
      if (data.candles) setCandles(data.candles);
      if (data.currentCandle) setCurrentCandle(data.currentCandle);
      if (data.currentPrice) setCurrentPrice(data.currentPrice);
      if (data.round) {
        setRound(data.round);
        setRemainingSec(data.round.remainingSec);
        setIsLocked(data.round.isLocked);
        if (data.round.pool) setPool(data.round.pool);
      }
      if (data.activeTrades) setActiveTrades(data.activeTrades);
    });

    socket.on('TICK', (data) => {
      setCurrentPrice(data.price);
      if (data.candle) setCurrentCandle(data.candle);
      if (typeof data.remainingSec === 'number') {
        setRemainingSec(data.remainingSec);
      }
      if (typeof data.candleRemainingSec === 'number') {
        setCandleRemainingSec(data.candleRemainingSec);
      }
    });

    socket.on('CANDLE_CLOSE', (data) => {
      if (data.candle) {
        setCandles(prev => {
          const next = [...prev, data.candle];
          return next.length > 70 ? next.slice(-70) : next;
        });
      }
      if (data.newCandle) {
        setCurrentCandle(data.newCandle);
      }
    });

    socket.on('POOL_UPDATE', (updatedPool) => {
      setPool(updatedPool);
    });

    socket.on('ROUND_LOCKED', (data) => {
      setIsLocked(true);
      showToast('Bets locked. Settling round...', 'warning');
    });

    socket.on('NEW_ROUND', (roundData) => {
      setRound(roundData);
      setRemainingSec(roundData.remainingSec);
      setIsLocked(false);
      setPool(roundData.pool);
      setActiveTrades([]); // Clear in-flight trades for the new round
    });

    socket.on('TRADE_CONFIRMED', (data) => {
      sounds.playBet();
      setActiveTrades(prev => [...prev, data.trade]);
      setBalance(data.newBalance);
      showToast(`Order Placed: ${data.trade.direction} $${data.trade.amount}`, 'success');
      // Fetch updated history
      fetchTradeHistory();
    });

    socket.on('TRADE_ERROR', (err) => {
      showToast(err.message || 'Trade Error', 'error');
    });

    socket.on('ROUND_RESOLVED', (data) => {
      // Find if current user had a trade in this round
      const myResult = data.results?.find(r => r.userId === userId);
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

      // Refresh balance and history from server
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
  }, []);

  // Fetch helpers
  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`/api/user/${userId}`);
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setBalance(data.user.demoBalance);
      }
    } catch (e) {
      console.warn('Error fetching user', e);
    }
  };

  const fetchTradeHistory = async () => {
    try {
      const res = await fetch(`/api/trades/${userId}`);
      const data = await res.json();
      if (data.success && data.trades) {
        setTradeHistory(data.trades);
      }
    } catch (e) {
      console.warn('Error fetching trades', e);
    }
  };

  // Place Trade Action
  const handlePlaceTrade = (direction) => {
    if (balance < betAmount) {
      showToast('Insufficient balance for this trade', 'error');
      return;
    }
    socket.emit('PLACE_TRADE', {
      amount: betAmount,
      direction,
      isDemo: true
    });
  };

  // Deposit Actions
  const handleDeposit = async (amount) => {
    try {
      const res = await fetch('/api/user/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount, isDemo: true })
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.user.demoBalance);
        showToast(`Successfully deposited +$${amount.toFixed(2)}`, 'success');
      }
    } catch (e) {
      showToast('Deposit failed', 'error');
    }
  };

  const handleResetBalance = async () => {
    try {
      const res = await fetch('/api/user/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isDemo: true })
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.user.demoBalance);
        showToast('Balance reset to $9,379.63', 'info');
      }
    } catch (e) {
      showToast('Reset failed', 'error');
    }
  };

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    showToast(muted ? 'Sound Muted' : 'Sound Enabled', 'info');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      maxWidth: 450,
      margin: '0 auto',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      position: 'relative',
      overflow: 'hidden',
      borderLeft: '1px solid rgba(255,255,255,0.06)',
      borderRight: '1px solid rgba(255,255,255,0.06)'
    }}>
      {/* Top Header */}
      <Header
        balance={balance}
        isOnline={isOnline}
        onOpenDeposit={() => setDepositOpen(true)}
      />

      {/* Asset Bar */}
      <AssetBar
        asset={asset}
        currentPrice={currentPrice}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onOpenAssetSelect={() => setMarketOpen(true)}
      />

      {/* Live Candlestick Canvas Chart with Trade Overlay */}
      <Chart
        candles={candles}
        currentCandle={currentCandle}
        currentPrice={currentPrice}
        activeTrades={activeTrades}
        roundTimeRemaining={remainingSec}
        candleRemainingSec={candleRemainingSec}
        roundDuration={30}
        asset={asset}
      />

      {/* Color-Prediction Dynamic Sentiment Pool Bar */}
      <PoolBar
        pool={pool}
        remainingSec={remainingSec}
        isLocked={isLocked}
      />

      {/* Quick Trading Amount & Action Buttons (BUY/SELL) */}
      <TradingPanel
        amount={betAmount}
        setAmount={setBetAmount}
        balance={balance}
        isLocked={isLocked}
        onPlaceTrade={handlePlaceTrade}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenOrders={() => {
          fetchTradeHistory();
          setOrdersOpen(true);
        }}
        onOpenMarket={() => setMarketOpen(true)}
        onOpenWallet={() => setDepositOpen(true)}
        onOpenPwa={() => setPwaOpen(true)}
      />

      {/* Drawers & Modals */}
      <OrdersDrawer
        isOpen={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        trades={tradeHistory}
      />

      <DepositDrawer
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        currentBalance={balance}
        onDeposit={handleDeposit}
        onReset={handleResetBalance}
      />

      <MarketDrawer
        isOpen={marketOpen}
        onClose={() => setMarketOpen(false)}
        currentAsset={asset}
        onSelectAsset={(selected) => setAsset(selected)}
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

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'error' ? 'rgba(255, 59, 92, 0.95)' : 
                      toast.type === 'success' ? 'rgba(0, 229, 160, 0.95)' : 
                      'rgba(0, 180, 216, 0.95)',
          color: toast.type === 'success' ? '#0a0e17' : '#fff',
          padding: '8px 16px',
          borderRadius: 20,
          fontSize: '0.8rem',
          fontWeight: 700,
          zIndex: 200,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
          animation: 'fadeIn 0.2s ease'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
