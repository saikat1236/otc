import React from 'react';

export default function TradingPanel({
  amount,
  setAmount,
  balance,
  isLocked,
  onPlaceTrade
}) {
  const quickAmounts = [10, 25, 50, 100, 250, 500];
  const payoutMultiplier = 0.85;
  const potentialProfit = +(amount * payoutMultiplier).toFixed(2);

  const handleStep = (delta) => {
    setAmount(prev => Math.max(1, +(prev + delta).toFixed(0)));
  };

  return (
    <div style={{
      padding: '10px 14px',
      background: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      flexShrink: 0
    }}>
      {/* Quick Amount Chips */}
      <div style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        paddingBottom: 2
      }}>
        {quickAmounts.map(val => (
          <button
            key={val}
            onClick={() => setAmount(val)}
            style={{
              flex: '1 0 auto',
              padding: '4px 10px',
              borderRadius: 6,
              background: amount === val ? 'rgba(0, 180, 216, 0.25)' : 'var(--bg-tertiary)',
              border: amount === val ? '1px solid #00b4d8' : '1px solid var(--border-primary)',
              color: amount === val ? '#00b4d8' : '#8a94a8',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            ${val}
          </button>
        ))}
        <button
          onClick={() => setAmount(Math.floor(balance))}
          style={{
            flex: '1 0 auto',
            padding: '4px 10px',
            borderRadius: 6,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
            color: '#ffd700',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          MAX
        </button>
      </div>

      {/* Stepper Input & Profit Preview */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10
      }}>
        {/* Amount Stepper Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-secondary)',
          borderRadius: 8,
          height: 38,
          flex: 1,
          overflow: 'hidden'
        }}>
          <button
            onClick={() => handleStep(-10)}
            style={{
              width: 38,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8a94a8',
              fontSize: '1.2rem',
              fontWeight: 700
            }}
          >
            -
          </button>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.95rem',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            color: '#fff'
          }}>
            $<input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              style={{
                width: 65,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 800,
                textAlign: 'left',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <button
            onClick={() => handleStep(10)}
            style={{
              width: 38,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8a94a8',
              fontSize: '1.2rem',
              fontWeight: 700
            }}
          >
            +
          </button>
        </div>

        {/* Expected Payout Box */}
        <div style={{
          background: 'rgba(0, 229, 160, 0.08)',
          border: '1px solid rgba(0, 229, 160, 0.25)',
          borderRadius: 8,
          padding: '4px 10px',
          height: 38,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-end',
          minWidth: 105
        }}>
          <span style={{ fontSize: '0.62rem', color: '#8a94a8', fontWeight: 600 }}>POTENTIAL RETURN</span>
          <span style={{ fontSize: '0.85rem', color: '#00e5a0', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
            +${potentialProfit}
          </span>
        </div>
      </div>

      {/* Action Buttons: BUY (Call) and SELL (Put) */}
      <div style={{
        display: 'flex',
        gap: 10
      }}>
        {/* BUY / CALL BUTTON */}
        <button
          disabled={isLocked}
          onClick={() => onPlaceTrade('CALL')}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 10,
            background: isLocked 
              ? '#2a344d' 
              : 'linear-gradient(135deg, #00E5A0 0%, #00B87E 100%)',
            boxShadow: isLocked 
              ? 'none' 
              : '0 4px 16px rgba(0, 229, 160, 0.35)',
            color: isLocked ? '#61718c' : '#0a0e17',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            fontWeight: 900,
            fontSize: '1rem',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ lineHeight: 1 }}>BUY</span>
            <span style={{ fontSize: '0.62rem', opacity: 0.85, fontWeight: 700 }}>CALL ▲</span>
          </div>
          <span style={{ fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace' }}>+85%</span>
        </button>

        {/* SELL / PUT BUTTON */}
        <button
          disabled={isLocked}
          onClick={() => onPlaceTrade('PUT')}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 10,
            background: isLocked 
              ? '#2a344d' 
              : 'linear-gradient(135deg, #FF3B5C 0%, #D50000 100%)',
            boxShadow: isLocked 
              ? 'none' 
              : '0 4px 16px rgba(255, 59, 92, 0.35)',
            color: isLocked ? '#61718c' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            fontWeight: 900,
            fontSize: '1rem',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ lineHeight: 1 }}>SELL</span>
            <span style={{ fontSize: '0.62rem', opacity: 0.85, fontWeight: 700 }}>PUT ▼</span>
          </div>
          <span style={{ fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace' }}>+85%</span>
        </button>
      </div>

      {isLocked && (
        <div style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          color: '#ff5252',
          fontWeight: 700,
          letterSpacing: '0.04em'
        }}>
          ROUND LOCKED • SETTLING UNDER COLOR PREDICTION RULE
        </div>
      )}
    </div>
  );
}
