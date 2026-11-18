import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isVerified: boolean;
}

export const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user' });
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'host' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
          email: u.email || '',
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

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_user', { 
        target_user_id: id 
      });

      if (error) throw error;
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting the user.');
    }
  };

  const handleToggleVerify = async (u: User) => {
    const nextVal = !u.isVerified;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: nextVal })
        .eq('id', u.id);

      if (error) throw error;
      setUsers(users.map(item => item.id === u.id ? { ...item, isVerified: nextVal } : item));
    } catch (err) {
      console.error('Verify error:', err);
      alert('Failed to update verification status.');
    }
  };

  const handleQuickRoleChange = async (u: User, nextRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', u.id);
      if (error) throw error;
      setUsers(users.map(item => item.id === u.id ? { ...item, role: nextRole } : item));
    } catch (err) {
      console.error('Role update error:', err);
      alert('Failed to update role.');
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
    <div>
      <div className="admin-topbar">
        <div>
          <h1>Users & Roles ({users.length})</h1>
          <p className="admin-topbar-sub">Manage traveler accounts, host permissions, and administrator access</p>
        </div>
        <div className="admin-topbar-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => navigate('/admin/database?table=profiles')}
          >
            View in Database Studio
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-table-wrapper">
          <div className="admin-table-header">
            <div className="admin-filter-pills">
              {(['all', 'admin', 'host', 'user'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`admin-filter-pill ${roleFilter === r ? 'active' : ''}`}
                  onClick={() => setRoleFilter(r)}
                >
                  {r === 'all' ? 'All Users' : `${r}s`}
                </button>
              ))}
            </div>

            <div className="db-search-box" style={{ maxWidth: '300px' }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or email..."
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading users...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Email Verified</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name}</strong></td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleQuickRoleChange(user, e.target.value)}
                        className="admin-inline-role-select"
                      >
                        <option value="user">user</option>
                        <option value="host">host</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`db-bool-chip ${user.isVerified ? 'true' : 'false'}`}
                        onClick={() => handleToggleVerify(user)}
                      >
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-action-btn"
                          onClick={() => startEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="table-action-btn danger"
                          onClick={() => handleDelete(user.id, user.name)}
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3>Edit User</h3>
            {error && <div className="admin-alert error">{error}</div>}
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="host">Host</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
