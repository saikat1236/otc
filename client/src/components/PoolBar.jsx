import React from 'react';

export default function PoolBar({ pool, remainingSec, isLocked }) {
  const callAmount = pool?.callAmount || 0;
  const putAmount = pool?.putAmount || 0;
  const callPct = pool?.callPct ?? 50;
  const putPct = pool?.putPct ?? 50;

  const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const ss = String(remainingSec % 60).padStart(2, '0');

  // Determine which side is lower (the winning target in color prediction)
  const isCallLower = callAmount < putAmount;
  const isPutLower = putAmount < callAmount;

  return (
    <div style={{
      padding: '8px 14px',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-primary)',
      borderBottom: '1px solid var(--border-primary)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }}>
      {/* Top Pool Row with Round Timer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem'
      }}>
        {/* CALL Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ 
            color: '#00e5a0', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3 
          }}>
            ▲ CALL ${callAmount.toFixed(0)}
          </span>
          <span style={{ color: '#8a94a8', fontSize: '0.72rem' }}>({callPct}%)</span>
          {isCallLower && (
            <span style={{
              background: 'rgba(0, 229, 160, 0.2)',
              color: '#00e5a0',
              padding: '1px 4px',
              borderRadius: 3,
              fontSize: '0.65rem',
              fontWeight: 700
            }}>
              ★ LOWEST
            </span>
          )}
        </div>

        {/* Live Round Countdown Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: isLocked ? 'rgba(255, 59, 92, 0.18)' : 'rgba(0, 180, 216, 0.15)',
          border: isLocked ? '1px solid rgba(255, 59, 92, 0.5)' : '1px solid rgba(0, 180, 216, 0.3)',
          padding: '2px 8px',
          borderRadius: 12,
          color: isLocked ? '#ff5252' : '#00b4d8',
          fontWeight: 800,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.78rem'
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isLocked ? '#ff5252' : '#00b4d8',
            display: 'inline-block',
            animation: 'pulse 1s infinite'
          }}></span>
          <span>{isLocked ? 'LOCKED' : `${mm}:${ss}`}</span>
        </div>

        {/* PUT Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isPutLower && (
            <span style={{
              background: 'rgba(255, 59, 92, 0.2)',
              color: '#ff5252',
              padding: '1px 4px',
              borderRadius: 3,
              fontSize: '0.65rem',
              fontWeight: 700
            }}>
              ★ LOWEST
            </span>
          )}
          <span style={{ color: '#8a94a8', fontSize: '0.72rem' }}>({putPct}%)</span>
          <span style={{ 
            color: '#ff5252', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3 
          }}>
            ▼ PUT ${putAmount.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Two-Tone Sentiment Bar */}
      <div style={{
        height: 6,
        borderRadius: 4,
        background: '#1a2138',
        display: 'flex',
        overflow: 'hidden',
        width: '100%'
      }}>
        <div style={{
          width: `${callPct}%`,
          background: 'linear-gradient(90deg, #00b87e, #00e5a0)',
          transition: 'width 0.4s ease'
        }}></div>
        <div style={{
          width: `${putPct}%`,
          background: 'linear-gradient(90deg, #ff5252, #d50000)',
          transition: 'width 0.4s ease'
        }}></div>
      </div>
    </div>
  );
}
