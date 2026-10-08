import React, { useState } from 'react';

export default function Header({
  user,
  isDemo,
  onToggleAccountMode,
  isOnline,
  currency = 'INR',
  onToggleCurrency,
  onOpenDeposit,
  onOpenAuth,
  onOpenAdmin,
  onLogout,
  isMuted,
  onToggleMute,
  onResetBalance,
  onOpenMobileMenu
}) {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(1);

  // Balances
  const rawDemo = Number(user?.demoBalance ?? 10000);
  const rawReal = Number(user?.balance ?? 0);

  const inrRate = 85.5;
  const demoDisplay = currency === 'INR' ? rawDemo * inrRate : rawDemo;
  const realDisplay = currency === 'INR' ? rawReal * inrRate : rawReal;
  const currentDisplay = isDemo ? demoDisplay : realDisplay;

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const formatMoney = (val) => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(val);
  };

  const formattedCurrent = `${currencySymbol}${formatMoney(currentDisplay)}`;
  const formattedReal = `${currencySymbol}${formatMoney(realDisplay)}`;
  const formattedDemo = `${currencySymbol}${formatMoney(demoDisplay)}`;

  const isAdmin = user?.role === 'admin';

  return (
    <header id="top-header">
      {/* ── Left: Hamburger Menu (Mobile), Logo & Promo Banner ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {/* Mobile Hamburger Button */}
        <button
          className="mobile-hamburger-btn"
          onClick={onOpenMobileMenu}
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0
          }}
          title="Open Menu"
        >
          <span style={{ width: 16, height: 2, background: '#fff', borderRadius: 1 }} />
          <span style={{ width: 16, height: 2, background: '#fff', borderRadius: 1 }} />
          <span style={{ width: 16, height: 2, background: '#fff', borderRadius: 1 }} />
        </button>

        {/* Quotex Logo Mark & Text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Geometric cube mark */}
          <div style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #0077ff 0%, #00e5a0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 119, 255, 0.4)'
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#ffffff" />
              <path d="M2 17L12 22L22 17" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#fff', letterSpacing: '0.4px' }}>
                QUOTEX
              </span>
              <span style={{
                fontSize: '0.55rem',
                fontWeight: 800,
                padding: '1px 3px',
                borderRadius: 3,
                background: 'rgba(0, 229, 160, 0.15)',
                color: '#00e5a0',
                border: '1px solid rgba(0, 229, 160, 0.3)'
              }}>
                OTC
              </span>
            </div>
            <span className="desktop-only" style={{ fontSize: '0.58rem', color: '#687790', fontWeight: 600, letterSpacing: '0.3px', marginTop: -2 }}>
              WEB TRADING PLATFORM
            </span>
          </div>
        </div>

        {/* Quotex Rocket 50% Deposit Banner */}
        <div 
          onClick={onOpenDeposit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            background: 'linear-gradient(90deg, rgba(15, 175, 89, 0.22) 0%, rgba(0, 180, 216, 0.22) 100%)',
            border: '1px solid rgba(15, 175, 89, 0.45)',
            borderRadius: 16,
            cursor: 'pointer',
            flexShrink: 0
          }}
          title="Deposit now to claim your 50% bonus!"
        >
          <span style={{ fontSize: '0.85rem' }}>🚀</span>
          <span className="desktop-only" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e8edf5' }}>
            Get a 50% bonus on your deposit!
          </span>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            background: '#0faf59',
            color: '#fff',
            padding: '1px 5px',
            borderRadius: 8
          }}>
            50%
          </span>
        </div>
      </div>

      {/* ── Right: Currency, Notifications, Account Pill, Deposit ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Currency Switcher Pill (₹ vs $) */}
        <button
          onClick={onToggleCurrency}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            padding: '3px 6px',
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#8fa0b5',
            fontSize: '0.68rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          title="Switch currency"
        >
          <span>{currency === 'INR' ? '₹' : '$'}</span>
        </button>

        {/* Notification Bell (Desktop only or compact) */}
        <div className="desktop-only" style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadNotifications(0);
            }}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: '#8fa0b5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
            title="Notifications"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadNotifications > 0 && (
              <span style={{
                position: 'absolute',
                top: 4,
                right: 5,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#ff4a4a',
                border: '1px solid #131824'
              }} />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '115%',
              right: 0,
              width: 250,
              background: '#161c2b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 10,
              padding: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              zIndex: 300
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>Notifications</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ padding: 6, borderRadius: 6, background: '#1a2234', fontSize: '0.72rem', color: '#c5d0e2' }}>
                  🎉 Welcome to Quotex OTC! Payouts up to 95%.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Mode Dropdown Pill */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: '#1a2133',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '3px 8px',
              borderRadius: 7,
              cursor: 'pointer',
              color: '#fff',
              textAlign: 'right'
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>{isDemo ? '🎓' : '💼'}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{
                  fontSize: '0.52rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: isDemo ? '#a0aec0' : '#00e5a0'
                }}>
                  {isDemo ? 'DEMO' : 'LIVE'}
                </span>
                <span style={{ fontSize: '0.55rem', color: '#718096' }}>▾</span>
              </div>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                fontFamily: 'JetBrains Mono, monospace',
                color: '#fff',
                lineHeight: 1.1
              }}>
                {formattedCurrent}
              </span>
            </div>
          </button>

          {/* Account Dropdown Menu */}
          {showAccountDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: 220,
                background: '#161c2b',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 10,
                padding: 8,
                boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                zIndex: 300
              }}
              onMouseLeave={() => setShowAccountDropdown(false)}
            >
              {/* Demo Account */}
              <div
                onClick={() => {
                  onToggleAccountMode(true);
                  setShowAccountDropdown(false);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: isDemo ? 'rgba(255, 215, 0, 0.12)' : 'transparent',
                  border: isDemo ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  marginBottom: 4
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ffd700' }}>🎓 Demo Account</span>
                  {isDemo && <span style={{ fontSize: '0.65rem', color: '#ffd700', fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'monospace', color: '#fff', marginTop: 2 }}>
                  {formattedDemo}
                </div>
              </div>

              {/* Live Account */}
              <div
                onClick={() => {
                  onToggleAccountMode(false);
                  setShowAccountDropdown(false);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: !isDemo ? 'rgba(15, 175, 89, 0.12)' : 'transparent',
                  border: !isDemo ? '1px solid rgba(15, 175, 89, 0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  marginBottom: 6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0faf59' }}>💼 Live Account</span>
                  {!isDemo && <span style={{ fontSize: '0.65rem', color: '#0faf59', fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'monospace', color: '#fff', marginTop: 2 }}>
                  {formattedReal}
                </div>
              </div>

              {/* Refill Demo */}
              {onResetBalance && (
                <button
                  onClick={() => {
                    onResetBalance();
                    setShowAccountDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 0',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#ffd700',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                  }}
                >
                  <span>🔄</span>
                  <span>Refill Demo Balance</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* "+ Deposit" Button */}
        <button
          onClick={onOpenDeposit}
          style={{
            background: 'linear-gradient(135deg, #0faf59 0%, #00a64c 100%)',
            border: 'none',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.75rem',
            padding: '5px 10px',
            borderRadius: 7,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 2px 8px rgba(15, 175, 89, 0.35)',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>+</span>
          <span>Deposit</span>
        </button>

        {/* "Withdrawal" Button (Desktop only) */}
        <button
          className="desktop-only"
          onClick={onOpenDeposit}
          style={{
            background: '#1f2738',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#c5d0e2',
            fontWeight: 700,
            fontSize: '0.75rem',
            padding: '5px 10px',
            borderRadius: 7,
            cursor: 'pointer'
          }}
        >
          Withdrawal
        </button>

        {/* Admin Link (Desktop only) */}
        {isAdmin && (
          <button
            className="desktop-only"
            onClick={onOpenAdmin}
            style={{
              background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
              border: 'none',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.7rem',
              padding: '5px 8px',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Admin
          </button>
        )}

        {/* User Profile */}
        <button
          onClick={onOpenAuth}
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontSize: '0.78rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
          title={user?.username || 'User Profile'}
        >
          {user?.username ? user.username.charAt(0).toUpperCase() : '👤'}
        </button>
      </div>
    </header>
  );
}
