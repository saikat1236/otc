import React from 'react';

export default function PwaModal({ isOpen, onClose, installPrompt, onInstallApp }) {
  if (!isOpen) return null;

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
        gap: 14,
        animation: 'slideUp 0.25s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/icon-192.svg" alt="App Icon" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>TradeNext PWA</h3>
              <span style={{ fontSize: '0.72rem', color: '#8a94a8' }}>Install on your Mobile Phone</span>
            </div>
          </div>
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

        <div style={{
          background: 'var(--bg-tertiary)',
          borderRadius: 10,
          padding: '12px 14px',
          fontSize: '0.82rem',
          lineHeight: 1.5,
          color: '#e8edf5',
          border: '1px solid var(--border-primary)'
        }}>
          <p style={{ marginBottom: 8 }}>
            🚀 <strong>Full Mobile App Experience:</strong>
          </p>
          <ul style={{ paddingLeft: 18, color: '#8a94a8' }}>
            <li>Runs in standalone full-screen window (no browser address bar).</li>
            <li>Instant loading with offline asset caching.</li>
            <li>Real-time WebSocket market engine.</li>
          </ul>
        </div>

        {installPrompt ? (
          <button
            onClick={onInstallApp}
            style={{
              height: 46,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.95rem',
              boxShadow: '0 4px 16px rgba(0, 180, 216, 0.4)',
              cursor: 'pointer'
            }}
          >
            📲 Install TradeNext to Home Screen
          </button>
        ) : (
          <div style={{
            background: 'rgba(0, 180, 216, 0.1)',
            border: '1px solid rgba(0, 180, 216, 0.3)',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: '0.78rem',
            color: '#00b4d8'
          }}>
            <strong>How to install on iOS Safari:</strong><br />
            Tap the Share button <span style={{ fontSize: '1rem' }}>⎋</span> at bottom of Safari, then select <strong>"Add to Home Screen" ⊞</strong>.
          </div>
        )}
      </div>
    </div>
  );
}
