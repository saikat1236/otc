import React, { useState, useEffect } from 'react';

export default function AdminPanel({ isOpen, onClose, showToast }) {
  const [pin, setPin] = useState(localStorage.getItem('otc_admin_pin') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('game'); // 'game' | 'users' | 'payments' | 'stats'
  const [loading, setLoading] = useState(false);

  // Admin Data State
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({
    algoMode: 'LOWEST_POOL_WINS',
    botTradingEnabled: true,
    payoutRate: 0.85,
    roundDurationSec: 30
  });
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

  // User Balance Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('REAL'); // 'REAL' | 'DEMO'
  const [adjustAction, setAdjustAction] = useState('ADD'); // 'ADD' | 'SET'

  // PIN Unlock Check
  const verifyPin = (inputPin = pin) => {
    if (inputPin === '8888') {
      setIsAuthenticated(true);
      localStorage.setItem('otc_admin_pin', inputPin);
      fetchAdminData(inputPin);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (isOpen) {
      if (pin === '8888') {
        setIsAuthenticated(true);
        fetchAdminData('8888');
      }
    }
  }, [isOpen]);

  const fetchAdminData = async (adminPin = pin) => {
    setLoading(true);
    try {
      const headers = { 'x-admin-pin': adminPin };
      
      const [statsRes, settingsRes, usersRes, paymentsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/settings', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/payments', { headers })
      ]);

      const [statsData, settingsData, usersData, paymentsData] = await Promise.all([
        statsRes.json(),
        settingsRes.json(),
        usersRes.json(),
        paymentsRes.json()
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (settingsData.success) setSettings(settingsData.settings);
      if (usersData.success) setUsers(usersData.users);
      if (paymentsData.success) setPayments(paymentsData.payments);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      if (showToast) showToast('Failed to load admin data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Game Settings Actions
  const handleUpdateAlgoMode = async (algoMode) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify({ algoMode })
      });
      const data = await res.json();
      if (data.success) {
        setSettings(prev => ({ ...prev, algoMode }));
        if (showToast) showToast(`Algorithm Engine updated to: ${algoMode}`, 'success');
      }
    } catch (err) {
      if (showToast) showToast('Failed to update algorithm', 'error');
    }
  };

  const handleToggleBotTrading = async () => {
    const newStatus = !settings.botTradingEnabled;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify({ botTradingEnabled: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setSettings(prev => ({ ...prev, botTradingEnabled: newStatus }));
        if (showToast) showToast(newStatus ? 'Automated Bot Betting Enabled' : 'Bots Paused', 'info');
      }
    } catch (err) {
      if (showToast) showToast('Failed to toggle bots', 'error');
    }
  };

  // User Actions
  const handleAdjustBalance = async () => {
    if (!editingUser || !adjustAmount) return;
    try {
      const res = await fetch(`/api/admin/user/${editingUser.userId}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify({
          amount: Number(adjustAmount),
          isDemo: adjustType === 'DEMO',
          action: adjustAction
        })
      });
      const data = await res.json();
      if (data.success) {
        if (showToast) showToast(`Updated balance for ${editingUser.username}`, 'success');
        setEditingUser(null);
        setAdjustAmount('');
        fetchAdminData();
      }
    } catch (err) {
      if (showToast) showToast('Failed to adjust balance', 'error');
    }
  };

  const handleToggleBan = async (user) => {
    try {
      const res = await fetch(`/api/admin/user/${user.userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify({ isBanned: !user.isBanned })
      });
      const data = await res.json();
      if (data.success) {
        if (showToast) showToast(user.isBanned ? `Unbanned ${user.username}` : `Banned ${user.username}`, 'warning');
        fetchAdminData();
      }
    } catch (err) {
      if (showToast) showToast('Failed to update ban status', 'error');
    }
  };

  // Payment Actions
  const handlePaymentAction = async (paymentId, action) => {
    try {
      const res = await fetch(`/api/admin/payment/${paymentId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        if (showToast) showToast(`Payment ${action === 'APPROVE' ? 'Approved' : 'Rejected'}!`, 'success');
        fetchAdminData();
      }
    } catch (err) {
      if (showToast) showToast('Payment action failed', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: 12
    }}>
      <div style={{
        background: '#111726',
        border: '1px solid rgba(255, 75, 43, 0.4)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 720,
        height: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
        overflow: 'hidden'
      }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'rgba(255, 75, 43, 0.12)',
          borderBottom: '1px solid rgba(255, 75, 43, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.25rem' }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                Master Administration Suite
              </div>
              <div style={{ fontSize: '0.68rem', color: '#ff7660' }}>
                Manage Game Algorithm, Registered Users & Payment Cashier
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => fetchAdminData()}
              disabled={loading}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
            >
              {loading ? '↻ Loading...' : '↻ Refresh'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#8a94a8',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* PIN Authentication Gate */}
        {!isAuthenticated ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}>
            <div style={{
              background: '#151b2b',
              padding: 28,
              borderRadius: 12,
              textAlign: 'center',
              width: '100%',
              maxWidth: 320,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</div>
              <h3 style={{ margin: '0 0 6px', color: '#fff', fontSize: '1.1rem' }}>Enter Master PIN</h3>
              <p style={{ margin: '0 0 16px', color: '#8a94a8', fontSize: '0.75rem' }}>
                Default PIN: <code>8888</code>
              </p>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (e.target.value === '8888') {
                    verifyPin(e.target.value);
                  }
                }}
                placeholder="PIN"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#0a0e17',
                  border: '1px solid #ff4b2b',
                  borderRadius: 8,
                  padding: '12px',
                  color: '#fff',
                  textAlign: 'center',
                  fontSize: '1.4rem',
                  letterSpacing: '8px',
                  marginBottom: 16
                }}
              />
              <button
                onClick={() => {
                  if (!verifyPin()) {
                    if (showToast) showToast('Invalid PIN (Use 8888)', 'error');
                  }
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 0',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Unlock Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs Navigation */}
            <div style={{
              display: 'flex',
              background: '#0d131f',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              overflowX: 'auto'
            }}>
              {[
                { id: 'game', label: '🎮 Game & Algo', badge: settings.algoMode },
                { id: 'users', label: '👥 User Accounts', badge: users.length },
                { id: 'payments', label: '💳 Cashier & Payments', badge: payments.filter(p => p.status === 'PENDING').length },
                { id: 'stats', label: '📊 Platform Analytics' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '10px 14px',
                    border: 'none',
                    background: activeTab === t.id ? '#182133' : 'transparent',
                    borderBottom: activeTab === t.id ? '2px solid #ff4b2b' : '2px solid transparent',
                    color: activeTab === t.id ? '#fff' : '#8a94a8',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{t.label}</span>
                  {t.badge !== undefined && (
                    <span style={{
                      fontSize: '0.62rem',
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: t.id === 'game' ? 'rgba(0, 229, 160, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      color: t.id === 'game' ? '#00e5a0' : '#fff'
                    }}>
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {/* ── TAB 1: GAME & ALGORITHM ── */}
              {activeTab === 'game' && (
                <div>
                  <div style={{
                    background: 'rgba(255, 75, 43, 0.08)',
                    border: '1px solid rgba(255, 75, 43, 0.25)',
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 16
                  }}>
                    <h4 style={{ margin: '0 0 6px', color: '#ff7660', fontSize: '0.88rem' }}>
                      ⚡ Realtime Algo Mode: Lowest Pool Always Wins (House Guaranteed)
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#a0aec0', lineHeight: 1.4 }}>
                      In default mode, the engine dynamically monitors the Call and Put betting pools. The side with lower betting volume is guaranteed to win so the house always keeps the larger pool. You can also manually override the outcome below.
                    </p>
                  </div>

                  <h5 style={{ margin: '0 0 10px', color: '#fff', fontSize: '0.82rem' }}>
                    Select Dynamic Algorithm Mode:
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 20 }}>
                    {[
                      {
                        mode: 'MIN_BALANCE',
                        title: 'Min Balance Priority',
                        desc: 'Lowest balance account wins (e.g.  acc beats  acc)',
                        badge: 'Priority'
                      },
                      {
                        mode: 'LOWEST_POOL_WINS',
                        title: 'Lowest Pool Wins',
                        desc: 'House ALWAYS wins majority pool',
                        badge: 'Default / Safe'
                      },
                      {
                        mode: 'FORCE_CALL',
                        title: 'Force CALL Win',
                        desc: 'Next round candle closes UP',
                        badge: 'Override'
                      },
                      {
                        mode: 'FORCE_PUT',
                        title: 'Force PUT Win',
                        desc: 'Next round candle closes DOWN',
                        badge: 'Override'
                      },
                      {
                        mode: 'RANDOM',
                        title: 'Random 50/50',
                        desc: 'Natural financial random distribution',
                        badge: 'Fair'
                      }
                    ].map(item => {
                      const isSelected = settings.algoMode === item.mode;
                      return (
                        <div
                          key={item.mode}
                          onClick={() => handleUpdateAlgoMode(item.mode)}
                          style={{
                            background: isSelected ? 'rgba(0, 229, 160, 0.15)' : '#151b2b',
                            border: `1.5px solid ${isSelected ? '#00e5a0' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: 10,
                            padding: 12,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontWeight: 800, fontSize: '0.82rem', color: isSelected ? '#00e5a0' : '#fff' }}>
                              {item.title}
                            </span>
                            <span style={{
                              fontSize: '0.62rem',
                              padding: '2px 5px',
                              borderRadius: 4,
                              background: isSelected ? '#00e5a0' : 'rgba(255,255,255,0.1)',
                              color: isSelected ? '#0a0e17' : '#8a94a8',
                              fontWeight: 700
                            }}>
                              {item.badge}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#8a94a8' }}>
                            {item.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Engine Controls: Bots & Payout */}
                  <h5 style={{ margin: '0 0 10px', color: '#fff', fontSize: '0.82rem' }}>
                    Engine Market & Bot Settings:
                  </h5>
                  <div style={{
                    background: '#151b2b',
                    borderRadius: 10,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#fff' }}>
                          Automated Bot Betting Simulation
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#8a94a8' }}>
                          Generates realistic organic trade activity in the sentiment pool
                        </div>
                      </div>
                      <button
                        onClick={handleToggleBotTrading}
                        style={{
                          background: settings.botTradingEnabled ? '#00c087' : 'rgba(255, 255, 255, 0.15)',
                          border: 'none',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          padding: '6px 14px',
                          borderRadius: 20,
                          cursor: 'pointer'
                        }}
                      >
                        {settings.botTradingEnabled ? 'ENABLED' : 'PAUSED'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#fff' }}>
                          Payout Multiplier
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#8a94a8' }}>
                          Current payout rate for winning trades (85% = 1.85x return)
                        </div>
                      </div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#00e5a0', fontSize: '0.9rem' }}>
                        {(settings.payoutRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: USER MANAGEMENT ── */}
              {activeTab === 'users' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.8rem', color: '#8a94a8' }}>
                      Total Registered Users: <strong style={{ color: '#fff' }}>{users.length}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {users.map(u => (
                      <div
                        key={u.userId}
                        style={{
                          background: '#151b2b',
                          borderRadius: 8,
                          padding: 12,
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 10
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>
                              {u.username}
                            </span>
                            <span style={{
                              fontSize: '0.62rem',
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: u.role === 'admin' ? '#ff4b2b' : 'rgba(255, 255, 255, 0.1)',
                              color: '#fff',
                              fontWeight: 700
                            }}>
                              {u.role.toUpperCase()}
                            </span>
                            {u.isBanned && (
                              <span style={{
                                fontSize: '0.62rem',
                                padding: '1px 5px',
                                borderRadius: 4,
                                background: 'rgba(255, 59, 92, 0.3)',
                                color: '#ff5252',
                                fontWeight: 800
                              }}>
                                BANNED
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#8a94a8', marginTop: 2 }}>
                            {u.email || u.userId}
                          </div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.72rem', fontFamily: 'monospace' }}>
                            <span style={{ color: '#00e5a0' }}>Real: ${Number(u.balance || 0).toFixed(2)}</span>
                            <span style={{ color: '#f0a500' }}>Demo: ${Number(u.demoBalance || 0).toFixed(2)}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setAdjustAmount('100');
                            }}
                            style={{
                              background: 'rgba(0, 229, 160, 0.15)',
                              border: '1px solid rgba(0, 229, 160, 0.3)',
                              color: '#00e5a0',
                              borderRadius: 6,
                              padding: '5px 9px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            💰 Adjust Balance
                          </button>
                          <button
                            onClick={() => handleToggleBan(u)}
                            style={{
                              background: u.isBanned ? 'rgba(0, 229, 160, 0.15)' : 'rgba(255, 59, 92, 0.15)',
                              border: `1px solid ${u.isBanned ? '#00e5a0' : '#ff3b5c'}`,
                              color: u.isBanned ? '#00e5a0' : '#ff5252',
                              borderRadius: 6,
                              padding: '5px 9px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 3: PAYMENTS & CASHIER DESK ── */}
              {activeTab === 'payments' && (
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                      <button
                        key={f}
                        onClick={() => setPaymentFilter(f)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: paymentFilter === f ? '#ff4b2b' : 'rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {payments
                      .filter(p => paymentFilter === 'ALL' || p.status === paymentFilter)
                      .map(p => {
                        const isPending = p.status === 'PENDING';
                        return (
                          <div
                            key={p.paymentId || p._id}
                            style={{
                              background: '#151b2b',
                              borderRadius: 8,
                              padding: 12,
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              flexWrap: 'wrap',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 10
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: p.type === 'DEPOSIT' ? 'rgba(0, 229, 160, 0.2)' : 'rgba(255, 75, 43, 0.2)',
                                  color: p.type === 'DEPOSIT' ? '#00e5a0' : '#ff7660'
                                }}>
                                  {p.type}
                                </span>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', fontFamily: 'monospace' }}>
                                  ${Number(p.amount).toFixed(2)}
                                </span>
                                <span style={{
                                  fontSize: '0.62rem',
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                  background: p.status === 'APPROVED' ? '#00c087' : p.status === 'REJECTED' ? '#ff3b5c' : '#f0a500',
                                  color: '#0a0e17',
                                  fontWeight: 800
                                }}>
                                  {p.status}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#8a94a8', marginTop: 3 }}>
                                User: <strong style={{ color: '#fff' }}>{p.username || p.userId}</strong> • Ref: <code>{p.reference}</code>
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#61718c', marginTop: 2 }}>
                                Method: {p.method} • Date: {new Date(p.createdAt).toLocaleTimeString()}
                              </div>
                            </div>

                            {isPending && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  onClick={() => handlePaymentAction(p.paymentId, 'APPROVE')}
                                  style={{
                                    background: '#00c087',
                                    border: 'none',
                                    color: '#0a0e17',
                                    fontWeight: 800,
                                    fontSize: '0.72rem',
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handlePaymentAction(p.paymentId, 'REJECT')}
                                  style={{
                                    background: '#ff3b5c',
                                    border: 'none',
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: '0.72rem',
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* ── TAB 4: PLATFORM ANALYTICS ── */}
              {activeTab === 'stats' && stats && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: '#151b2b', padding: 14, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '0.68rem', color: '#8a94a8' }}>Total Registered Users</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                        {stats.totalUsers}
                      </div>
                    </div>
                    <div style={{ background: '#151b2b', padding: 14, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '0.68rem', color: '#8a94a8' }}>Approved Deposits</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00e5a0', marginTop: 4 }}>
                        ${stats.totalDeposited.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ background: '#151b2b', padding: 14, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '0.68rem', color: '#8a94a8' }}>Approved Withdrawals</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ff5252', marginTop: 4 }}>
                        ${stats.totalWithdrawn.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ background: '#151b2b', padding: 14, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '0.68rem', color: '#8a94a8' }}>Net Platform Revenue</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffd700', marginTop: 4 }}>
                        ${stats.netProfit.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#151b2b', padding: 16, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <h5 style={{ margin: '0 0 10px', color: '#fff', fontSize: '0.85rem' }}>Live Trading Engine Status:</h5>
                    <div style={{ fontSize: '0.75rem', color: '#8a94a8', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div>Current Algo: <strong style={{ color: '#00e5a0' }}>{stats.algoMode}</strong></div>
                      <div>Bot Traffic: <strong style={{ color: stats.botTradingEnabled ? '#00e5a0' : '#ff5252' }}>{stats.botTradingEnabled ? 'ACTIVE' : 'OFF'}</strong></div>
                      <div>Active Trades Right Now: <strong style={{ color: '#fff' }}>{stats.activeTradesCount}</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* User Balance Adjustment Modal Sub-Overlay */}
        {editingUser && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 1200
          }}>
            <div style={{
              background: '#151b2b',
              border: '1px solid #00e5a0',
              borderRadius: 12,
              padding: 20,
              width: '100%',
              maxWidth: 320
            }}>
              <h4 style={{ margin: '0 0 4px', color: '#fff', fontSize: '0.95rem' }}>
                Adjust Balance: {editingUser.username}
              </h4>
              <div style={{ fontSize: '0.7rem', color: '#8a94a8', marginBottom: 14 }}>
                User ID: {editingUser.userId}
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => setAdjustType('REAL')}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 6,
                    border: 'none',
                    background: adjustType === 'REAL' ? '#00e5a0' : 'rgba(255,255,255,0.1)',
                    color: adjustType === 'REAL' ? '#0a0e17' : '#fff',
                    fontWeight: 800,
                    fontSize: '0.75rem'
                  }}
                >
                  Real Balance
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('DEMO')}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 6,
                    border: 'none',
                    background: adjustType === 'DEMO' ? '#f0a500' : 'rgba(255,255,255,0.1)',
                    color: adjustType === 'DEMO' ? '#0a0e17' : '#fff',
                    fontWeight: 800,
                    fontSize: '0.75rem'
                  }}
                >
                  Demo Balance
                </button>
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setAdjustAction('ADD')}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    borderRadius: 4,
                    border: 'none',
                    background: adjustAction === 'ADD' ? '#00c087' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  + Add / Credit
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustAction('SET')}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    borderRadius: 4,
                    border: 'none',
                    background: adjustAction === 'SET' ? '#00b4d8' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  Set Exact
                </button>
              </div>

              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Amount (e.g. 500)"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#0a0e17',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  marginBottom: 14
                }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setEditingUser(null)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    padding: '8px 0',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustBalance}
                  style={{
                    flex: 1,
                    background: '#00e5a0',
                    border: 'none',
                    padding: '8px 0',
                    borderRadius: 6,
                    color: '#0a0e17',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
