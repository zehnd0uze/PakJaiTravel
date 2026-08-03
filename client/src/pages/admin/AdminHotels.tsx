import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

interface Property {
  id: string;
  name: string;
  type: string;
  pricePerNight: number;
  currency: string;
  rating: number;
  reviews: number;
  isVerified: boolean;
  imageUrl: string;
  location: string;
  status?: string;
}

export const AdminHotels: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) {
        const formatted = (data as any[]).map(p => ({
          ...p,
          pricePerNight: p.price_per_night || 0,
          currency: p.currency || 'THB',
          rating: p.rating || 4.5,
          reviews: p.reviews || 0,
          imageUrl: p.image_url || (Array.isArray(p.images) && p.images[0]) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          location: p.location || [p.district, p.province].filter(Boolean).join(', ') || 'Thailand',
          isVerified: p.is_verified ?? true
        }));
        setProperties(formatted);
      }
    } catch (err: any) {
      console.error('Failed to load admin properties:', err);
      setAlert({ type: 'error', message: err.message || 'Failed to load properties.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);
      if (error) throw error;

      setAlert({ type: 'success', message: `"${name}" has been deleted.` });
      fetchProperties();
    } catch {
      setAlert({ type: 'error', message: 'Failed to delete property.' });
    }

    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <>
      <div className="admin-topbar">
        <h1>Properties</h1>
        <div className="admin-topbar-actions">
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/hotels/new')}>
            + Add Property
          </button>
        </div>
      </div>

      <div className="admin-content">
        {alert && (
          <div className={`admin-alert ${alert.type}`}>
            {alert.message}
          </div>
        )}

        <div className="admin-table-wrapper">
          <div className="admin-table-header">
            <h2>All Properties ({properties.length})</h2>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 12px' }} />
              <p>Loading accommodations...</p>
            </div>
          ) : properties.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '16px', fontSize: '1rem' }}>No properties found in the database.</p>
              <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/hotels/new')}>
                + Add Your First Property
              </button>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-property-info">
                        <img src={p.imageUrl} alt={p.name} className="table-property-thumb" />
                        <div>
                          <div className="table-property-name">{p.name}</div>
                          <div className="table-property-location">{p.location}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.type}</td>
                    <td>฿{p.pricePerNight.toLocaleString()}</td>
                    <td>{p.rating} ({p.reviews})</td>
                    <td>
                      <span className={`status-badge ${p.status || 'published'}`}>
                        {p.status || 'published'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-action-btn"
                          onClick={() => navigate(`/admin/hotels/${p.id}/edit`)}
                        >
                          Edit
                        </button>
                        <button
                          className="table-action-btn"
                          onClick={() => window.open(`/hotels/${p.id}`, '_blank')}
                        >
                          View
                        </button>
                        <button
                          className="table-action-btn danger"
                          onClick={() => handleDelete(p.id, p.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};
