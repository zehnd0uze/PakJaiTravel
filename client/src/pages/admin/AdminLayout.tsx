import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './Admin.css';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard', exact: true },
    { path: '/admin/hotels', icon: '🏨', label: 'Properties' },
    { path: '/admin/users', icon: '👥', label: 'Users' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

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
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="admin-nav-section">
            <div className="admin-nav-title">System</div>
            <button className="admin-nav-item" onClick={() => navigate('/admin')}>
              <span className="admin-nav-icon">⚙️</span>
              <span>Settings</span>
            </button>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
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
