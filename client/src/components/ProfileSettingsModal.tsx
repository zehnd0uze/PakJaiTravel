import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadToCloudinary } from '../utils/cloudinary';
import './ProfileSettingsModal.css';

interface Props {
  onClose: () => void;
}

const ProfileSettingsModal: React.FC<Props> = ({ onClose }) => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [nameDraft, setNameDraft] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!user) return null;

  const avatarSrc =
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2C4C3B&color=fff&size=200`;

  const handleAvatarChange = async (file: File) => {
    setUploadingAvatar(true);
    setError(null);
    try {
      const url = await uploadToCloudinary(file);
      await updateProfile({ avatar: url });
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setError('Could not update photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === user.name) return;
    setSavingName(true);
    setError(null);
    setNameSaved(false);
    try {
      await updateProfile({ name: trimmed });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch (err: any) {
      setError(err?.message || 'Could not save name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  return (
    <div className="psm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="psm-panel" role="dialog" aria-label="Profile settings">

        {/* ── Header ── */}
        <div className="psm-header">
          <button className="psm-back-btn" onClick={onClose} aria-label="Back">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <h2 className="psm-title">Settings</h2>
          <span className="psm-header-spacer" />
        </div>

        {/* ── Body ── */}
        <div className="psm-body">

          {error && <div className="psm-error">{error}</div>}

          {/* Section: Profile */}
          <div className="psm-section-label">Profile</div>
          <div className="psm-card">
            <div className="psm-row">
              <span className="psm-row-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </span>
              <img src={avatarSrc} alt={user.name} className={`psm-avatar${uploadingAvatar ? ' uploading' : ''}`} />
              <button className="psm-text-btn" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                {uploadingAvatar ? 'Uploading…' : 'Change Profile Photo'}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="psm-hidden-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarChange(file);
                  e.target.value = '';
                }}
              />
            </div>

            <div className="psm-row psm-row-name">
              <span className="psm-row-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              </span>
              <div className="psm-name-field">
                <span className="psm-field-label">Name</span>
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={60}
                  aria-label="Display name"
                />
              </div>
              <button
                className="psm-save-btn"
                onClick={handleSaveName}
                disabled={savingName || !nameDraft.trim() || nameDraft.trim() === user.name}
              >
                {savingName ? 'Saving…' : nameSaved ? 'Saved ✓' : 'Save'}
              </button>
            </div>
          </div>

          {/* Section: Account */}
          <div className="psm-section-label">Account</div>
          <div className="psm-card">
            <div className="psm-row">
              <span className="psm-row-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/></svg>
              </span>
              <div className="psm-static-field">
                <span className="psm-field-label">Email</span>
                <span className="psm-field-value">{user.email}</span>
              </div>
            </div>
            <div className="psm-row">
              <span className="psm-row-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.2-6.3-4.5L5.7 20.8 8 13.6l-6-4.4h7.6z"/></svg>
              </span>
              <div className="psm-static-field">
                <span className="psm-field-label">Account type</span>
                <span className="psm-field-value">{user.role === 'host' ? 'Host' : 'Traveler'}</span>
              </div>
            </div>
            <div className="psm-row">
              <span className="psm-row-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
              </span>
              <div className="psm-static-field">
                <span className="psm-field-label">Verification</span>
                <span className={`psm-field-value ${user.isVerified ? 'psm-ok' : 'psm-warn'}`}>
                  {user.isVerified ? 'Verified account' : 'Not verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Legal */}
          <div className="psm-section-label">Legal</div>
          <div className="psm-card">
            <button className="psm-row pmm-nav-row" onClick={() => goTo('/terms')}>
              <span className="psm-row-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
              </span>
              <span className="psm-row-label">Terms of Service</span>
              <span className="psm-chevron" aria-hidden="true">›</span>
            </button>
            <button className="psm-row pmm-nav-row" onClick={() => goTo('/privacy')}>
              <span className="psm-row-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
              </span>
              <span className="psm-row-label">Privacy Policy</span>
              <span className="psm-chevron" aria-hidden="true">›</span>
            </button>
          </div>

          {/* Section: Session */}
          <div className="psm-card">
            <button className="psm-row psm-danger-row" onClick={handleLogout}>
              <span className="psm-row-icon psm-danger-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
              </span>
              <span className="psm-row-label">Log Out</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
