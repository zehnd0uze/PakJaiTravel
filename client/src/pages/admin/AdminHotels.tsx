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
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*');
      if (error) throw error;
      if (data) {
        const formatted = data.map(p => ({
          ...p,
          pricePerNight: p.price_per_night,
          imageUrl: p.image_url,
          isVerified: p.is_verified
        }));
        setProperties(formatted);
      }
    } catch {
      setAlert({ type: 'error', message: 'Failed to load properties.' });
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
        </div>
      </div>
    </>
  );
};
