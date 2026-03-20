import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  
  const { verify, resendOtp } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      setError('Please provide your email address.');
      return;
    }
    
    setError('');
    setMessage('');
    setResending(true);
    try {
      if (resendOtp) {
        await resendOtp(email);
        setMessage('A new code has been sent to your email.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !otp) {
      setError('Please provide your email and the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      if (verify) {
        await verify(email, otp);
        navigate('/');
      } else {
        setError('Verification not supported.');
      }
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

  return (
    <div className="auth-page">
      <Link to="/login" className="auth-back-link">← Back to login</Link>

      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">
            PakJai<span className="logo-accent">Travel</span>
          </div>
          <h1>Verify your email</h1>
          <p>Please enter the 6-digit code sent to your email.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {message && <div style={{ 
            backgroundColor: '#f0fdf4', 
            color: '#16a34a', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '0.9rem',
            border: '1px solid #bcf0da'
          }}>{message}</div>}

          <div className="form-group">
            <label htmlFor="verify-email">Email address</label>
            <input
              id="verify-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!!initialEmail}
              disabled={!!initialEmail}
            />
          </div>

          <div className="form-group">
            <label htmlFor="verify-otp">6-Digit Code</label>
            <input
              id="verify-otp"
              type="text"
              className="form-input"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoComplete="one-time-code"
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading && <span className="spinner" />}
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              className="link-btn"
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
      </div>
    </div>
  );
};
