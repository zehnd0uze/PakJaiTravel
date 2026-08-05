import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import './AdminLogin.css';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured in client/.env');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message || 'Invalid login credentials');
      }

      // Fetch profile to verify role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
        
      if (profileError || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin role required.");
      }

      // Store the admin token separately from the public pakjai_token
      localStorage.setItem('admin_token', data.session.access_token);
      navigate('/admin');
    } catch (err: any) {
      const msg = typeof err?.message === 'string' && err.message !== '{}' && err.message.trim()
        ? err.message
        : (typeof err === 'string' ? err : 'Authentication failed. Please check your credentials and database connection.');
        
      if (msg.includes('Failed to fetch')) {
        setError('Unable to connect to database server. Please check your Supabase project status or network.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-logo">
            PakJai<span className="logo-accent">Travel</span>
            <span className="admin-label">Admin</span>
          </div>
          <h2>Secure Portal Access</h2>
          <p>Please enter your master credentials to continue.</p>
        </div>

        {error && <div className="admin-login-error">{error}</div>}

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pakjaitravel.com"
              required
              disabled={loading}
              className="admin-input"
            />
          </div>

          <div className="form-group">
            <label>Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="admin-input"
            />
          </div>

          <button type="submit" className="admin-submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>

        <button className="admin-back-public" onClick={() => navigate('/')}>
          ← Return to Public Site
        </button>
      </div>
    </div>
  );
};
