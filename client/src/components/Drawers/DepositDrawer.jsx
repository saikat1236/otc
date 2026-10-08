import React, { useState, useEffect } from 'react';

export default function DepositDrawer({
  isOpen,
  onClose,
  user,
  isDemo,
  onDeposit,
  onReset,
  showToast
}) {
  const [tab, setTab] = useState('deposit'); // 'deposit' | 'withdraw' | 'history'
  const [amount, setAmount] = useState(50);
  const [method, setMethod] = useState('USDT_TRC20');
  const [txRef, setTxRef] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const realBalance = Number(user?.balance ?? 0);
  const demoBalance = Number(user?.demoBalance ?? 10000);

  useEffect(() => {
    if (isOpen && user?.userId) {
      fetchPaymentHistory();
    }
  }, [isOpen, user]);

  const fetchPaymentHistory = async () => {
    if (!user?.userId) return;
    try {
      const res = await fetch(`/api/payments/my/${user.userId}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.payments);
      }
    } catch (e) {
      console.warn('Error fetching payment history', e);
    }
  };

  const handleRealDeposit = async (e) => {
    e?.preventDefault();
    if (!amount || amount < 5) {
      if (showToast) showToast('Minimum deposit is $5.00', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.userId,
          amount: Number(amount),
          method,
          reference: txRef || 'TX-' + Date.now().toString(36).toUpperCase()
        })
      });
      const data = await res.json();
      if (data.success) {
        if (showToast) showToast('Deposit request submitted! Awaiting Admin approval.', 'success');
        setTxRef('');
        fetchPaymentHistory();
        setTab('history');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      if (showToast) showToast('Deposit error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async (e) => {
    e?.preventDefault();
    if (!amount || amount < 10) {
      if (showToast) showToast('Minimum withdrawal is $10.00', 'error');
      return;
    }
    if (realBalance < amount) {
      if (showToast) showToast('Insufficient real balance for withdrawal', 'error');
      return;
    }
    if (!withdrawAddress) {
      if (showToast) showToast('Please enter your payout address / account', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.userId,
          amount: Number(amount),
          method,
          address: withdrawAddress
        })
      });
      const data = await res.json();
      if (data.success) {
        if (showToast) showToast('Withdrawal request submitted! Funds reserved.', 'success');
        setWithdrawAddress('');
        fetchPaymentHistory();
        setTab('history');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      if (showToast) showToast('Withdrawal error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      zIndex: 500,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      backdropFilter: 'blur(6px)'
    }}>
      <div style={{
        background: '#151b2b',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '20px 18px 30px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        maxHeight: '85vh',
        overflowY: 'auto',
        animation: 'slideUp 0.25s ease'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
              Cashier & Wallet
            </h3>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: '#00e5a0' }}>Real: ${realBalance.toFixed(2)}</span>
              <span style={{ color: '#f0a500' }}>Demo: ${demoBalance.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#8a94a8',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(10, 14, 23, 0.8)',
          borderRadius: 8,
          padding: 3
        }}>
          {[
            { id: 'deposit', label: '💳 Deposit' },
            { id: 'withdraw', label: '💸 Withdraw' },
            { id: 'history', label: '📜 History' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 6,
                border: 'none',
                background: tab === t.id ? '#00e5a0' : 'transparent',
                color: tab === t.id ? '#0a0e17' : '#8a94a8',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: DEPOSIT ── */}
        {tab === 'deposit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Quick Demo Refill if in Demo mode */}
            {isDemo && (
              <div style={{
                background: 'rgba(240, 165, 0, 0.1)',
                border: '1px solid rgba(240, 165, 0, 0.3)',
                borderRadius: 8,
                padding: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f0a500' }}>⚡ Demo Account Mode</div>
                  <div style={{ fontSize: '0.68rem', color: '#a0aec0' }}>Instant free practice funds</div>
                </div>
                <button
                  onClick={() => {
                    onReset();
                    onClose();
                  }}
                  style={{
                    background: '#f0a500',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    color: '#0a0e17',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  Refill $10,000 Demo
                </button>
              </div>
            )}

            {/* Real Money Deposit Form */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#8a94a8', marginBottom: 6, fontWeight: 700 }}>
                Select Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {[
                  { id: 'USDT_TRC20', label: 'USDT (TRC-20)' },
                  { id: 'UPI_QR', label: 'UPI / QR Code' },
                  { id: 'CREDIT_CARD', label: 'Card / NetBank' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 6,
                      background: method === m.id ? 'rgba(0, 229, 160, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: method === m.id ? '1px solid #00e5a0' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: method === m.id ? '#00e5a0' : '#8a94a8',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Amount Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#8a94a8', marginBottom: 6, fontWeight: 700 }}>
                Select Deposit Amount ($)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
                {[20, 50, 100, 500].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    style={{
                      padding: '8px 0',
                      borderRadius: 6,
                      background: amount === v ? 'rgba(0, 229, 160, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: amount === v ? '1px solid #00e5a0' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: amount === v ? '#00e5a0' : '#fff',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    ${v}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="5"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Or enter custom amount"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#8a94a8', marginBottom: 4, fontWeight: 700 }}>
                Transaction Hash / Reference Note
              </label>
              <input
                type="text"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="Optional (e.g. TXID or Payment ID)"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <button
              onClick={handleRealDeposit}
              disabled={loading}
              style={{
                height: 44,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #00e5a0 0%, #00c087 100%)',
                border: 'none',
                color: '#0a0e17',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(0, 229, 160, 0.35)',
                marginTop: 6
              }}
            >
              {loading ? 'Submitting...' : `Submit Real Deposit ($${amount})`}
            </button>
          </div>
        )}

        {/* ── TAB 2: WITHDRAW ── */}
        {tab === 'withdraw' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              background: 'rgba(0, 229, 160, 0.08)',
              border: '1px solid rgba(0, 229, 160, 0.25)',
              borderRadius: 8,
              padding: 10
            }}>
              <div style={{ fontSize: '0.72rem', color: '#8a94a8' }}>Available Real Balance for Payout</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00e5a0', fontFamily: 'monospace' }}>
                ${realBalance.toFixed(2)}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#8a94a8', marginBottom: 4, fontWeight: 700 }}>
                Withdrawal Amount ($)
              </label>
              <input
                type="number"
                min="10"
                max={realBalance}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Minimum $10.00"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#8a94a8', marginBottom: 4, fontWeight: 700 }}>
                Wallet Address / Account Details
              </label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder="USDT TRC20 Wallet / UPI ID / Bank Details"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(10, 14, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <button
              onClick={handleWithdrawal}
              disabled={loading || realBalance < amount}
              style={{
                height: 44,
                borderRadius: 8,
                background: realBalance >= amount ? 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: (loading || realBalance < amount) ? 'not-allowed' : 'pointer',
                marginTop: 6
              }}
            >
              {loading ? 'Processing...' : `Request Payout ($${amount})`}
            </button>
          </div>
        )}

        {/* ── TAB 3: HISTORY ── */}
        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#8a94a8', fontSize: '0.8rem' }}>
                No deposits or withdrawals recorded yet.
              </div>
            ) : (
              history.map(item => (
                <div
                  key={item.paymentId || item._id}
                  style={{
                    background: 'rgba(10, 14, 23, 0.6)',
                    borderRadius: 8,
                    padding: 10,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: item.type === 'DEPOSIT' ? 'rgba(0, 229, 160, 0.2)' : 'rgba(255, 75, 43, 0.2)',
                        color: item.type === 'DEPOSIT' ? '#00e5a0' : '#ff7660'
                      }}>
                        {item.type}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff', fontFamily: 'monospace' }}>
                        ${Number(item.amount).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#8a94a8', marginTop: 2 }}>
                      {item.method} • {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: item.status === 'APPROVED' ? 'rgba(0, 229, 160, 0.2)' : item.status === 'REJECTED' ? 'rgba(255, 59, 92, 0.2)' : 'rgba(240, 165, 0, 0.2)',
                    color: item.status === 'APPROVED' ? '#00e5a0' : item.status === 'REJECTED' ? '#ff5252' : '#f0a500'
                  }}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
