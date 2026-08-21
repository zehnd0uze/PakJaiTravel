import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

function getPasswordStrength(pw: string): { level: number; label: string; cls: string } {
  if (!pw) return { level: 0, label: '', cls: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', cls: 'weak' };
  if (score <= 2) return { level: 2, label: 'Fair', cls: 'fair' };
  if (score <= 3) return { level: 3, label: 'Good', cls: 'good' };
  return { level: 4, label: 'Strong', cls: 'strong' };
}

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalView, openAuthModal, closeAuthModal, login, register } = useAuth();
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(regPassword), [regPassword]);

  if (!isAuthModalOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('auth-modal-backdrop')) {
      closeAuthModal();
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      closeAuthModal();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          setError('Unable to connect to server.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(regName, regEmail, regPassword);
      closeAuthModal();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={handleBackdropClick}>
      <div className="auth-modal-container">
        {/* Left Side Banner */}
        <div className="auth-modal-banner">
          <div className="banner-content">
            <h2>Discover<br/>Northern Thailand</h2>
            <p>Join PakJaiTravel for exclusive deals and personalized recommendations.</p>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="auth-modal-content">
          <button className="auth-modal-close" onClick={closeAuthModal} aria-label="Close modal">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>

          <div className="auth-modal-header">
            <div className="auth-logo">
              PakJai<span className="logo-accent">Travel</span>
            </div>
            <h1>{authModalView === 'login' ? 'Welcome back' : 'Create an account'}</h1>
            <p>{authModalView === 'login' ? 'Sign in to your account to continue' : 'Join our community today'}</p>
          </div>

          <div className="auth-modal-body">
            {error && <div className="auth-modal-error">{error}</div>}

            {authModalView === 'login' && (
              <form onSubmit={handleLoginSubmit} id="modal-login-form">
                <div className="form-group">
                  <label htmlFor="modal-login-email">Email address</label>
                  <input
                    id="modal-login-email"
                    type="email"
                    className={`form-input ${error ? 'input-error' : ''}`}
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-login-password">Password</label>
                  <input
                    id="modal-login-password"
                    type="password"
                    className={`form-input ${error ? 'input-error' : ''}`}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
                <div className="auth-modal-switch">
                  Don't have an account? <button type="button" onClick={() => { setError(''); openAuthModal('register'); }}>Sign up</button>
                </div>
              </form>
            )}

            {authModalView === 'register' && (
              <form onSubmit={handleRegisterSubmit} id="modal-register-form">
                <div className="form-group">
                  <label htmlFor="modal-register-name">Username</label>
                  <input
                    id="modal-register-name"
                    type="text"
                    className="form-input"
                    placeholder="Enter username"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-register-email">Email address</label>
                  <input
                    id="modal-register-email"
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-register-password">Password</label>
                  <input
                    id="modal-register-password"
                    type="password"
                    className="form-input"
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                  {regPassword && (
                    <div className="password-strength-container">
                      <div className="password-strength">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`strength-bar ${i <= strength.level ? `active ${strength.cls}` : ''}`} />
                        ))}
                      </div>
                      <span className={`strength-text ${strength.cls}`}>{strength.label}</span>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="modal-register-confirm">Confirm password</label>
                  <input
                    id="modal-register-confirm"
                    type="password"
                    className={`form-input ${regConfirmPassword && regPassword !== regConfirmPassword ? 'input-error' : ''}`}
                    placeholder="Re-enter password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
                <div className="auth-modal-switch">
                  Already have an account? <button type="button" onClick={() => { setError(''); openAuthModal('login'); }}>Sign in</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
