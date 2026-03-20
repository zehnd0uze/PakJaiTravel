import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  
  const { verify } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
        </form>
      </div>
    </div>
  );
};
