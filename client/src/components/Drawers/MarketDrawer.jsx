import React from 'react';

export default function MarketDrawer({ isOpen, onClose, currentAsset, onSelectAsset }) {
  if (!isOpen) return null;

  const assets = [
    { symbol: 'BTC/USDT OTC', name: 'Bitcoin OTC Rapid', payout: '85%', color: '#f7931a' },
    { symbol: 'ETH/USDT OTC', name: 'Ethereum OTC Rapid', payout: '85%', color: '#627eea' },
    { symbol: 'SOL/USDT OTC', name: 'Solana OTC Rapid', payout: '82%', color: '#14f195' },
    { symbol: 'XRP/USDT OTC', name: 'Ripple OTC Rapid', payout: '80%', color: '#23292f' }
  ];

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
        padding: '20px 18px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        animation: 'slideUp 0.25s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Select OTC Market</h3>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {assets.map((item) => {
            const isSelected = currentAsset === item.symbol;
            return (
              <div
                key={item.symbol}
                onClick={() => {
                  onSelectAsset(item.symbol);
                  onClose();
                }}
                style={{
                  background: isSelected ? 'rgba(0, 180, 216, 0.15)' : 'var(--bg-tertiary)',
                  border: isSelected ? '1px solid #00b4d8' : '1px solid var(--border-primary)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: item.color,
                    display: 'inline-block'
                  }}></span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>{item.symbol}</div>
                    <div style={{ fontSize: '0.72rem', color: '#8a94a8' }}>{item.name}</div>
                  </div>
                </div>

                <div style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(0, 229, 160, 0.12)',
                  color: '#00e5a0',
                  fontWeight: 800,
                  fontSize: '0.78rem'
                }}>
                  {item.payout}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
