import { useState, useEffect } from 'react';
import {
  Activity,
  Stethoscope,
  Calendar,
  CreditCard,
  Zap,
  LogIn,
  UserPlus,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api, getAuthToken, getStoredUser, setAuthToken, setStoredUser, removeAuthToken, removeStoredUser } from './api';
import Navbar from './components/Navbar';
import CentresCatalog from './components/CentresCatalog';
import BookingForm from './components/BookingForm';
import MyBookings from './components/MyBookings';
import WebhookSimulator from './components/WebhookSimulator';
import './App.css';

const TABS = [
  { id: 'centres', label: 'Centres & Tests', icon: Stethoscope },
  { id: 'book', label: 'Book a Test', icon: Calendar },
  { id: 'bookings', label: 'My Bookings', icon: CreditCard },
  { id: 'webhook', label: 'Webhook Lab', icon: Zap },
];

function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [activeTab, setActiveTab] = useState('centres');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Booking form pre-fill state
  const [initialCentre, setInitialCentre] = useState(null);
  const [initialTest, setInitialTest] = useState(null);

  // Auth modal state
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authForm, setAuthForm] = useState({ email: '', password: '', fullName: '', phone: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // On mount, verify token is still valid
  useEffect(() => {
    const token = getAuthToken();
    if (token && currentUser) {
      api.getMe().catch(() => {
        removeAuthToken();
        removeStoredUser();
        setCurrentUser(null);
      });
    }
  }, []);

  const handleSelectTestForBooking = (centre, test) => {
    setInitialCentre(centre);
    setInitialTest(test);
    setActiveTab('book');
  };

  const handleBookingCreated = (booking, goToBookings) => {
    if (goToBookings) {
      setActiveTab('bookings');
    }
  };

  const handleOpenAuth = () => {
    setShowAuthModal(true);
    setAuthError(null);
    setAuthMode('login');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      let res;
      if (authMode === 'login') {
        res = await api.login({ email: authForm.email, password: authForm.password });
      } else {
        res = await api.signup({
          email: authForm.email,
          password: authForm.password,
          fullName: authForm.fullName,
          phone: authForm.phone || undefined,
        });
      }

      setAuthToken(res.data.token);
      setStoredUser(res.data.user);
      setCurrentUser(res.data.user);
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '', fullName: '', phone: '' });
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'centres':
        return <CentresCatalog onSelectTestForBooking={handleSelectTestForBooking} />;
      case 'book':
        return (
          <BookingForm
            currentUser={currentUser}
            initialCentre={initialCentre}
            initialTest={initialTest}
            onBookingCreated={handleBookingCreated}
            onOpenAuth={handleOpenAuth}
          />
        );
      case 'bookings':
        return <MyBookings currentUser={currentUser} onOpenAuth={handleOpenAuth} />;
      case 'webhook':
        return <WebhookSimulator currentUser={currentUser} />;
      default:
        return <CentresCatalog onSelectTestForBooking={handleSelectTestForBooking} />;
    }
  };

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onOpenAuth={handleOpenAuth}
      />

      {/* Tab Bar */}
      <nav className="tab-bar">
        <div className="tab-bar-inner">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-item ${activeTab === tab.id ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Page Content */}
      <main className="main-content">
        {renderActiveTab()}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <span>EVE Healthcare — SDE Intern Assessment</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="pulse-dot" style={{ width: '8px', height: '8px' }}></span>
            Node.js + TypeScript + Prisma + React
          </span>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--primary-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <Activity size={24} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                {authMode === 'login' ? 'Sign In to EVE Healthcare' : 'Create Your Account'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {authMode === 'login'
                  ? 'Enter your credentials to access diagnostic services'
                  : 'Register as a patient to book diagnostic tests'}
              </p>
            </div>

            {authError && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
              }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Alex Morgan"
                    value={authForm.fullName}
                    onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                    required
                    minLength={2}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder={authMode === 'signup' ? 'Min 6 characters' : 'Your password'}
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    required
                    minLength={authMode === 'signup' ? 6 : 1}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Phone (Optional)</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+1-555-0123"
                    value={authForm.phone}
                    onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" disabled={authLoading}>
                {authMode === 'login' ? (
                  <>
                    <LogIn size={16} />
                    <span>{authLoading ? 'Signing in...' : 'Sign In'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>{authLoading ? 'Creating account...' : 'Create Account'}</span>
                  </>
                )}
              </button>
            </form>

            <div style={{
              textAlign: 'center',
              marginTop: '1.25rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}>
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-accent)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'underline',
                    }}
                  >
                    Register here
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-accent)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'underline',
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
