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
  createdAt?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Activity {
  id: string;
  type: 'user' | 'property';
  text: string;
  time: string;
}

interface ChartDot {
  label: string;
  value: number;
}

interface TrafficStats {
  active5m: number;
  total24h: number;
  chartData: ChartDot[];
  lastUpdated: string;
}

// Custom Interactive SVG Chart
const TrafficBarChart: React.FC<{ data: ChartDot[] }> = ({ data }) => {
  if (!data || data.length === 0) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data available</div>;

  const maxVal = Math.max(...data.map(d => d.value), 10);
  const height = 180;
  const width = 800; // Increased width for better spacing
  const barGap = 8;
  const barWidth = (width / data.length) - barGap;

  return (
    <div className="traffic-chart-container" style={{ width: '100%', overflowX: 'auto', padding: '10px 0' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {data.map((dot, i) => {
          const barHeight = Math.max((dot.value / maxVal) * (height - 40), 4); // Min height of 4px
          const x = i * (barWidth + barGap);
          const y = height - barHeight - 20;

          return (
            <g key={i} className="chart-bar-group" style={{ cursor: 'pointer' }}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="var(--primary-color)"
                rx="4"
                className="chart-bar-rect"
                style={{ transition: 'all 0.3s ease', opacity: 0.8 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.fill = 'var(--primary-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.fill = 'var(--primary-color)';
                }}
              >
                <title>{`${dot.label}: ${dot.value} visits`}</title>
              </rect>
              {i % 3 === 0 && (
                <text x={x + barWidth / 2} y={height} textAnchor="middle" fontSize="11" fill="var(--text-secondary)" fontFamily="var(--font-body)">
                  {dot.label}
                </text>
              )}
              {barHeight > 20 && dot.value > 0 && (
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-primary)" fontFamily="var(--font-body)">
                  {dot.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [traffic, setTraffic] = useState<TrafficStats>({ active5m: 0, total24h: 0, chartData: [], lastUpdated: '' });

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/properties')
        .then(r => r.json())
        .then(data => setProperties(data))
        .catch(() => {});

      // Need to fetch users (might require admin token now, but we'll try)
      fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setUsers(data);
        })
        .catch(() => {});

      fetch('/api/admin/traffic')
        .then(r => r.json())
        .then(data => setTraffic(data))
        .catch(() => {});
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const verifiedCount = properties.filter(p => p.isVerified).length;
  const publishedCount = properties.filter(p => p.status === 'published').length;
  const avgRating = properties.length > 0
    ? (properties.reduce((sum, p) => sum + p.rating, 0) / properties.length).toFixed(1)
    : '0';

  // Sort properties by highest rating + reviews for "Top Properties"
  const topProperties = [...properties]
    .sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews))
    .slice(0, 3);

  // Recent Activity logic (Mock up from recent users/properties)
  const recentActivities: Activity[] = [];
  users.slice(0, 3).forEach(u => {
    recentActivities.push({
      id: `u-${u.id}`,
      type: 'user',
      text: `New user registered: ${u.name}`,
      time: new Date(u.createdAt).toLocaleDateString()
    });
  });
  properties.slice(-2).forEach(p => {
    recentActivities.push({
      id: `p-${p.id}`,
      type: 'property',
      text: `Property updated: ${p.name}`,
      time: new Date().toLocaleDateString()
    });
  });

  return (
    <>
      <div className="admin-topbar">
        <h1>Dashboard Overview</h1>
        <div className="admin-topbar-actions">
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/hotels/new')}>
            + Add Property
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Main Statistics Row */}
        <div className="stats-grid">
          <div className="stat-card live-traffic" style={{ border: '2px solid var(--primary-color)', background: 'rgba(5, 176, 166, 0.05)' }}>
            <div className="stat-value" style={{ color: 'var(--primary-color)' }}>{traffic.active5m}</div>
            <div className="stat-label">Active Users (5m)</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 700, marginTop: '4px', letterSpacing: '0.5px' }}>LIVE NOW</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{traffic.total24h}</div>
            <div className="stat-label">Total Visits (24h)</div>
          </div>
           <div className="stat-card">
            <div className="stat-value">{publishedCount}</div>
            <div className="stat-label">Published Stays</div>
          </div>
          <div className="stat-card" onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer' }}>
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{avgRating}</div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{verifiedCount}</div>
            <div className="stat-label">Verified Listings</div>
          </div>
        </div>

        {/* Analytics & Activity Row */}
        <div className="dashboard-metrics-row" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', marginTop: '24px' }}>
          
          {/* Traffic Chart */}
          <div className="admin-chart-section" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Visitor Traffic</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Last 24 Hours Overview</div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '4px 12px', borderRadius: '20px' }}>
                Updated: {new Date(traffic.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
            <TrafficBarChart data={traffic.chartData} />
          </div>

          {/* Recent Activity Feed */}
          <div className="admin-activity-section" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Recent Activity</h2>
            <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentActivities.length > 0 ? recentActivities.map(act => (
                <div key={act.id} className="activity-item" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: act.type === 'user' ? 'var(--primary-color)' : 'var(--text-primary)', marginTop: '6px', flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>{act.text}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{act.time}</div>
                  </div>
                </div>
              )) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No recent activity.</div>
              )}
            </div>
            <button className="admin-btn admin-btn-outline" style={{ width: '100%', marginTop: '20px', fontSize: '0.85rem' }} onClick={() => navigate('/admin/users')}>
              View All Users
            </button>
          </div>
        </div>

        {/* Lower Row: Top Properties & Quick Actions */}
        <div className="dashboard-lower-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
          
          {/* Top Properties Performance */}
          <div className="top-properties-section" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
             <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Top Performing Properties</h2>
             <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ paddingBottom: '12px' }}>Property Name</th>
                  <th style={{ paddingBottom: '12px' }}>Rating</th>
                  <th style={{ paddingBottom: '12px' }}>Reviews</th>
                  <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Price/Night</th>
                </tr>
              </thead>
              <tbody>
                {topProperties.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 0', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                    <td style={{ padding: '16px 0', color: 'var(--primary-color)', fontWeight: 600 }}>★ {p.rating}</td>
                    <td style={{ padding: '16px 0' }}>{p.reviews} combined</td>
                    <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 500 }}>BAHT {p.pricePerNight}</td>
                  </tr>
                ))}
              </tbody>
             </table>
          </div>

          {/* Quick Actions Panel */}
          <div className="quick-actions-panel">
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Quick Actions</h2>
            <div className="quick-actions-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div 
                className="quick-action-card premium-action" 
                onClick={() => navigate('/admin/hotels/new')}
                style={{ background: 'var(--text-primary)', color: '#fff', padding: '20px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: 'var(--shadow-md)' }}
              >
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>+ Add New Property</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Publish a new listing to the public</div>
              </div>
              
              <div 
                className="quick-action-card standard-action" 
                onClick={() => navigate('/admin/hotels')}
                style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              >
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Manage Listings</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Edit details, prices, and status</div>
              </div>

              <div 
                className="quick-action-card standard-action" 
                onClick={() => window.open('/', '_blank')}
                style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              >
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>View Live Site ↗</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Open PakJaiTravel in new tab</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
