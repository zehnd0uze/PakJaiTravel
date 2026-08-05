import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

interface ClaimItem {
  id: string;
  property_id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  proof_notes?: string;
  proof_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  property?: {
    name: string;
    district?: string;
    province?: string;
    contact?: { phone?: string; phone2?: string };
    image_url?: string;
  };
  claimant?: {
    name: string;
    email: string;
    role?: string;
  };
}

export const AdminClaims: React.FC = () => {
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('property_claims')
        .select(`
          *,
          property:properties (name, district, province, contact, image_url),
          claimant:profiles (name, email, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (err: any) {
      console.error('Failed to load claims:', err);
      setMessage({ text: err.message || 'Failed to fetch ownership claims', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleApprove = async (claim: ClaimItem) => {
    if (!window.confirm(`Approve ownership claim for "${claim.property?.name || 'this property'}" by ${claim.full_name}? This will assign the accommodation to their host account.`)) {
      return;
    }

    try {
      setActionLoading(claim.id);
      setMessage(null);

      // 1. Update property ownership
      const { error: propError } = await supabase
        .from('properties')
        .update({
          owner_id: claim.user_id,
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', claim.property_id);

      if (propError) throw propError;

      // 2. Ensure user has host role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'host',
          is_verified: true
        })
        .eq('id', claim.user_id);

      if (profileError) console.warn('Profile role update notice:', profileError);

      // 3. Mark claim as approved
      const { error: claimError } = await supabase
        .from('property_claims')
        .update({
          status: 'approved',
          admin_notes: 'Approved by Administrator',
          updated_at: new Date().toISOString()
        })
        .eq('id', claim.id);

      if (claimError) throw claimError;

      setMessage({ text: `✓ Claim for "${claim.property?.name}" approved successfully! Ownership transferred to ${claim.full_name}.`, type: 'success' });
      fetchClaims();
    } catch (err: any) {
      console.error('Approval failed:', err);
      setMessage({ text: `Failed to approve: ${err.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (claim: ClaimItem) => {
    const reason = window.prompt(`Please enter the rejection reason for ${claim.full_name}:`, 'Verification details did not match accommodation records.');
    if (reason === null) return;

    try {
      setActionLoading(claim.id);
      setMessage(null);

      const { error } = await supabase
        .from('property_claims')
        .update({
          status: 'rejected',
          admin_notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', claim.id);

      if (error) throw error;

      setMessage({ text: `Claim marked as rejected.`, type: 'success' });
      fetchClaims();
    } catch (err: any) {
      console.error('Rejection failed:', err);
      setMessage({ text: `Failed to reject: ${err.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredClaims = claims.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const propName = (c.property?.name || '').toLowerCase();
      const claimant = (c.full_name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return propName.includes(q) || claimant.includes(q) || phone.includes(q);
    }
    return true;
  });

  const pendingCount = claims.filter(c => c.status === 'pending').length;

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            Ownership Claims (คำขอเป็นเจ้าของที่พัก)
            {pendingCount > 0 && (
              <span style={{
                fontSize: '0.85rem',
                background: '#fef3c7',
                color: '#b45309',
                padding: '4px 10px',
                borderRadius: '20px',
                marginLeft: '12px',
                fontWeight: 700
              }}>
                {pendingCount} Pending
              </span>
            )}
          </h1>
          <p className="admin-page-subtitle">
            Review host ownership verification requests for pre-listed homestays and transfer listing management.
          </p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '0.92rem',
          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: message.type === 'success' ? '#166534' : '#dc2626'
        }}>
          {message.text}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-table-container" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`admin-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: statusFilter === 'all' ? '#0f172a' : '#ffffff',
              color: statusFilter === 'all' ? '#ffffff' : '#475569',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            All Claims ({claims.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #fef3c7',
              background: statusFilter === 'pending' ? '#d97706' : '#fffbeb',
              color: statusFilter === 'pending' ? '#ffffff' : '#92400e',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            ⏳ Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #dcfce7',
              background: statusFilter === 'approved' ? '#16a34a' : '#f0fdf4',
              color: statusFilter === 'approved' ? '#ffffff' : '#166534',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            ✅ Approved ({claims.filter(c => c.status === 'approved').length})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #fee2e2',
              background: statusFilter === 'rejected' ? '#dc2626' : '#fef2f2',
              color: statusFilter === 'rejected' ? '#ffffff' : '#991b1b',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            ❌ Rejected ({claims.filter(c => c.status === 'rejected').length})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by property, host name, or phone..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1.5px solid #cbd5e1',
            fontSize: '0.9rem',
            width: '320px',
            maxWidth: '100%'
          }}
        />
      </div>

      {/* Claims List */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p>Loading ownership claims...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🏷️</span>
            <h3>No ownership claims found</h3>
            <p style={{ fontSize: '0.9rem' }}>
              {statusFilter !== 'all' ? `No claims matching filter "${statusFilter}".` : 'When owners submit claims for pre-listed homestays, they will appear here for review.'}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Accommodation</th>
                <th>Claimant Info</th>
                <th>Verification Details & Proof</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => {
                const isActioning = actionLoading === claim.id;
                return (
                  <tr key={claim.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {claim.property?.image_url ? (
                          <img
                            src={claim.property.image_url}
                            alt=""
                            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                            🏡
                          </div>
                        )}
                        <div>
                          <strong style={{ color: '#0f172a', display: 'block' }}>
                            {claim.property?.name || 'Pre-listed Property'}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {claim.property?.district || 'Chiang Dao'}, {claim.property?.province || 'Chiang Mai'}
                          </span>
                          {claim.property?.contact?.phone && (
                            <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '2px' }}>
                              Listed Phone: {claim.property.contact.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>
                        <strong style={{ color: '#1e293b' }}>{claim.full_name}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                          📞 {claim.phone}
                        </div>
                        {claim.email && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            ✉️ {claim.email}
                          </div>
                        )}
                      </div>
                    </td>

                    <td style={{ maxWidth: '280px' }}>
                      <p style={{ fontSize: '0.86rem', color: '#334155', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                        {claim.proof_notes || '—'}
                      </p>
                      {claim.proof_url && (
                        <a
                          href={claim.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem',
                            color: '#2563eb',
                            textDecoration: 'underline'
                          }}
                        >
                          📎 View Attached Proof
                        </a>
                      )}
                      {claim.admin_notes && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                          Note: {claim.admin_notes}
                        </div>
                      )}
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '20px',
                          background:
                            claim.status === 'approved'
                              ? '#dcfce7'
                              : claim.status === 'rejected'
                              ? '#fee2e2'
                              : '#fef3c7',
                          color:
                            claim.status === 'approved'
                              ? '#166534'
                              : claim.status === 'rejected'
                              ? '#991b1b'
                              : '#92400e',
                          textTransform: 'uppercase'
                        }}
                      >
                        {claim.status === 'approved' ? '✓ Approved' : claim.status === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.82rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(claim.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    <td>
                      {claim.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApprove(claim)}
                            disabled={isActioning}
                            style={{
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {isActioning ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(claim)}
                            disabled={isActioning}
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
