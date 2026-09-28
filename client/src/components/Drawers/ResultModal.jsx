import React, { useEffect } from 'react';

export default function ResultModal({ result, onClose }) {
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3200);
    return () => clearTimeout(timer);
  }, [result, onClose]);

  if (!result) return null;

  const { winningDirection, userResult, closePrice } = result;
  const hasUserTrade = Boolean(userResult);
  const isWon = userResult?.isWin;
  const isTie = winningDirection === 'TIE';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backdropFilter: 'blur(6px)',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: hasUserTrade 
          ? (isWon ? '1.5px solid #00e5a0' : '1.5px solid #ff3b5c') 
          : '1px solid var(--border-secondary)',
        borderRadius: 16,
        padding: '24px 20px',
        width: '100%',
        maxWidth: 320,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        boxShadow: hasUserTrade && isWon 
          ? '0 0 30px rgba(0, 229, 160, 0.4)' 
          : '0 8px 32px rgba(0,0,0,0.6)',
        animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Animated Icon */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: hasUserTrade
            ? (isWon ? 'rgba(0, 229, 160, 0.2)' : 'rgba(255, 59, 92, 0.2)')
            : 'rgba(0, 180, 216, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem'
        }}>
          {hasUserTrade ? (isWon ? '🎉' : '📉') : '⚖️'}
        </div>

        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: hasUserTrade ? (isWon ? '#00e5a0' : '#ff3b5c') : '#fff'
          }}>
            {hasUserTrade 
              ? (isWon ? 'TRADE WON!' : (isTie ? 'ROUND TIE' : 'TRADE LOST'))
              : 'ROUND SETTLED'}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#8a94a8' }}>
            Result: <strong style={{ color: winningDirection === 'CALL' ? '#00e5a0' : '#ff5252' }}>
              {winningDirection === 'CALL' ? '▲ CALL (UP)' : '▼ PUT (DOWN)'}
            </strong>
          </span>
        </div>

        {hasUserTrade && (
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '8px 16px',
            borderRadius: 8,
            width: '100%'
          }}>
            <div style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              fontFamily: 'JetBrains Mono, monospace',
              color: isWon ? '#00e5a0' : '#ff5252'
            }}>
              {isWon ? `+$${Number(userResult.pnl).toFixed(2)}` : `-$${Number(userResult.amount).toFixed(2)}`}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#8a94a8' }}>
              Close Price: ${Number(closePrice).toFixed(2)}
            </span>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 4,
            padding: '8px 24px',
            borderRadius: 8,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-secondary)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
