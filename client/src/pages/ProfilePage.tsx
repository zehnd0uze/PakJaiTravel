import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '60vh' }}>
      <h1>{user.name}'s Profile</h1>
      <p>Email: {user.email}</p>
      <p>Status: {user.isVerified ? 'Verified Account ✅' : 'Unverified Account ❌'}</p>
      
      <div style={{ marginTop: '40px', padding: '40px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
        <h2>My Travel Posts</h2>
        <p style={{ color: '#64748b' }}>Your personal travel history and community reviews will appear here soon!</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/community')}>
          Write a new post
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
