import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { uploadToCloudinary } from '../utils/cloudinary';
import { compressImage } from '../utils/imageCompression';
import './ClaimPropertyModal.css';

interface ClaimPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPropertyId?: string;
  preselectedPropertyName?: string;
  onClaimSubmitted?: () => void;
}

interface PropertyOption {
  id: string;
  name: string;
  district?: string;
  province?: string;
  phone?: string;
  imageUrl?: string;
}

export const ClaimPropertyModal: React.FC<ClaimPropertyModalProps> = ({
  isOpen,
  onClose,
  preselectedPropertyId,
  preselectedPropertyName,
  onClaimSubmitted
}) => {
  const { t } = useTranslation();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(preselectedPropertyId || '');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [proofNotes, setProofNotes] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [uploadingProof, setUploadingProof] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (preselectedPropertyId) {
      setSelectedPropertyId(preselectedPropertyId);
    }
  }, [preselectedPropertyId]);

  // Fetch properties if no preselected property
  useEffect(() => {
    if (isOpen && !preselectedPropertyId) {
      const fetchList = async () => {
        try {
          const { data, error } = await supabase
            .from('properties')
            .select('id, name, district, province, image_url, contact')
            .order('name', { ascending: true });

          if (error) throw error;
          if (data) {
            setProperties(
              data.map(p => ({
                id: p.id,
                name: p.name,
                district: p.district,
                province: p.province,
                phone: p.contact?.phone || '',
                imageUrl: p.image_url
              }))
            );
          }
        } catch (err) {
          console.error('Failed to load properties for claim modal:', err);
        }
      };
      fetchList();
    }
  }, [isOpen, preselectedPropertyId]);

  if (!isOpen) return null;

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingProof(true);
      setError('');
      const compressed = await compressImage(file);
      const uploadedUrl = await uploadToCloudinary(compressed);
      setProofUrl(uploadedUrl);
    } catch (err: any) {
      console.error('Proof upload failed:', err);
      setError(t('claimModal.errUpload'));
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      onClose();
      openAuthModal('login');
      return;
    }

    if (!selectedPropertyId) {
      setError(t('claimModal.errSelect'));
      return;
    }

    if (!fullName.trim()) {
      setError(t('claimModal.errName'));
      return;
    }

    if (!phone.trim()) {
      setError(t('claimModal.errPhone'));
      return;
    }

    try {
      setSubmitting(true);

      const { error: insertError } = await supabase
        .from('property_claims')
        .insert({
          property_id: selectedPropertyId,
          user_id: user.id,
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || user.email,
          proof_notes: proofNotes.trim(),
          proof_url: proofUrl || null,
          status: 'pending'
        });

      if (insertError) throw insertError;

      setSubmitted(true);
      if (onClaimSubmitted) onClaimSubmitted();
    } catch (err: any) {
      console.error('Failed to submit claim:', err);
      setError(err.message || t('claimModal.errSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const displayName = preselectedPropertyName || selectedProperty?.name;

  return (
    <div className="claim-modal-overlay" onClick={onClose}>
      <div className="claim-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="claim-modal-header">
          <div className="claim-modal-header-text">
            <h2>{t('claimModal.title')}</h2>
            <p>{t('claimModal.subtitle')}</p>
          </div>
          <button className="claim-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Not Logged In State */}
        {!user ? (
          <div className="claim-modal-body" style={{ textAlign: 'center', padding: '36px 28px' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0 0 8px 0' }}>
              {t('claimModal.signInTitle')}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              {t('claimModal.signInBody')}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="claim-btn claim-btn-secondary"
                onClick={() => { onClose(); openAuthModal('register'); }}
              >
                {t('claimModal.registerHost')}
              </button>
              <button
                className="claim-btn claim-btn-primary"
                onClick={() => { onClose(); openAuthModal('login'); }}
              >
                {t('claimModal.signIn')}
              </button>
            </div>
          </div>
        ) : submitted ? (
          /* Success Screen */
          <div className="claim-success-content">
            <div className="claim-success-icon">✓</div>
            <h3>{t('claimModal.successTitle')}</h3>
            <p>{t('claimModal.successBody')}</p>
            <button
              className="claim-btn claim-btn-primary"
              style={{ marginTop: '12px', width: '100%' }}
              onClick={() => {
                onClose();
                navigate('/dashboard');
              }}
            >
              {t('claimModal.goDashboard')}
            </button>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit}>
            <div className="claim-modal-body">
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '0.88rem' }}>
                  {error}
                </div>
              )}

              {/* Property Target */}
              {displayName ? (
                <div className="claim-property-preview">
                  <div>
                    <div className="claim-property-info-title">{displayName}</div>
                    <div className="claim-property-info-sub">{t('claimModal.claimingFor')}</div>
                  </div>
                </div>
              ) : (
                <div className="claim-form-group">
                  <label>{t('claimModal.selectProperty')}</label>
                  <select
                    value={selectedPropertyId}
                    onChange={e => setSelectedPropertyId(e.target.value)}
                    required
                  >
                    <option value="">{t('claimModal.selectPlaceholder')}</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.district || 'Chiang Dao'}, {p.province || 'Chiang Mai'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="claim-form-group">
                <label>{t('claimModal.fullName')}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={t('claimModal.fullNamePlaceholder')}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="claim-form-group">
                  <label>{t('claimModal.phone')}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder={t('claimModal.phonePlaceholder')}
                    required
                  />
                </div>

                <div className="claim-form-group">
                  <label>{t('claimModal.email')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                  />
                </div>
              </div>

              <div className="claim-form-group">
                <label>{t('claimModal.proofNotes')}</label>
                <textarea
                  rows={3}
                  value={proofNotes}
                  onChange={e => setProofNotes(e.target.value)}
                  placeholder={t('claimModal.proofNotesPlaceholder')}
                />
              </div>

              <div className="claim-form-group">
                <label>{t('claimModal.proofUpload')}</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofUpload}
                    disabled={uploadingProof}
                    style={{ fontSize: '0.85rem' }}
                  />
                  {uploadingProof && <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{t('claimModal.uploading')}</span>}
                  {proofUrl && <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>✓ {t('claimModal.uploaded')}</span>}
                </div>
              </div>
            </div>

            <div className="claim-modal-footer">
              <button
                type="button"
                className="claim-btn claim-btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                {t('claimModal.cancel')}
              </button>
              <button
                type="submit"
                className="claim-btn claim-btn-primary"
                disabled={submitting || uploadingProof}
              >
                {submitting ? t('claimModal.submitting') : t('claimModal.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
