import React from 'react';

export default function BottomNav({ activeTab, setActiveTab, onOpenOrders, onOpenMarket, onOpenWallet, onOpenPwa }) {
  const tabs = [
    { id: 'trade', label: 'Trade', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ), action: () => setActiveTab('trade') },
    { id: 'orders', label: 'Orders', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    ), action: onOpenOrders },
    { id: 'market', label: 'Market', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
      </svg>
    ), action: onOpenMarket },
    { id: 'wallet', label: 'Wallet', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        <path d="M7 15h0M2 10h20"></path>
      </svg>
    ), action: onOpenWallet },
    { id: 'pwa', label: 'PWA App', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
      </svg>
    ), action: onOpenPwa }
  ];

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: 54,
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-primary)',
      flexShrink: 0,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 50
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={tab.action}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              flex: 1,
              height: '100%',
              color: isActive ? '#00b4d8' : '#61718c',
              fontSize: '0.68rem',
              fontWeight: isActive ? 700 : 500,
              transition: 'color 0.15s ease'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
