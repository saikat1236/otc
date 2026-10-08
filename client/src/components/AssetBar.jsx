import React from 'react';

export default function AssetBar({
  openTabs = [
    { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar OTC', payout: 60, icon: '🇺🇸🇨🇦' },
    { symbol: 'BTC/USDT OTC', name: 'Bitcoin Rapid OTC', payout: 85, icon: '₿' },
    { symbol: 'EUR/USD OTC', name: 'Euro / US Dollar OTC', payout: 82, icon: '🇪🇺🇺🇸' }
  ],
  activeAsset = 'USD/CAD',
  onSelectTab,
  onCloseTab,
  onOpenAssetSelect,
  investmentAmount = 10900,
  currency = 'INR'
}) {
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  return (
    <div style={{
      height: 40,
      background: '#131824',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px',
      gap: 6,
      overflowX: 'auto',
      userSelect: 'none'
    }}>
      {openTabs.map((tab) => {
        const isActive = activeAsset === tab.symbol;
        const potentialProfit = Math.round(investmentAmount * (1 + tab.payout / 100));

        return (
          <div
            key={tab.symbol}
            onClick={() => onSelectTab(tab.symbol)}
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: '6px 6px 0 0',
              background: isActive ? '#182030' : '#141a28',
              borderTop: isActive ? '2px solid #0077ff' : '2px solid transparent',
              borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
              borderRight: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              color: isActive ? '#fff' : '#7b879c',
              fontSize: '0.8rem',
              fontWeight: 700,
              flexShrink: 0,
              transition: 'background 0.15s ease'
            }}
          >
            {/* Currency Flag / Icon */}
            <span style={{ fontSize: '0.85rem' }}>{tab.icon || '📈'}</span>

            {/* Asset Symbol */}
            <span>{tab.symbol}</span>

            {/* Payout % */}
            <span style={{
              fontSize: '0.7rem',
              color: '#0faf59',
              fontWeight: 800
            }}>
              {tab.payout}%
            </span>

            {/* Potential Payout Pill (e.g. +17,440 ₹) */}
            <span style={{
              background: 'rgba(15, 175, 89, 0.15)',
              color: '#0faf59',
              padding: '1px 6px',
              borderRadius: 4,
              fontSize: '0.68rem',
              fontWeight: 800,
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              +{potentialProfit.toLocaleString()} {currencySymbol}
            </span>

            {/* Close Tab Button */}
            {openTabs.length > 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab?.(tab.symbol);
                }}
                style={{
                  color: '#65728a',
                  fontSize: '0.9rem',
                  lineHeight: 1,
                  padding: '2px 4px',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#65728a'}
              >
                ×
              </span>
            )}
          </div>
        );
      })}

      {/* Blue "+" Add Tab Button */}
      <button
        onClick={onOpenAssetSelect}
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          background: 'rgba(0, 119, 255, 0.18)',
          border: '1px solid rgba(0, 119, 255, 0.35)',
          color: '#0077ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontWeight: 800,
          fontSize: '1rem',
          flexShrink: 0
        }}
        title="Add Trading Pair Tab"
      >
        +
      </button>
    </div>
  );
}
