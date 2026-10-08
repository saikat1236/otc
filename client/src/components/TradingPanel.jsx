import React, { useState } from 'react';

export default function TradingPanel({
  amount = 10900,
  setAmount,
  balance = 994592,
  isLocked = false,
  onPlaceTrade,
  asset = 'USD/CAD',
  payoutPct = 60,
  currency = 'INR',
  activeTrades = [],
  tradeHistory = [],
  roundTimeRemaining = 35
}) {
  const [tradeTime, setTradeTime] = useState('00:01:00');
  const [isPendingTrade, setIsPendingTrade] = useState(false);
  const [isPercentMode, setIsPercentMode] = useState(false);
  const [showMobileTrades, setShowMobileTrades] = useState(false);

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Preset chips depending on currency
  const quickAmounts = currency === 'INR' 
    ? [500, 1000, 5000, 10900, 25000]
    : [10, 25, 50, 100, 250];

  const payoutMultiplier = payoutPct / 100;
  const potentialPayout = Math.round(amount * (1 + payoutMultiplier));

  const handleStepAmount = (delta) => {
    const step = currency === 'INR' ? (delta * 100) : delta;
    setAmount(prev => Math.max(1, +(prev + step).toFixed(0)));
  };

  const formatMoney = (val) => {
    return Number(val).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', {
      maximumFractionDigits: 2
    });
  };

  const mm = String(Math.floor(roundTimeRemaining / 60)).padStart(2, '0');
  const ss = String(roundTimeRemaining % 60).padStart(2, '0');
  const timerStr = `${mm}:${ss}`;

  const allTradesCount = activeTrades.length + (tradeHistory.length > 0 ? tradeHistory.length : 1);

  return (
    <div
      className="trading-panel-responsive"
      style={{
        width: 300,
        minWidth: 300,
        height: '100%',
        background: '#161c2b',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        zIndex: 30,
        flexShrink: 0
      }}
    >
      {/* ── Top Header: Asset, Payout & Trades Toggle ── */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>🇺🇸🇨🇦</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem' }}>{asset}</span>
          <span style={{
            color: '#0faf59',
            fontWeight: 800,
            fontSize: '0.72rem',
            background: 'rgba(15, 175, 89, 0.15)',
            padding: '1px 5px',
            borderRadius: 4
          }}>
            {payoutPct}%
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Payout preview */}
          <div style={{ fontSize: '0.75rem', color: '#c5d0e2', fontWeight: 700 }}>
            <span style={{ color: '#7b879c', marginRight: 4 }}>Payout:</span>
            <span style={{ color: '#0faf59', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>
              {formatMoney(potentialPayout)} {currencySymbol}
            </span>
          </div>

          {/* Trades Sheet Toggle on Mobile */}
          <button
            onClick={() => setShowMobileTrades(!showMobileTrades)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 7px',
              borderRadius: 6,
              background: showMobileTrades ? 'rgba(0, 119, 255, 0.25)' : '#232c40',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: showMobileTrades ? '#0077ff' : '#8fa0b5',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>Trades</span>
            <span style={{
              background: '#0077ff',
              color: '#fff',
              fontSize: '0.58rem',
              padding: '1px 4px',
              borderRadius: 8
            }}>
              {allTradesCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── Control Inputs (Time & Investment) ── */}
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flexShrink: 0
      }}>
        {/* Stepper Inputs: 2 Columns Side-by-Side on Mobile, Stacked on Desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 8
        }}>
          {/* TIME BOX */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: '0.68rem', color: '#7b879c', fontWeight: 600 }}>Time</span>
              <span
                onClick={() => setTradeTime(tradeTime === '00:01:00' ? '00:00:30' : '00:01:00')}
                style={{ fontSize: '0.65rem', color: '#0077ff', fontWeight: 700, cursor: 'pointer' }}
              >
                SWITCH
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#121723',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 7,
              overflow: 'hidden',
              height: 36
            }}>
              <button
                onClick={() => setTradeTime('00:00:30')}
                style={{
                  width: 34,
                  height: '100%',
                  color: '#8fa0b5',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                -
              </button>
              <input
                type="text"
                value={tradeTime}
                readOnly
                style={{
                  flex: 1,
                  textAlign: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.85rem'
                }}
              />
              <button
                onClick={() => setTradeTime('00:02:00')}
                style={{
                  width: 34,
                  height: '100%',
                  color: '#8fa0b5',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* INVESTMENT BOX */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: '0.68rem', color: '#7b879c', fontWeight: 600 }}>Investment</span>
              <span
                onClick={() => setIsPercentMode(!isPercentMode)}
                style={{ fontSize: '0.65rem', color: '#0077ff', fontWeight: 700, cursor: 'pointer' }}
              >
                SWITCH
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#121723',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 7,
              overflow: 'hidden',
              height: 36
            }}>
              <button
                onClick={() => handleStepAmount(-1)}
                style={{
                  width: 34,
                  height: '100%',
                  color: '#8fa0b5',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                -
              </button>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2
              }}>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                  style={{
                    width: 70,
                    textAlign: 'right',
                    color: '#fff',
                    fontWeight: 800,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.88rem'
                  }}
                />
                <span style={{ color: '#8fa0b5', fontWeight: 700, fontSize: '0.78rem' }}>{currencySymbol}</span>
              </div>
              <button
                onClick={() => handleStepAmount(1)}
                style={{
                  width: 34,
                  height: '100%',
                  color: '#8fa0b5',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Quick Preset Chips */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 1 }}>
          {quickAmounts.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(q)}
              style={{
                padding: '3px 6px',
                borderRadius: 5,
                background: amount === q ? 'rgba(0, 119, 255, 0.25)' : '#121723',
                border: amount === q ? '1px solid #0077ff' : '1px solid rgba(255, 255, 255, 0.06)',
                color: amount === q ? '#0077ff' : '#8fa0b5',
                fontSize: '0.65rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {q.toLocaleString()} {currencySymbol}
            </button>
          ))}
          <button
            onClick={() => setAmount(Math.floor(balance))}
            style={{
              padding: '3px 6px',
              borderRadius: 5,
              background: '#121723',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: '#ffd700',
              fontSize: '0.65rem',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            MAX
          </button>
        </div>

        {/* ── Action Buttons: Side-by-Side BUY ⬆ and SELL ⬇ ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 2
        }}>
          {/* BUY (Call) Button */}
          <button
            onClick={() => onPlaceTrade('CALL')}
            disabled={isLocked}
            style={{
              height: 44,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0faf59 0%, #009944 100%)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.6 : 1,
              boxShadow: '0 3px 12px rgba(15, 175, 89, 0.35)',
              transition: 'transform 0.1s ease, filter 0.1s ease'
            }}
            onMouseEnter={(e) => !isLocked && (e.currentTarget.style.filter = 'brightness(1.08)')}
            onMouseLeave={(e) => !isLocked && (e.currentTarget.style.filter = 'brightness(1)')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 900, letterSpacing: '0.4px' }}>
                Buy
              </span>
              <span style={{ fontSize: '0.62rem', opacity: 0.85, fontWeight: 700 }}>
                +{payoutPct}%
              </span>
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>⬆</span>
          </button>

          {/* SELL (Put) Button */}
          <button
            onClick={() => onPlaceTrade('PUT')}
            disabled={isLocked}
            style={{
              height: 44,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #ff4a4a 0%, #d62828 100%)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.6 : 1,
              boxShadow: '0 3px 12px rgba(255, 74, 74, 0.35)',
              transition: 'transform 0.1s ease, filter 0.1s ease'
            }}
            onMouseEnter={(e) => !isLocked && (e.currentTarget.style.filter = 'brightness(1.08)')}
            onMouseLeave={(e) => !isLocked && (e.currentTarget.style.filter = 'brightness(1)')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 900, letterSpacing: '0.4px' }}>
                Sell
              </span>
              <span style={{ fontSize: '0.62rem', opacity: 0.85, fontWeight: 700 }}>
                +{payoutPct}%
              </span>
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>⬇</span>
          </button>
        </div>
      </div>

      {/* ── Quotex Order Book / Trades Widget ── */}
      {/* On desktop it always renders. On mobile it expands when showMobileTrades is true */}
      <div
        className={showMobileTrades ? '' : 'desktop-only'}
        style={{
          flex: 1,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#131824',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 120,
          maxHeight: 200
        }}
      >
        {/* Trades Header */}
        <div style={{
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>
              Trades
            </span>
            <span style={{
              background: '#252f44',
              color: '#8fa0b5',
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: 8
            }}>
              {allTradesCount}
            </span>
          </div>

          <span
            onClick={() => setShowMobileTrades(false)}
            style={{ color: '#687790', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            ✕ Close
          </span>
        </div>

        {/* Trade Items List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '4px 8px',
          gap: 4
        }}>
          {/* Active in-flight trades */}
          {activeTrades.map((t, idx) => (
            <div key={`act_${idx}`} style={{
              padding: '6px 8px',
              borderRadius: 6,
              background: '#182030',
              border: '1px solid rgba(0, 119, 255, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: t.direction === 'CALL' ? '#0faf59' : '#ff4a4a',
                    boxShadow: t.direction === 'CALL' ? '0 0 6px #0faf59' : '0 0 6px #ff4a4a'
                  }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{asset}</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: '#0077ff', fontWeight: 800, fontFamily: 'monospace' }}>
                  {timerStr}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
                <span style={{ color: '#8fa0b5' }}>{formatMoney(t.amount)} {currencySymbol}</span>
                <span style={{ color: '#0faf59', fontWeight: 800, fontFamily: 'monospace' }}>
                  +{formatMoney(Math.round(t.amount * (1 + payoutMultiplier)))} {currencySymbol}
                </span>
              </div>
            </div>
          ))}

          {/* Settled Trade History */}
          {(tradeHistory.length > 0 ? tradeHistory : [
            { asset: 'USD/CAD', time: '00:44', amount: 10900, profit: 17440, isWin: true, direction: 'CALL' },
            { asset: 'USD/PKR OTC', time: '00:00:10', amount: 10100, profit: 0, isWin: false, direction: 'PUT' },
            { asset: 'USD/PKR OTC', time: '00:00:10', amount: 10100, profit: 18180, isWin: true, direction: 'CALL' }
          ]).map((item, idx) => (
            <div key={`hist_${idx}`} style={{
              padding: '6px 8px',
              borderRadius: 6,
              background: '#161c2b',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: item.direction === 'CALL' || item.isWin ? '#0faf59' : '#ff4a4a'
                  }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>
                    {item.asset || asset}
                  </span>
                </div>
                <span style={{ fontSize: '0.65rem', color: '#687790', fontFamily: 'monospace' }}>
                  {item.time || '00:44'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
                <span style={{ color: '#8fa0b5' }}>
                  {formatMoney(item.amount)} {currencySymbol}
                </span>
                <span style={{
                  color: item.isWin ? '#0faf59' : '#8fa0b5',
                  fontWeight: 800,
                  fontFamily: 'monospace'
                }}>
                  {item.isWin ? `+${formatMoney(item.profit)} ${currencySymbol}` : `0.00 ${currencySymbol}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
