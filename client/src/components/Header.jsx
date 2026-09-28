import React from 'react';

export default function Header({ balance, isOnline, onOpenDeposit, onOpenProfile }) {
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(balance || 9379.63);

  return (
    <header id="top-header">
      <div className="header-left">
        <div className="tn-logo-circle">
          <span className="tn-logo-text">TN</span>
        </div>
        <div className="header-branding">
          <span className="header-title">TradeNext</span>
          <span className="header-subtitle">
            <span style={{ 
              display: 'inline-block', 
              width: 6, 
              height: 6, 
              borderRadius: '50%', 
              background: isOnline ? '#00e5a0' : '#ff3b5c', 
              marginRight: 4,
              boxShadow: isOnline ? '0 0 6px #00e5a0' : 'none'
            }}></span>
            {isOnline ? 'OTC Live Engine' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      <div className="header-right">
        {/* Deposit Pill Button with Gold Wallet Accent */}
        <button className="deposit-pill-btn" onClick={onOpenDeposit} title="Quick Deposit Funds">
          <div className="wallet-gold-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 7H3C2.44772 7 2 7.44772 2 8V18C2 18.5523 2.44772 19 3 19H21C21.5523 19 22 18.5523 22 18V8C22 7.44772 21.5523 7 21 7Z" fill="#F5A623" stroke="#D48806" strokeWidth="1.5"/>
              <path d="M16 13C16 11.8954 16.8954 11 18 11H22V15H18C16.8954 15 16 14.1046 16 13Z" fill="#FFE58F" stroke="#D48806" strokeWidth="1.2"/>
              <circle cx="18.5" cy="13" r="1.2" fill="#874D00"/>
              <path d="M4 7V5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V7" stroke="#F5A623" strokeWidth="1.5"/>
              <path d="M6 10H10" stroke="#FFE58F" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="sparkle-dot"></span>
          </div>

          <div className="deposit-content">
            <div className="deposit-amount-row">
              <span className="deposit-plus">+</span>
              <span className="deposit-amount-text">{formattedBalance}</span>
            </div>
            <span className="deposit-sublabel">Demo Deposit</span>
          </div>
        </button>
      </div>
    </header>
  );
}
