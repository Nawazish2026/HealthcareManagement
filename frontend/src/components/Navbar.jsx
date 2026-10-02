import React, { useState } from 'react';
import { Activity, User, LogOut, ShieldCheck } from 'lucide-react';
import { setAuthToken, setStoredUser, removeAuthToken, removeStoredUser, api } from '../api';

export default function Navbar({ currentUser, setCurrentUser, onOpenAuth }) {
  const [loading, setLoading] = useState(false);

  const handleQuickDemoLogin = async (email, password) => {
    try {
      setLoading(true);
      const res = await api.login({ email, password });
      setAuthToken(res.data.token);
      setStoredUser(res.data.user);
      setCurrentUser(res.data.user);
    } catch (err) {
      alert(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    removeStoredUser();
    setCurrentUser(null);
  };

  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon-wrapper">
          <Activity size={24} color="#ffffff" />
        </div>
        <div>
          <span className="brand-title">EVE HEALTHCARE</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
            <span className="pulse-dot"></span>
            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>API v1 Online</span>
            <span className="brand-badge">SDE Platform</span>
          </div>
        </div>
      </div>

      <div className="nav-actions">
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
            }}>
              {currentUser.role === 'ADMIN' ? (
                <ShieldCheck size={16} color="#38bdf8" />
              ) : (
                <User size={16} color="#10b981" />
              )}
              <span style={{ fontWeight: 600 }}>{currentUser.fullName}</span>
              <span style={{
                fontSize: '0.7rem',
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-full)',
                background: currentUser.role === 'ADMIN' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: currentUser.role === 'ADMIN' ? '#38bdf8' : '#10b981',
                fontWeight: 700,
              }}>
                {currentUser.role}
              </span>
            </div>

            <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log out">
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => handleQuickDemoLogin('john.doe@example.com', 'Patient@123456')}
              className="btn btn-secondary btn-sm"
              disabled={loading}
              title="Instant login as sample patient John Doe"
            >
              <User size={14} />
              <span>Demo Patient</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('admin@evehealthcare.com', 'Admin@123456')}
              className="btn btn-secondary btn-sm"
              disabled={loading}
              title="Instant login as administrator"
            >
              <ShieldCheck size={14} />
              <span>Demo Admin</span>
            </button>

            <button onClick={onOpenAuth} className="btn btn-primary btn-sm">
              <span>Sign In / Register</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
