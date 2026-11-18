import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import './Admin.css';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0);
  const [pendingPropsCount, setPendingPropsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [adminEmail, setAdminEmail] = useState('');

  const currentView = searchParams.get('view') || 'tables';

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const isStudioView = (view: string) => {
    return location.pathname.startsWith('/admin/database') && currentView === view;
  };

  const fetchBadges = async () => {
    try {
      const { count: cCount } = await supabase
        .from('property_claims')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (cCount !== null) setPendingClaimsCount(cCount);
    } catch {
      // ignore
    }

    try {
      const { count: pCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (pCount !== null) setPendingPropsCount(pCount);
    } catch {
      // ignore
    }

    try {
      const { count: jCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
      if (jCount !== null) setPostsCount(jCount);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBadges();
  }, [location.pathname, location.search]);

  useEffect(() => {
    let isMounted = true;
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('admin_token');

        let userId: string | null = null;
        let email = '';
        if (token) {
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            userId = user.id;
            email = user.email || '';
          }
        }

        if (!userId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            userId = user.id;
            email = user.email || '';
          }
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
          .select('role, email')
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
          setAdminEmail(profile.email || email);
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
    return () => {
      isMounted = false;
    };
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    localStorage.removeItem('admin_token');
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (checking) {
    return (
      <div className="admin-Verify-screen">
        <div className="admin-Verify-box">
          <div className="spinner" />
          <p>Verifying administrator session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo" onClick={() => navigate('/admin')}>
            PAKJAI<span className="admin-label">Admin</span>
          </div>
          {adminEmail && <div className="admin-user-sub">{adminEmail}</div>}
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">
            <div className="admin-nav-title">Operations</div>

            <button
              className={`admin-nav-item ${isActive('/admin', true) ? 'active' : ''}`}
              onClick={() => navigate('/admin')}
            >
              <span className="admin-nav-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </span>
              <span className="admin-nav-label">Overview</span>
            </button>

            <button
              className={`admin-nav-item ${isActive('/admin/hotels') ? 'active' : ''}`}
              onClick={() => navigate('/admin/hotels')}
            >
              <span className="admin-nav-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              <span className="admin-nav-label">Properties</span>
              {pendingPropsCount > 0 && (
                <span className="admin-nav-badge warn">{pendingPropsCount}</span>
              )}
            </button>

            <button
              className={`admin-nav-item ${isActive('/admin/claims') ? 'active' : ''}`}
              onClick={() => navigate('/admin/claims')}
            >
              <span className="admin-nav-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </span>
              <span className="admin-nav-label">Ownership Claims</span>
              {pendingClaimsCount > 0 && (
                <span className="admin-nav-badge alert">{pendingClaimsCount}</span>
              )}
            </button>

            <button
              className={`admin-nav-item ${isStudioView('moderation') ? 'active' : ''}`}
              onClick={() => navigate('/admin/database?view=moderation')}
            >
              <span className="admin-nav-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <span className="admin-nav-label">Community & Posts</span>
              {postsCount > 0 && <span className="admin-nav-badge">{postsCount}</span>}
            </button>

            <button
              className={`admin-nav-item ${isActive('/admin/users') ? 'active' : ''}`}
              onClick={() => navigate('/admin/users')}
            >
              <span className="admin-nav-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span className="admin-nav-label">Users & Roles</span>
            </button>
          </div>

          <div className="admin-nav-section">
            <div className="admin-nav-title">Supabase Studio</div>

            <button
              className={`admin-nav-item ${isStudioView('tables') ? 'active' : ''}`}
              onClick={() => navigate('/admin/database?view=tables')}
            >
              <span className="admin-nav-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </span>
              <span className="admin-nav-label">Table Editor</span>
            </button>

            <button
              className={`admin-nav-item ${isStudioView('sql') ? 'active' : ''}`}
              onClick={() => navigate('/admin/database?view=sql')}
            >
              <span className="admin-nav-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="19" x2="20" y2="19" />
                </svg>
              </span>
              <span className="admin-nav-label">SQL & Query Runner</span>
            </button>

            <button
              className={`admin-nav-item ${isStudioView('media') ? 'active' : ''}`}
              onClick={() => navigate('/admin/database?view=media')}
            >
              <span className="admin-nav-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </span>
              <span className="admin-nav-label">Storage & Media</span>
            </button>

            <button
              className={`admin-nav-item ${isStudioView('security') ? 'active' : ''}`}
              onClick={() => navigate('/admin/database?view=security')}
            >
              <span className="admin-nav-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <span className="admin-nav-label">RLS & Security</span>
            </button>

            <button
              className={`admin-nav-item ${isStudioView('schema') ? 'active' : ''}`}
              onClick={() => navigate('/admin/database?view=schema')}
            >
              <span className="admin-nav-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </span>
              <span className="admin-nav-label">Schema & Backups</span>
            </button>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-footer-link" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span>Public Site</span>
          </button>

          <button className="admin-footer-link logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign out</span>
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
