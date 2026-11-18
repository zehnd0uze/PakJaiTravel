import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { AdminPropertyImportModal } from './AdminPropertyImportModal';

interface Property {
  id: string;
  name: string;
  type: string;
  pricePerNight: number;
  priceType?: 'per_night' | 'per_person';
  currency: string;
  rating: number;
  reviews: number;
  isVerified: boolean;
  imageUrl: string;
  location: string;
  province?: string;
  district?: string;
  status?: string;
  host_info?: { name?: string };
  contact?: { phone?: string; line?: string; bank?: string; accountNumber?: string; accountName?: string };
}

export const AdminHotels: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'pending' | 'draft'>('all');
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

  const showNotice = (type: string, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3200);
  };

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
          priceType: p.price_type || 'per_night',
          currency: p.currency || 'THB',
          rating: p.rating || 4.5,
          reviews: p.reviews || 0,
          imageUrl: p.image_url || (Array.isArray(p.images) && p.images[0]) || '/doiluangbg.jpg',
          location: p.location || [p.district, p.province].filter(Boolean).join(', ') || 'Thailand',
          isVerified: p.is_verified ?? true,
          status: p.status || 'published',
        }));
        setProperties(formatted);
      }
    } catch (err: any) {
      console.error('Failed to load admin properties:', err);
      showNotice('error', err.message || 'Failed to load properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (statusFilter !== 'all' && (p.status || 'published') !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q) ||
          p.host_info?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [properties, statusFilter, searchQuery]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);
      if (error) throw error;

      showNotice('success', `"${name}" has been deleted.`);
      fetchProperties();
    } catch {
      showNotice('error', 'Failed to delete property.');
    }
  };

  const handleStatusChange = async (id: string, name: string, nextStatus: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: nextStatus })
        .eq('id', id);
      if (error) throw error;

      setProperties(prev => prev.map(p => (p.id === id ? { ...p, status: nextStatus } : p)));
      showNotice('success', `"${name}" status updated to ${nextStatus}.`);
    } catch {
      showNotice('error', 'Failed to update status.');
    }
  };

  const handleToggleVerified = async (prop: Property) => {
    const nextVal = !prop.isVerified;
    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_verified: nextVal })
        .eq('id', prop.id);
      if (error) throw error;

      setProperties(prev => prev.map(p => (p.id === prop.id ? { ...p, isVerified: nextVal } : p)));
      showNotice('success', `"${prop.name}" ${nextVal ? 'marked as Verified' : 'unverified'}.`);
    } catch {
      showNotice('error', 'Failed to toggle verified status.');
    }
  };

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Manage Properties ({properties.length})</h1>
          <p className="admin-topbar-sub">Approve, verify, edit, or import accommodations across Chiang Mai & Chiang Dao</p>
        </div>
        <div className="admin-topbar-actions">
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => navigate('/admin/database?table=properties')}
          >
            View in Database Studio
          </button>
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => setIsImportModalOpen(true)}
          >
            Bulk Import
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/hotels/new')}>
            + Add New Property
          </button>
        </div>
      </div>

      <div className="admin-content">
        {alert && (
          <div className={`admin-alert ${alert.type === 'error' ? 'error' : 'success'}`}>
            {alert.message}
          </div>
        )}

        <div className="admin-table-wrapper">
          <div className="admin-table-header">
            <div className="admin-filter-pills">
              {(['all', 'published', 'pending', 'draft'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`admin-filter-pill ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === 'all' ? 'All Stays' : st}
                </button>
              ))}
            </div>

            <div className="db-search-box" style={{ maxWidth: '320px' }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stay name, district, host..."
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Loading properties...
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Host & Contact</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-property-info">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="table-property-thumb"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/doiluangbg.jpg';
                          }}
                        />
                        <div>
                          <div className="table-property-name">{p.name}</div>
                          <div className="table-property-location">{p.location}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.type}</td>
                    <td>
                      <strong>฿{(p.pricePerNight || 0).toLocaleString()}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                        {p.priceType === 'per_person' ? '/ person' : '/ night'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{p.host_info?.name || 'Host'}</div>
                      <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
                        {p.contact?.phone || p.contact?.line || 'No phone/LINE'}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`db-bool-chip ${p.isVerified ? 'true' : 'false'}`}
                        onClick={() => handleToggleVerified(p)}
                        title="Click to toggle verified status"
                      >
                        {p.isVerified ? 'Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td>
                      <span className={`status-badge ${p.status || 'published'}`}>
                        {p.status || 'published'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {p.status !== 'published' ? (
                          <button
                            className="table-action-btn primary"
                            onClick={() => handleStatusChange(p.id, p.name, 'published')}
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            className="table-action-btn"
                            onClick={() => handleStatusChange(p.id, p.name, 'pending')}
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          className="table-action-btn"
                          onClick={() => navigate(`/admin/hotels/${p.id}/edit`)}
                        >
                          Edit
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
                {filteredProperties.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      No matching properties found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AdminPropertyImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchProperties();
          showNotice('success', 'Bulk property import completed.');
        }}
        currentProperties={properties}
      />
    </>
  );
};

export default AdminHotels;
