import React from 'react';
import { sounds } from '../services/sound.js';

export default function AssetBar({ asset, currentPrice, priceChange = 1.45, isMuted, onToggleMute, onOpenAssetSelect }) {
  const isUp = priceChange >= 0;

  return (
    <div className="sub-header-bar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 14px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-primary)',
      fontSize: '0.85rem'
    }}>
      <div 
        className="asset-pill-selector" 
        onClick={onOpenAssetSelect}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: 6,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-secondary)'
        }}
      >
        <span style={{ 
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          background: '#f7931a', 
          display: 'inline-block' 
        }}></span>
        <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>{asset || 'BTC/USDT OTC'}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Payout Tag */}
        <span style={{
          background: 'rgba(0, 229, 160, 0.12)',
          color: '#00e5a0',
          border: '1px solid rgba(0, 229, 160, 0.3)',
          borderRadius: 4,
          padding: '2px 6px',
          fontSize: '0.72rem',
          fontWeight: 700
        }}>
          PAYOUT 85%
        </span>

        {/* Sound Toggle */}
        <button 
          onClick={onToggleMute}
          style={{
            padding: 5,
            borderRadius: 6,
            background: isMuted ? 'rgba(255, 59, 92, 0.12)' : 'var(--bg-tertiary)',
            color: isMuted ? '#ff5252' : '#8a94a8',
            border: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
