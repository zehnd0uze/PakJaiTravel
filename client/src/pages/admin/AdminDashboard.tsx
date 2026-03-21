import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Property {
  id: string;
  name: string;
  type: string;
  pricePerNight: number;
  rating: number;
  reviews: number;
  isVerified: boolean;
  status?: string;
}

interface TrafficStats {
  active5m: number;
  total24h: number;
  lastUpdated: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [traffic, setTraffic] = useState<TrafficStats>({ active5m: 0, total24h: 0, lastUpdated: '' });

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/properties')
        .then(r => r.json())
        .then(data => setProperties(data))
        .catch(() => {});

      fetch('/api/auth/users')
        .then(r => r.json())
        .then(data => setUsersCount(data?.length || 0))
        .catch(() => {});

      fetch('/api/admin/traffic')
        .then(r => r.json())
        .then(data => setTraffic(data))
        .catch(() => {});
    };

    fetchData();
    // Refresh traffic every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalProperties = properties.length;
  const verifiedCount = properties.filter(p => p.isVerified).length;
  const publishedCount = properties.filter(p => p.status === 'published').length;
  const avgRating = properties.length > 0
    ? (properties.reduce((sum, p) => sum + p.rating, 0) / properties.length).toFixed(1)
    : '0';

  return (
    <>
      <div className="admin-topbar">
        <h1>Dashboard</h1>
        <div className="admin-topbar-actions">
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/hotels/new')}>
            + Add Property
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card live-traffic" style={{ border: '1px solid #1877F2', background: '#f0f7ff' }}>
            <div className="stat-icon">📶</div>
            <div className="stat-value" style={{ color: '#1877F2' }}>{traffic.active5m}</div>
            <div className="stat-label">Active Users (5m)</div>
            <div style={{ fontSize: '0.7rem', color: '#757575', marginTop: '4px' }}>Live Monitoring</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-value">{traffic.total24h}</div>
            <div className="stat-label">Total Visits (24h)</div>
          </div>
          <div className="stat-card" onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon">👥</div>
            <div className="stat-value">{usersCount}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏨</div>
            <div className="stat-value">{totalProperties}</div>
            <div className="stat-label">Total Properties</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{verifiedCount}</div>
            <div className="stat-label">Verified Listings</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📢</div>
            <div className="stat-value">{publishedCount}</div>
            <div className="stat-label">Published Stays</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{avgRating}</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: '#1C2833', marginTop: '24px' }}>Quick Actions</h2>
        <div className="quick-actions">
          <div className="quick-action-card" onClick={() => navigate('/admin/hotels/new')}>
            <div className="quick-action-icon">➕</div>
            <div className="quick-action-label">Add Property</div>
            <div className="quick-action-desc">Create a new listing</div>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/admin/hotels')}>
            <div className="quick-action-icon">📋</div>
            <div className="quick-action-label">Manage Listings</div>
            <div className="quick-action-desc">View & edit all properties</div>
          </div>
          <div className="quick-action-card" onClick={() => window.open('/', '_blank')}>
            <div className="quick-action-icon">🌐</div>
            <div className="quick-action-label">View Public Site</div>
            <div className="quick-action-desc">See the live website</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
