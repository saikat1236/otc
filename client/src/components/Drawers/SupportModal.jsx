import React, { useState } from 'react';

export default function SupportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello Trader! Welcome to Quotex 24/7 Priority Support. How can we assist you today?' }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'An OTC Support Specialist is reviewing your request. For instant deposits or withdrawals, please check the Cashier section.' }
      ]);
    }, 800);
  };

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
        maxWidth: 480,
        height: 520,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: '#131824',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#0faf59',
              boxShadow: '0 0 8px #0faf59'
            }} />
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff', margin: 0 }}>Quotex Live Support</h3>
              <span style={{ fontSize: '0.7rem', color: '#0faf59' }}>Online • 24/7 Response Desk</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '4px 10px',
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

        {/* Chat message history */}
        <div style={{
          flex: 1,
          padding: 16,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {chatMessages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              background: msg.sender === 'user' ? '#0077ff' : '#1e2638',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: '0.82rem',
              lineHeight: 1.4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              {msg.text}
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} style={{
          padding: 12,
          background: '#131824',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          gap: 8
        }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question or issue..."
            style={{
              flex: 1,
              background: '#1a2234',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#fff',
              fontSize: '0.82rem'
            }}
          />
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #0faf59 0%, #009944 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
