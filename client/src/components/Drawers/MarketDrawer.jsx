import React from 'react';

export default function MarketDrawer({ isOpen, onClose, currentAsset, onSelectAsset }) {
  if (!isOpen) return null;

  const assets = [
    { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar OTC', payout: '60%', color: '#0077ff', icon: '🇺🇸🇨🇦' },
    { symbol: 'BTC/USDT OTC', name: 'Bitcoin Rapid OTC', payout: '85%', color: '#f7931a', icon: '₿' },
    { symbol: 'EUR/USD OTC', name: 'Euro / US Dollar OTC', payout: '82%', color: '#0faf59', icon: '🇪🇺🇺🇸' },
    { symbol: 'USD/PKR OTC', name: 'US Dollar / Pakistani Rupee OTC', payout: '75%', color: '#14f195', icon: '🇺🇸🇵🇰' },
    { symbol: 'ETH/USDT OTC', name: 'Ethereum Rapid OTC', payout: '85%', color: '#627eea', icon: 'Ξ' },
    { symbol: 'GBP/USD OTC', name: 'British Pound / US Dollar OTC', payout: '80%', color: '#f5a623', icon: '🇬🇧🇺🇸' },
    { symbol: 'SOL/USDT OTC', name: 'Solana Rapid OTC', payout: '82%', color: '#14f195', icon: '◎' }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(6px)',
      padding: 16
    }}>
      <div style={{
        background: '#161c2b',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 480,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: '#131824',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>Select OTC Market</h3>
            <p style={{ fontSize: '0.72rem', color: '#7b879c', margin: 0 }}>Available pairs with real-time payout percentages</p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#8a94a8',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Assets List */}
        <div style={{
          padding: 14,
          maxHeight: 380,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
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
                  background: isSelected ? 'rgba(0, 119, 255, 0.15)' : '#1a2234',
                  border: isSelected ? '1px solid #0077ff' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>{item.symbol}</div>
                    <div style={{ fontSize: '0.7rem', color: '#7b879c' }}>{item.name}</div>
                  </div>
                </div>

                <div style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(15, 175, 89, 0.15)',
                  color: '#0faf59',
                  fontWeight: 800,
                  fontSize: '0.82rem'
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
