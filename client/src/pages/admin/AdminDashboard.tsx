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

// Custom SVG Chart component for lightweight visualization
const TrafficBarChart: React.FC<{ data: ChartDot[] }> = ({ data }) => {
  if (!data || data.length === 0) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data available</div>;

  const maxVal = Math.max(...data.map(d => d.value), 1); // Avoid 0 height
  const height = 180;
  const width = 600;
  const barGap = 6;
  const barWidth = (width / data.length) - barGap;

  return (
    <div className="traffic-chart-container" style={{ width: '100%', overflowX: 'auto', padding: '20px 0' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {data.map((dot, i) => {
          const barHeight = (dot.value / maxVal) * (height - 40);
          const x = i * (barWidth + barGap);
          const y = height - barHeight - 20;

          return (
            <g key={i} className="bar-group">
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#1877F2"
                rx="4"
                className="chart-bar"
              >
                <title>{`${dot.label}: ${dot.value} hits`}</title>
              </rect>
              {/* Label (Show every 4th label to avoid crowding) */}
              {i % 4 === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={height}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#757575"
                >
                  {dot.label}
                </text>
              )}
              {/* Value on top of bar if not too small */}
              {barHeight > 20 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#1877F2"
                >
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
  const [usersCount, setUsersCount] = useState<number>(0);
  const [traffic, setTraffic] = useState<TrafficStats>({ active5m: 0, total24h: 0, chartData: [], lastUpdated: '' });

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
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const verifiedCount = properties.filter(p => p.isVerified).length;
  const publishedCount = properties.filter(p => p.status === 'published').length;
  const avgRating = properties.length > 0
    ? (properties.reduce((sum, p) => sum + p.rating, 0) / properties.length).toFixed(1)
    : '0';

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
          <div className="stat-card live-traffic" style={{ border: '2px solid #1877F2', background: '#f0f7ff' }}>
            <div className="stat-value" style={{ color: '#1877F2' }}>{traffic.active5m}</div>
            <div className="stat-label">Active Users (5m)</div>
            <div style={{ fontSize: '0.7rem', color: '#1877F2', fontWeight: 600, marginTop: '4px' }}>LIVE NOW</div>
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
            <div className="stat-value">{usersCount}</div>
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

        {/* Traffic Chart Visualization */}
        <div className="admin-chart-section glass-panel" style={{ marginTop: '24px', padding: '24px', borderRadius: '16px' }}>
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Visitor Traffic (Last 24h)</h2>
            <div style={{ fontSize: '0.85rem', color: '#757575' }}>Last updated: {new Date(traffic.lastUpdated).toLocaleTimeString()}</div>
          </div>
          <TrafficBarChart data={traffic.chartData} />
        </div>

        {/* Quick Actions */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: '#1C2833', marginTop: '32px' }}>Quick Management</h2>
        <div className="quick-actions">
          <div className="quick-action-card" onClick={() => navigate('/admin/hotels/new')}>
            <div className="quick-action-label">Add Property</div>
            <div className="quick-action-desc">Create a new listing</div>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/admin/hotels')}>
            <div className="quick-action-label">Manage Listings</div>
            <div className="quick-action-desc">View & edit all properties</div>
          </div>
          <div className="quick-action-card" onClick={() => window.open('/', '_blank')}>
            <div className="quick-action-label">View Public Site</div>
            <div className="quick-action-desc">See the live website</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
