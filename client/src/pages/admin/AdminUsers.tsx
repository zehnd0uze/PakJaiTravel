import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt: string;
  isVerified: boolean;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user' });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) {
        const formatted = (data as any[]).map(u => ({
          id: u.id,
          name: u.name || 'Anonymous',
          email: u.email,
          role: u.role || 'user',
          createdAt: u.created_at || new Date().toISOString(),
          isVerified: u.is_verified ?? false
        }));
        setUsers(formatted);
      }
    } catch (err: any) {
      console.error('Failed to fetch users', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting the user.');
    }
  };

  const handleVerify = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to manually verify the email for "${name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', id);

      if (error) throw error;

      setUsers(users.map(u => u.id === id ? { ...u, isVerified: true } : u));
    } catch (err) {
      console.error('Verify error:', err);
      alert('An error occurred while verifying the user.');
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role || 'user' });
    setError('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          email: editForm.email,
          role: editForm.role
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
      setEditingUser(null);
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'An error occurred while updating the user.');
    }
  };

  return (
    <>
      <div className="admin-topbar">
        <h1>User Management</h1>
      </div>

      <div className="admin-content">
        <div className="admin-card" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 12px' }} />
              <p>Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No registered users found.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '12px' }}>Username</th>
                    <th style={{ padding: '12px' }}>Email</th>
                    <th style={{ padding: '12px' }}>Role</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Joined Date</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}><strong>{user.name}</strong></td>
                      <td style={{ padding: '12px' }}>{user.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          background: user.role === 'admin' ? '#fee2e2' : user.role === 'host' ? '#e0e7ff' : '#f3f4f6', 
                          color: user.role === 'admin' ? '#dc2626' : user.role === 'host' ? '#4338ca' : '#4b5563', 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {user.isVerified ? (
                          <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Verified</span>
                        ) : (
                          <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Unverified</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {!user.isVerified && (
                          <button 
                            onClick={() => handleVerify(user.id, user.name)}
                            style={{ marginRight: '8px', padding: '6px 12px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            Verify
                          </button>
                        )}
                        <button 
                          onClick={() => startEdit(user)}
                          style={{ marginRight: '8px', padding: '6px 12px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id, user.name)}
                          style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="admin-card" style={{ width: '420px', maxWidth: '90%', background: '#fff', borderRadius: 'var(--radius-xl)', padding: '28px', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Edit User</h2>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Username</label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Email</label>
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Account Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({...editForm, role: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff' }}
                >
                  <option value="user">User</option>
                  <option value="host">Host</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p style={{ color: '#dc2626', marginBottom: '15px', fontSize: '0.85rem' }}>{error}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '8px 16px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '6px' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 16px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 600 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
