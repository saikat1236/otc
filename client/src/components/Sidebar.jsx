import React from 'react';

export default function Sidebar({
  activeNav = 'trade',
  onSelectNav,
  onOpenSupport,
  onOpenAccount,
  onOpenTournaments,
  onOpenMarket,
  onOpenAdmin,
  isMuted,
  onToggleMute,
  onOpenAssetSelect,
  isMobileOpen = false,
  onCloseMobile
}) {
  const navItems = [
    {
      id: 'trade',
      label: 'TRADE',
      action: () => { onSelectNav?.('trade'); onCloseMobile?.(); },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      )
    },
    {
      id: 'support',
      label: 'SUPPORT',
      action: () => { onOpenSupport?.(); onCloseMobile?.(); },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
        </svg>
      )
    },
    {
      id: 'account',
      label: 'ACCOUNT',
      action: () => { onOpenAccount?.(); onCloseMobile?.(); },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
    {
      id: 'tournaments',
      label: 'TOURNAMENTS',
      badge: '3',
      action: () => { onOpenTournaments?.(); onCloseMobile?.(); },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
          <path d="M4 22h16"></path>
          <path d="M10 14.66V17c0 .55-.45 1-1 1H7"></path>
          <path d="M14 14.66V17c0 .55.45 1 1 1h2"></path>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
        </svg>
      )
    },
    {
      id: 'market',
      label: 'MARKET',
      badge: '4',
      action: () => { onOpenMarket?.(); onCloseMobile?.(); },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
          <path d="M3 6h18"></path>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      )
    },
    {
      id: 'more',
      label: 'MORE',
      action: () => { onOpenAdmin?.(); onCloseMobile?.(); },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="1.5"></circle>
          <circle cx="19" cy="12" r="1.5"></circle>
          <circle cx="5" cy="12" r="1.5"></circle>
        </svg>
      )
    }
  ];

  return (
    <>
      {/* ── Desktop Rail Sidebar ── */}
      <aside
        className="desktop-sidebar-rail"
        style={{
          width: 68,
          minWidth: 68,
          height: '100%',
          background: '#131824',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 0',
          zIndex: 40,
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
          {/* Logo Mark */}
          <div 
            onClick={() => onSelectNav?.('trade')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00e5a0" />
              <path d="M2 17L12 22L22 17" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="#00e5a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Blue "+" Add Asset Button */}
          <button
            onClick={onOpenAssetSelect}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0077ff 0%, #0055cc 100%)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(0, 119, 255, 0.4)'
            }}
            title="Open Asset Selection"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>

          {/* Vertical Navigation Icons */}
          <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%', marginTop: 6 }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  background: activeNav === item.id ? 'rgba(0, 119, 255, 0.12)' : 'transparent',
                  borderLeft: activeNav === item.id ? '3px solid #0077ff' : '3px solid transparent',
                  color: activeNav === item.id ? '#0077ff' : '#7b879c',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ position: 'relative' }}>
                  {item.icon}
                  {item.badge && (
                    <span style={{
                      position: 'absolute',
                      top: -5,
                      right: -8,
                      background: '#0077ff',
                      color: '#fff',
                      fontSize: '0.55rem',
                      fontWeight: 800,
                      padding: '1px 4px',
                      borderRadius: 8,
                      lineHeight: 1
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.3px' }}>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
          <button
            onClick={onToggleMute}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: isMuted ? 'rgba(255, 74, 74, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: isMuted ? '#ff4a4a' : '#7b879c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            onClick={onOpenSupport}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: 'linear-gradient(135deg, #0faf59 0%, #009944 100%)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(15, 175, 89, 0.4)'
            }}
          >
            <span style={{ fontSize: '0.8rem' }}>?</span>
            <span style={{ fontSize: '0.48rem', fontWeight: 900 }}>HELP</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Slide-In Navigation Drawer ── */}
      {isMobileOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          zIndex: 500,
          backdropFilter: 'blur(4px)',
          display: 'flex'
        }}>
          <div style={{
            width: 270,
            maxWidth: '80%',
            height: '100%',
            background: '#131824',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px 14px',
            animation: 'slideInLeft 0.25s ease'
          }}>
            <div>
              {/* Drawer Top Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #0077ff 0%, #00e5a0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#ffffff" />
                      <path d="M2 17L12 22L22 17" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, color: '#fff', fontSize: '0.95rem' }}>QUOTEX OTC</div>
                    <div style={{ fontSize: '0.62rem', color: '#687790' }}>Trading Studio</div>
                  </div>
                </div>

                <button
                  onClick={onCloseMobile}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#8fa0b5',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Mobile Drawer Menu Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {navItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={item.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: activeNav === item.id ? 'rgba(0, 119, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: activeNav === item.id ? '#0077ff' : '#c5d0e2',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span style={{
                        background: '#0077ff',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 10
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Bottom Controls */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={onToggleMute}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#c5d0e2',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>{isMuted ? '🔇' : '🔊'}</span>
                <span>{isMuted ? 'Unmute Sounds' : 'Mute Sounds'}</span>
              </button>

              <button
                onClick={() => { onOpenSupport?.(); onCloseMobile?.(); }}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0faf59 0%, #009944 100%)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                24/7 Live Support
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }} onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
}
