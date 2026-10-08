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
  onOpenAssetSelect
}) {
  return (
    <aside style={{
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
    }}>
      {/* ── Top: Logo & Plus Button ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
        {/* Quotex-style Cube/Gem Emblem */}
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
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
          }}
          title="Quotex Trading Platform"
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
            boxShadow: '0 3px 10px rgba(0, 119, 255, 0.4)',
            transition: 'transform 0.15s ease'
          }}
          title="Open Asset Selection"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        {/* ── Vertical Navigation Icons ── */}
        <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%', marginTop: 6 }}>
          {/* TRADE */}
          <button
            onClick={() => onSelectNav?.('trade')}
            style={{
              width: '100%',
              padding: '8px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: activeNav === 'trade' ? 'rgba(0, 119, 255, 0.12)' : 'transparent',
              borderLeft: activeNav === 'trade' ? '3px solid #0077ff' : '3px solid transparent',
              color: activeNav === 'trade' ? '#0077ff' : '#7b879c',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.4px' }}>TRADE</span>
          </button>

          {/* SUPPORT */}
          <button
            onClick={onOpenSupport}
            style={{
              width: '100%',
              padding: '8px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              borderLeft: '3px solid transparent',
              color: '#7b879c',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.4px' }}>SUPPORT</span>
          </button>

          {/* ACCOUNT */}
          <button
            onClick={onOpenAccount}
            style={{
              width: '100%',
              padding: '8px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              borderLeft: '3px solid transparent',
              color: '#7b879c',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.4px' }}>ACCOUNT</span>
          </button>

          {/* TOURNAMENTS (with badge '3') */}
          <button
            onClick={onOpenTournaments}
            style={{
              width: '100%',
              padding: '8px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              borderLeft: '3px solid transparent',
              color: '#7b879c',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                <path d="M4 22h16"></path>
                <path d="M10 14.66V17c0 .55-.45 1-1 1H7"></path>
                <path d="M14 14.66V17c0 .55.45 1 1 1h2"></path>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
              </svg>
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
              }}>3</span>
            </div>
            <span style={{ fontSize: '0.54rem', fontWeight: 700, letterSpacing: '0.2px' }}>TOURNAMENTS</span>
          </button>

          {/* MARKET (with badge '4') */}
          <button
            onClick={onOpenMarket}
            style={{
              width: '100%',
              padding: '8px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              borderLeft: '3px solid transparent',
              color: '#7b879c',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                <path d="M3 6h18"></path>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
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
              }}>4</span>
            </div>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.4px' }}>MARKET</span>
          </button>

          {/* MORE (Admin / Tools) */}
          <button
            onClick={onOpenAdmin}
            style={{
              width: '100%',
              padding: '8px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              borderLeft: '3px solid transparent',
              color: '#7b879c',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="More Options & Admin"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="1.5"></circle>
              <circle cx="19" cy="12" r="1.5"></circle>
              <circle cx="5" cy="12" r="1.5"></circle>
            </svg>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.4px' }}>MORE</span>
          </button>
        </nav>
      </div>

      {/* ── Bottom: Sound, Settings & Help Button ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
        {/* Sound toggle button */}
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
          title={isMuted ? 'Sound Muted (Click to Unmute)' : 'Sound Enabled (Click to Mute)'}
        >
          {isMuted ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          )}
        </button>

        {/* HELP Button (Quotex signature green button at bottom) */}
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
            boxShadow: '0 4px 14px rgba(15, 175, 89, 0.4)',
            transition: 'transform 0.15s ease'
          }}
          title="Quotex Help & Live Assistance"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span style={{ fontSize: '0.48rem', fontWeight: 900, marginTop: 1, letterSpacing: '0.3px' }}>HELP</span>
        </button>
      </div>
    </aside>
  );
}
