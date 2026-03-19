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

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then(data => setProperties(data))
      .catch(() => {});
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
            <div className="stat-label">Published</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{avgRating}</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: '#1C2833' }}>Quick Actions</h2>
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
