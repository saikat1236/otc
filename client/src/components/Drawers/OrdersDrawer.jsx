import React from 'react';

export default function OrdersDrawer({ isOpen, onClose, trades = [] }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderTop: '1px solid var(--border-secondary)',
        maxHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 16px 24px',
        animation: 'slideUp 0.25s ease'
      }}>
        {/* Drawer Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Trade Records</h3>
          <button
            onClick={onClose}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: 'var(--bg-tertiary)',
              color: '#8a94a8',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Trade List */}
        <div style={{
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          {trades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#61718c' }}>
              No trades placed yet. Choose Call or Put to enter the market.
            </div>
          ) : (
            trades.map((t) => {
              const isWon = t.status === 'WON';
              const isLost = t.status === 'LOST';
              const isCall = t.direction === 'CALL' || t.direction === 'up';

              return (
                <div
                  key={t._id || t.tradeId}
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-primary)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        background: isCall ? 'rgba(0, 229, 160, 0.15)' : 'rgba(255, 59, 92, 0.15)',
                        color: isCall ? '#00e5a0' : '#ff5252'
                      }}>
                        {isCall ? '▲ BUY' : '▼ SELL'}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                        ${Number(t.amount).toFixed(2)}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#8a94a8' }}>
                      Entry: ${Number(t.entryPrice).toFixed(2)} {t.closePrice ? `➔ Close: $${Number(t.closePrice).toFixed(2)}` : ''}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: isWon ? '#00e5a0' : isLost ? '#ff5252' : '#00b4d8'
                    }}>
                      {isWon ? `+$${Number(t.pnl).toFixed(2)}` : isLost ? `-$${Number(t.amount).toFixed(2)}` : 'OPEN'}
                    </div>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: isWon ? '#00e5a0' : isLost ? '#ff5252' : '#8a94a8'
                    }}>
                      {t.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
