import React from 'react';

export default function TournamentsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const tournaments = [
    {
      title: 'Global OTC Sprint',
      prizePool: '₹2,500,000',
      participants: 1420,
      fee: 'Free',
      duration: 'Ending in 04h 12m',
      status: 'Active',
      color: '#0077ff'
    },
    {
      title: 'Weekend Bull Masters',
      prizePool: '₹5,000,000',
      participants: 3840,
      fee: '₹500',
      duration: 'Starts in 1d 08h',
      status: 'Upcoming',
      color: '#0faf59'
    },
    {
      title: 'VIP Lightning Cup',
      prizePool: '₹10,000,000',
      participants: 512,
      fee: '₹2,000',
      duration: 'Starts in 3d 14h',
      status: 'Upcoming',
      color: '#f5a623'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(6px)',
      padding: 16
    }}>
      <div style={{
        background: '#161c2b',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 520,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: '#131824',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>🏆</span>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>Trading Tournaments</h3>
              <p style={{ fontSize: '0.72rem', color: '#7b879c', margin: 0 }}>Compete against top global traders for multi-million prize pools</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#8a94a8',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tournaments List */}
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tournaments.map((t, idx) => (
            <div key={idx} style={{
              background: '#1a2234',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: 12,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{t.title}</h4>
                  <span style={{ fontSize: '0.72rem', color: '#7b879c' }}>{t.duration}</span>
                </div>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: 12,
                  background: t.status === 'Active' ? 'rgba(15, 175, 89, 0.2)' : 'rgba(0, 119, 255, 0.2)',
                  color: t.status === 'Active' ? '#0faf59' : '#0077ff',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}>
                  {t.status}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(0, 0, 0, 0.25)'
              }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#7b879c', textTransform: 'uppercase' }}>Prize Pool</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffd700' }}>{t.prizePool}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#7b879c', textTransform: 'uppercase' }}>Entry Fee</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{t.fee}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#7b879c', textTransform: 'uppercase' }}>Traders</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{t.participants}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  alert(`Successfully registered for ${t.title}!`);
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '9px 0',
                  borderRadius: 8,
                  background: t.status === 'Active' ? 'linear-gradient(135deg, #0faf59 0%, #009944 100%)' : 'rgba(0, 119, 255, 0.2)',
                  border: t.status === 'Active' ? 'none' : '1px solid #0077ff',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {t.status === 'Active' ? 'Join Tournament Now' : 'Pre-Register'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
