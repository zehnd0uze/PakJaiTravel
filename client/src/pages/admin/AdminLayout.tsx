import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import './Admin.css';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  const navItems = [
    { path: '/admin', label: 'Dashboard', exact: true },
    { path: '/admin/hotels', label: 'Properties' },
    { path: '/admin/users', label: 'Users' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    let isMounted = true;
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        
        let userId: string | null = null;
        if (token) {
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) userId = user.id;
        }
        
        if (!userId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) userId = user.id;
        }

        if (!userId) {
          if (isMounted) {
            localStorage.removeItem('admin_token');
            navigate('/admin/login');
          }
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (!profile || profile.role !== 'admin') {
          if (isMounted) {
            localStorage.removeItem('admin_token');
            navigate('/admin/login');
          }
          return;
        }

        if (isMounted) {
          setChecking(false);
        }
      } catch (err) {
        console.error('Admin check error:', err);
        if (isMounted) {
          navigate('/admin/login');
        }
      }
    };

    checkAdmin();
    return () => { isMounted = false; };
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    localStorage.removeItem('admin_token');
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'var(--font-body)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            PakJai<span className="logo-accent">Travel</span>
            <span className="admin-label">Admin</span>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">
            <div className="admin-nav-title">Main</div>
            {navItems.map((item) => (
              <button
                key={item.path}
                className={`admin-nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="admin-nav-section">
            <div className="admin-nav-title">System</div>
            <button className="admin-nav-item" onClick={() => navigate('/admin')}>
              <span>Settings</span>
            </button>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-back-btn" onClick={handleLogout} style={{ color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2', marginBottom: '12px' }}>
            Logout Admin
          </button>
          <button className="admin-back-btn" onClick={() => navigate('/')}>
            ← Back to Public Site
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
};
