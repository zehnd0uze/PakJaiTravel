import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { user } = useAuth();
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
      setError('Failed to upload proof document. You can still describe your ownership proof in the notes.');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedPropertyId) {
      setError('Please select an accommodation to claim.');
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!phone.trim()) {
      setError('Please enter your contact phone number.');
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
      setError(err.message || 'Failed to submit ownership claim. Please try again.');
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
            <h2>🏷️ Claim Accommodation Ownership</h2>
            <p>ขอสิทธิ์ดูแลและจัดการที่พักของคุณบน PakJai</p>
          </div>
          <button className="claim-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Not Logged In State */}
        {!user ? (
          <div className="claim-modal-body" style={{ textAlign: 'center', padding: '36px 28px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0 0 8px 0' }}>
              Please Sign In to Claim this Listing
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              To ensure ownership requests are securely linked to your host profile, please sign in or create an account.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="claim-btn claim-btn-secondary" 
                onClick={() => { onClose(); navigate('/register'); }}
              >
                Register as Host
              </button>
              <button 
                className="claim-btn claim-btn-primary" 
                onClick={() => { onClose(); navigate('/login'); }}
              >
                Sign In
              </button>
            </div>
          </div>
        ) : submitted ? (
          /* Success Screen */
          <div className="claim-success-content">
            <div className="claim-success-icon">✓</div>
            <h3>Ownership Claim Submitted!</h3>
            <p>
              Your claim for <strong>{displayName || 'this accommodation'}</strong> has been sent to the PakJai admin team for verification.
            </p>
            <div className="claim-notice-box" style={{ width: '100%', boxSizing: 'border-box' }}>
              <span>ℹ️</span>
              <span>
                Once approved, the accommodation will automatically appear in your <strong>Host Dashboard</strong> where you can edit photos, pricing, and post community updates.
              </span>
            </div>
            <button
              className="claim-btn claim-btn-primary"
              style={{ marginTop: '12px', width: '100%' }}
              onClick={() => {
                onClose();
                navigate('/dashboard');
              }}
            >
              Go to Host Dashboard
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
                  <span className="claim-property-icon">🏡</span>
                  <div>
                    <div className="claim-property-info-title">{displayName}</div>
                    <div className="claim-property-info-sub">Selected Property for Ownership Verification</div>
                  </div>
                </div>
              ) : (
                <div className="claim-form-group">
                  <label>
                    Select Your Accommodation <span className="required">*</span>
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={e => setSelectedPropertyId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose from existing listings --</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.district || 'Chiang Dao'}, {p.province || 'Chiang Mai'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="claim-form-group">
                <label>
                  Full Name / Host Name (ชื่อ-นามสกุล เจ้าของที่พัก) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. นายสมศักดิ์ เลาหมี่"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="claim-form-group">
                  <label>
                    Contact Phone (เบอร์โทรศัพท์) <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    required
                  />
                </div>

                <div className="claim-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                  />
                </div>
              </div>

              <div className="claim-form-group">
                <label>
                  Ownership Proof & Notes (หลักฐานความเป็นเจ้าของ / ข้อมูลยืนยัน)
                </label>
                <textarea
                  rows={3}
                  value={proofNotes}
                  onChange={e => setProofNotes(e.target.value)}
                  placeholder="e.g. เบอร์โทรและชื่อบัญชีตรงกับที่ระบุในรายการที่พัก, Facebook Page เจ้าของ, หรือข้อมูลติดต่อยืนยัน..."
                />
              </div>

              <div className="claim-form-group">
                <label>Optional Verification Document / Photo (รูปถ่ายหรือเอกสารยืนยัน)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofUpload}
                    disabled={uploadingProof}
                    style={{ fontSize: '0.85rem' }}
                  />
                  {uploadingProof && <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Uploading...</span>}
                  {proofUrl && <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600 }}>✓ Attached</span>}
                </div>
              </div>

              <div className="claim-notice-box">
                <span>🛡️</span>
                <span>
                  Admin will review and verify your ownership request within 24 hours. After approval, you will have full control to edit rates, photos, and calendar in your Host Dashboard.
                </span>
              </div>
            </div>

            <div className="claim-modal-footer">
              <button
                type="button"
                className="claim-btn claim-btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="claim-btn claim-btn-primary"
                disabled={submitting || uploadingProof}
              >
                {submitting ? 'Submitting Request...' : 'Submit Ownership Claim'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
