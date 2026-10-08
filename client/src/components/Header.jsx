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
  onResetBalance
}) {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(1);

  // Balances
  const rawDemo = Number(user?.demoBalance ?? 10000);
  const rawReal = Number(user?.balance ?? 0);

  // If currency is INR, scale by e.g. 83 or show INR values like ₹994,592.00
  // To match the user's screenshot exactly (₹994,592.00):
  const inrRate = 85.5;
  const demoDisplay = currency === 'INR' ? rawDemo * inrRate : rawDemo;
  const realDisplay = currency === 'INR' ? rawReal * inrRate : rawReal;
  const currentDisplay = isDemo ? demoDisplay : realDisplay;

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const formatMoney = (val) => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const formattedCurrent = `${currencySymbol}${formatMoney(currentDisplay)}`;
  const formattedReal = `${currencySymbol}${formatMoney(realDisplay)}`;
  const formattedDemo = `${currencySymbol}${formatMoney(demoDisplay)}`;

  const isAdmin = user?.role === 'admin';

  return (
    <header id="top-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 52,
      padding: '0 16px',
      background: '#131824',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'relative',
      zIndex: 100,
      userSelect: 'none'
    }}>
      {/* ── Left: Quotex Platform Branding & Promotional Banner ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Quotex Logo & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Geometric cube mark */}
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: 'linear-gradient(135deg, #0077ff 0%, #00e5a0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 119, 255, 0.4)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#ffffff" />
              <path d="M2 17L12 22L22 17" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#fff', letterSpacing: '0.5px' }}>
                QUOTEX
              </span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '1px 4px',
                borderRadius: 3,
                background: 'rgba(0, 229, 160, 0.15)',
                color: '#00e5a0',
                border: '1px solid rgba(0, 229, 160, 0.3)'
              }}>
                OTC
              </span>
            </div>
            <span style={{ fontSize: '0.62rem', color: '#687790', fontWeight: 600, letterSpacing: '0.4px', marginTop: -2 }}>
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
            gap: 8,
            padding: '4px 12px',
            background: 'linear-gradient(90deg, rgba(15, 175, 89, 0.22) 0%, rgba(0, 180, 216, 0.22) 100%)',
            border: '1px solid rgba(15, 175, 89, 0.45)',
            borderRadius: 20,
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 2px 10px rgba(15, 175, 89, 0.15)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Deposit now to claim your 50% bonus!"
        >
          <span style={{ fontSize: '0.95rem' }}>🚀</span>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#e8edf5' }}>
            Get a 50% bonus on your deposit!
          </span>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            background: '#0faf59',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: 10
          }}>
            50%
          </span>
        </div>
      </div>

      {/* ── Right: Notification, Sound, Account Pill, Deposit & Withdrawal ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Currency Switcher Pill (₹ INR vs $ USD) */}
        <button
          onClick={onToggleCurrency}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#8fa0b5',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          title="Switch currency between INR (₹) and USD ($)"
        >
          <span>{currency === 'INR' ? '🇮🇳 ₹ INR' : '🇺🇸 $ USD'}</span>
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadNotifications(0);
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
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
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadNotifications > 0 && (
              <span style={{
                position: 'absolute',
                top: 5,
                right: 6,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#ff4a4a',
                border: '1.5px solid #131824'
              }} />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '115%',
              right: 0,
              width: 270,
              background: '#161c2b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 10,
              padding: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              zIndex: 300
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>Notifications</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ padding: 8, borderRadius: 6, background: '#1a2234', fontSize: '0.74rem', color: '#c5d0e2' }}>
                  🎉 Welcome to Quotex OTC! Enjoy lightning-fast payouts up to 95%.
                </div>
                <div style={{ padding: 8, borderRadius: 6, background: '#1a2234', fontSize: '0.74rem', color: '#c5d0e2' }}>
                  ⚡ Market Volatility Alert: High OTC trading volume on USD/CAD and BTC/USDT.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Mode Dropdown Pill (DEMO ACCOUNT ₹994,592.00) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#1a2133',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '4px 10px',
              borderRadius: 8,
              cursor: 'pointer',
              color: '#fff',
              textAlign: 'right'
            }}
          >
            {/* Graduation Cap / Demo Icon */}
            <div style={{
              color: isDemo ? '#ffd700' : '#0faf59',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              {isDemo ? '🎓' : '💼'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: isDemo ? '#a0aec0' : '#00e5a0',
                  letterSpacing: '0.4px'
                }}>
                  {isDemo ? 'DEMO ACCOUNT' : 'LIVE ACCOUNT'}
                </span>
                <span style={{ fontSize: '0.62rem', color: '#718096' }}>▾</span>
              </div>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                fontFamily: 'JetBrains Mono, monospace',
                color: '#fff'
              }}>
                {formattedCurrent}
              </span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showAccountDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: 240,
                background: '#161c2b',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 10,
                padding: 10,
                boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                zIndex: 300
              }}
              onMouseLeave={() => setShowAccountDropdown(false)}
            >
              {/* Demo Account Option */}
              <div
                onClick={() => {
                  onToggleAccountMode(true);
                  setShowAccountDropdown(false);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: isDemo ? 'rgba(255, 215, 0, 0.12)' : 'transparent',
                  border: isDemo ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  marginBottom: 6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffd700' }}>🎓 Demo Account</span>
                  {isDemo && <span style={{ fontSize: '0.7rem', color: '#ffd700', fontWeight: 700 }}>Active</span>}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, fontFamily: 'monospace', color: '#fff', marginTop: 3 }}>
                  {formattedDemo}
                </div>
              </div>

              {/* Live Account Option */}
              <div
                onClick={() => {
                  onToggleAccountMode(false);
                  setShowAccountDropdown(false);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: !isDemo ? 'rgba(15, 175, 89, 0.12)' : 'transparent',
                  border: !isDemo ? '1px solid rgba(15, 175, 89, 0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  marginBottom: 8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0faf59' }}>💼 Live Account</span>
                  {!isDemo && <span style={{ fontSize: '0.7rem', color: '#0faf59', fontWeight: 700 }}>Active</span>}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, fontFamily: 'monospace', color: '#fff', marginTop: 3 }}>
                  {formattedReal}
                </div>
              </div>

              {/* Refill Demo Balance Button */}
              {onResetBalance && (
                <button
                  onClick={() => {
                    onResetBalance();
                    setShowAccountDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 0',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#ffd700',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <span>🔄</span>
                  <span>Refill Demo to {currencySymbol}{currency === 'INR' ? '994,592' : '10,000'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* "+ Deposit" Button (Quotex Signature Vibrant Green) */}
        <button
          onClick={onOpenDeposit}
          style={{
            background: 'linear-gradient(135deg, #0faf59 0%, #00a64c 100%)',
            border: 'none',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.82rem',
            padding: '7px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 3px 12px rgba(15, 175, 89, 0.4)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
          <span>Deposit</span>
        </button>

        {/* "Withdrawal" Button (Slate grey) */}
        <button
          onClick={onOpenDeposit}
          style={{
            background: '#1f2738',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#c5d0e2',
            fontWeight: 700,
            fontSize: '0.78rem',
            padding: '7px 14px',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#283348'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1f2738'}
        >
          Withdrawal
        </button>

        {/* Admin Link if Admin */}
        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            style={{
              background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
              border: 'none',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.72rem',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Admin
          </button>
        )}

        {/* User Account / Profile */}
        <button
          onClick={onOpenAuth}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title={user?.username || 'User Profile'}
        >
          {user?.username ? user.username.charAt(0).toUpperCase() : '👤'}
        </button>
      </div>
    </header>
  );
}
