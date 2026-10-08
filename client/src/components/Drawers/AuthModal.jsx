import React, { useState } from 'react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, showToast }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Please enter your username/email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('otc_token', data.token);
      localStorage.setItem('otc_user_id', data.user.userId);
      if (showToast) showToast(`Welcome back, ${data.user.username}!`, 'success');
      if (onAuthSuccess) onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('otc_token', data.token);
      localStorage.setItem('otc_user_id', data.user.userId);
      if (showToast) showToast(`Account created for ${data.user.username}! $10,000 Demo added.`, 'success');
      if (onAuthSuccess) onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setTab('login');
    setIdentifier('admin@otc.trade');
    setPassword('admin123');
    setError('');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div style={{
        background: '#151b2b',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 380,
        padding: 24,
        boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'none',
            border: 'none',
            color: '#8a94a8',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #00e5a0 0%, #00b4d8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
            fontSize: '1.2rem'
          }}>
            🔐
          </div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 800 }}>
            {tab === 'login' ? 'TradeNext Sign In' : 'Create Trader Account'}
          </h3>
          <p style={{ margin: '4px 0 0', color: '#8a94a8', fontSize: '0.75rem' }}>
            Multi-user dynamic live OTC trading engine
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(10, 14, 23, 0.8)',
          borderRadius: 8,
          padding: 3,
          marginBottom: 18
        }}>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 6,
              border: 'none',
              background: tab === 'login' ? '#00e5a0' : 'transparent',
              color: tab === 'login' ? '#0a0e17' : '#8a94a8',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Log In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 6,
              border: 'none',
              background: tab === 'register' ? '#00e5a0' : 'transparent',
              color: tab === 'register' ? '#0a0e17' : '#8a94a8',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(255, 59, 92, 0.15)',
            border: '1px solid rgba(255, 59, 92, 0.4)',
            color: '#ff5252',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: '0.75rem',
            marginBottom: 14,
            fontWeight: 600
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#8a94a8', marginBottom: 4, fontWeight: 700 }}>
                Email or Username
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. trader1 or admin@otc.trade"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#8a94a8', marginBottom: 4, fontWeight: 700 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #00e5a0 0%, #00c087 100%)',
                border: 'none',
                borderRadius: 8,
                padding: '11px 0',
                color: '#0a0e17',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(0, 229, 160, 0.35)'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#8a94a8', marginBottom: 4, fontWeight: 700 }}>
                Choose Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. CryptoKing"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#8a94a8', marginBottom: 4, fontWeight: 700 }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@domain.com"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#8a94a8', marginBottom: 4, fontWeight: 700 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #00e5a0 0%, #00c087 100%)',
                border: 'none',
                borderRadius: 8,
                padding: '11px 0',
                color: '#0a0e17',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(0, 229, 160, 0.35)'
              }}
            >
              {loading ? 'Creating Account...' : 'Register & Get $10,000 Demo'}
            </button>
          </form>
        )}

        {/* Quick Admin Login Shortcut */}
        <div style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center'
        }}>
          <button
            type="button"
            onClick={fillAdmin}
            style={{
              background: 'rgba(255, 75, 43, 0.15)',
              border: '1px solid rgba(255, 75, 43, 0.35)',
              color: '#ff7660',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🛡️ Quick Fill Admin Credentials (admin@otc.trade)
          </button>
        </div>
      </div>
    </div>
  );
}
