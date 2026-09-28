import React, { useState } from 'react';

export default function DepositDrawer({ isOpen, onClose, currentBalance, onDeposit, onReset }) {
  const [depositAmount, setDepositAmount] = useState(500);

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
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Demo Account Wallet</h3>
            <span style={{ fontSize: '0.75rem', color: '#8a94a8' }}>
              Current Balance: <strong style={{ color: '#00e5a0' }}>${Number(currentBalance).toFixed(2)}</strong>
            </span>
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

        {/* Quick Amount Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[100, 500, 1000, 5000].map(val => (
            <button
              key={val}
              onClick={() => setDepositAmount(val)}
              style={{
                padding: '10px 0',
                borderRadius: 8,
                background: depositAmount === val ? 'rgba(0, 229, 160, 0.15)' : 'var(--bg-tertiary)',
                border: depositAmount === val ? '1px solid #00e5a0' : '1px solid var(--border-primary)',
                color: depositAmount === val ? '#00e5a0' : '#fff',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              +${val}
            </button>
          ))}
        </div>

        {/* Instant Deposit Action Button */}
        <button
          onClick={() => {
            onDeposit(depositAmount);
            onClose();
          }}
          style={{
            height: 46,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #00E5A0 0%, #00B87E 100%)',
            color: '#0a0e17',
            fontWeight: 800,
            fontSize: '0.95rem',
            boxShadow: '0 4px 16px rgba(0, 229, 160, 0.35)',
            cursor: 'pointer'
          }}
        >
          Confirm Demo Deposit (+${depositAmount})
        </button>

        {/* Reset Default */}
        <button
          onClick={() => {
            onReset();
            onClose();
          }}
          style={{
            height: 38,
            borderRadius: 8,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
            color: '#8a94a8',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          Reset to Default ($9,379.63)
        </button>
      </div>
    </div>
  );
}
