import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { TermsModal } from './TermsModal';
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
  const { isAuthModalOpen, authModalView, openAuthModal, closeAuthModal, login, register, verify, resendOtp, user, signInWithOAuth } = useAuth();
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalType, setTermsModalType] = useState<'terms' | 'privacy' | null>(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(regPassword), [regPassword]);

  // Verify State
  const [verifyOtp, setVerifyOtp] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

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

    if (!termsAccepted) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      await register(regName, regEmail, regPassword);
      openAuthModal('verify_email');
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

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      const newOtp = [...otpValues];
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newOtp[index + i] = pasted[i];
      }
      setOtpValues(newOtp);
      setVerifyOtp(newOtp.join(''));
      
      const nextFocus = Math.min(index + pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    setVerifyOtp(newOtp.join(''));

    if (value !== '' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    const emailToVerify = regEmail || user?.email;
    if (!emailToVerify || !verifyOtp) {
      setError('Please provide the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await verify(emailToVerify, verifyOtp);
      closeAuthModal();
      window.location.reload(); // Reload to refresh user state if needed
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const emailToVerify = regEmail || user?.email;
    if (!emailToVerify) {
      setError('Email address not found.');
      return;
    }
    
    setError('');
    setMessage('');
    setResending(true);
    try {
      await resendOtp(emailToVerify);
      setMessage('A new code has been sent to your email.');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to resend code.');
    } finally {
      setResending(false);
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
                </div>

                <div className="auth-modal-divider">
                  <span>or</span>
                </div>

                <div className="social-login-container">
                  <button type="button" className="social-btn google-btn" onClick={() => signInWithOAuth('google')} disabled={loading}>
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </button>
                  <button type="button" className="social-btn facebook-btn" onClick={() => signInWithOAuth('facebook')} disabled={loading}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Continue with Facebook
                  </button>
                </div>


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
                
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '10px', marginTop: '12px', marginBottom: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="modal-register-terms" 
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ marginTop: '2px', cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                  />
                  <label htmlFor="modal-register-terms" style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.4, cursor: 'pointer', margin: 0 }}>
                    I agree to the <button type="button" onClick={(e) => { e.preventDefault(); setTermsModalType('terms'); }} style={{ color: 'var(--primary-color)', background: 'none', border: 'none', padding: 0, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Terms of Service</button> and <button type="button" onClick={(e) => { e.preventDefault(); setTermsModalType('privacy'); }} style={{ color: 'var(--primary-color)', background: 'none', border: 'none', padding: 0, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</button>.
                  </label>
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
                <div className="auth-modal-divider">
                  <span>or</span>
                </div>

                <div className="social-login-container">
                  <button type="button" className="social-btn google-btn" onClick={() => signInWithOAuth('google')} disabled={loading}>
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </button>
                  <button type="button" className="social-btn facebook-btn" onClick={() => signInWithOAuth('facebook')} disabled={loading}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Continue with Facebook
                  </button>
                </div>


                <div className="auth-modal-switch">
                  Already have an account? <button type="button" onClick={() => { setError(''); openAuthModal('login'); }}>Sign in</button>
                </div>
              </form>
            )}

            {authModalView === 'verify_email' && (
              <form onSubmit={handleVerifySubmit} id="modal-verify-form">
                <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Please enter the 6-digit code sent to your email.
                </div>
                {message && <div style={{ 
                  backgroundColor: '#f0fdf4', 
                  color: '#16a34a', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  marginBottom: '16px',
                  fontSize: '0.9rem',
                  border: '1px solid #bcf0da'
                }}>{message}</div>}
                <div className="form-group">
                  <label htmlFor="modal-verify-otp">6-Digit Code</label>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                    {otpValues.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        value={digit}
                        ref={(el) => { otpInputRefs.current[index] = el; }}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        style={{
                          width: '45px',
                          height: '50px',
                          textAlign: 'center',
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          borderRadius: '8px',
                          border: '1px solid #ccc',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                    ))}
                  </div>
                </div>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      cursor: (resending || loading) ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      textDecoration: 'underline'
                    }}
                  >
                    {resending ? 'Resending...' : "Didn't receive a code? Resend"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <TermsModal 
        isOpen={termsModalType !== null} 
        type={termsModalType} 
        onClose={() => setTermsModalType(null)} 
      />
    </div>
  );
};
