import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageCompression';

interface PropertyForm {
  name: string;
  type: string;
  pricePerNight: number;
  priceType: 'per_night' | 'per_person';
  currency: string;
  rating: number;
  reviews: number;
  imageUrl: string;
  images: string[];
  isVerified: boolean;
  features: string[];
  amenities: string[];
  location: string;
  province: string;
  district: string;
  description: string;
  checkIn: string;
  checkOut: string;
  hostName: string;
  hostSince: string;
  phone: string;
  phones: string;
  facebook: string;
  bank: string;
  accountNumber: string;
  accountName: string;
  email: string;
  line: string;
  status: string;
}

const emptyForm: PropertyForm = {
  name: '', type: 'Homestay', pricePerNight: 0, priceType: 'per_night', currency: 'THB',
  rating: 0, reviews: 0, imageUrl: '', images: [],
  isVerified: true, features: [], amenities: [],
  location: '', province: 'เชียงใหม่', district: 'เชียงดาว',
  description: '', checkIn: '14:00', checkOut: '11:00',
  hostName: '', hostSince: '', phone: '', phones: '', facebook: '',
  bank: '', accountNumber: '', accountName: '',
  email: '', line: '',
  status: 'published',
};

export const AdminHotelEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      const fetchProperty = async () => {
        try {
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          if (data) {
            setForm({
              name: data.name || '',
              type: data.type || 'Homestay',
              pricePerNight: data.price_per_night || 0,
              priceType: data.price_type || 'per_night',
              currency: data.currency || 'THB',
              rating: data.rating || 0,
              reviews: data.reviews || 0,
              imageUrl: data.image_url || '',
              images: data.images || [],
              isVerified: data.is_verified ?? true,
              features: data.features || [],
              amenities: data.amenities || [],
              location: data.location || '',
              province: data.province || '',
              district: data.district || '',
              description: data.description || '',
              checkIn: data.check_in || '14:00',
              checkOut: data.check_out || '11:00',
              hostName: data.host_info?.name || '',
              hostSince: data.host_info?.since || '',
              phone: data.contact?.phone || '',
              phones: Array.isArray(data.contact?.phones) ? data.contact.phones.join(', ') : '',
              facebook: data.contact?.facebook || '',
              bank: data.contact?.bank || '',
              accountNumber: data.contact?.accountNumber || '',
              accountName: data.contact?.accountName || '',
              email: data.contact?.email || '',
              line: data.contact?.line || '',
              status: data.status || 'published',
            });
          }
        } catch (err: any) {
          console.error("Fetch property error:", err);
          setAlert({ type: 'error', message: err.message || 'Failed to load property.' });
        }
      };
      fetchProperty();
    }
  }, [id, isNew]);

  const handleChange = (field: keyof PropertyForm, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'features' | 'amenities' | 'images', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value.split(',').map(s => s.trim()).filter(Boolean),
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'images') => {
    if (!e.target.files?.length) return;
    
    setUploading(true);
    setAlert({ type: 'info', message: 'Compressing and uploading image(s)...' });
    
    try {
      const originalFiles = Array.from(e.target.files);
      const files: File[] = [];
      
      for (const orig of originalFiles) {
        files.push(await compressImage(orig));
      }

      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit for Cloudinary
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          setAlert({ type: 'error', message: `File "${file.name}" is still too large after compression. Maximum size is 10MB.` });
          setUploading(false);
          return;
        }
      }

      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadToCloudinary(files[i]);
        urls.push(url);
      }
      
      if (urls.length > 0) {
        if (field === 'imageUrl') {
          handleChange('imageUrl', urls[0]);
        } else {
          setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
        }
        setAlert({ type: 'success', message: 'Image(s) uploaded successfully!' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!form.name || !form.pricePerNight) {
      setAlert({ type: 'error', message: 'Name and price are required.' });
      return;
    }

    setSaving(true);
    const dbData: any = {
      name: form.name,
      type: form.type,
      price_per_night: Number(form.pricePerNight),
      price_type: form.priceType,
      currency: form.currency,
      rating: Number(form.rating),
      reviews: Number(form.reviews),
      image_url: form.imageUrl || form.images[0] || '',
      images: form.images,
      is_verified: form.isVerified,
      features: form.features,
      amenities: form.amenities,
      location: form.location || `${form.district}, ${form.province}`,
      province: form.province,
      district: form.district,
      description: form.description,
      check_in: form.checkIn,
      check_out: form.checkOut,
      host_info: { name: form.hostName, since: form.hostSince },
      contact: {
        phone: form.phone,
        phones: form.phones ? form.phones.split(',').map(s => s.trim()).filter(Boolean) : [form.phone].filter(Boolean),
        facebook: form.facebook,
        bank: form.bank,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
        email: form.email,
        line: form.line,
      },
      status: form.status,
    };

    if (isNew) {
      if (user?.id) {
        dbData.owner_id = user.id;
      } else {
        const { data: { user: sessionUser } } = await supabase.auth.getUser();
        if (sessionUser?.id) {
          dbData.owner_id = sessionUser.id;
        }
      }
    }

    try {
      if (isNew) {
        const { error } = await supabase
          .from('properties')
          .insert(dbData);
        if (error) throw error;
        setAlert({ type: 'success', message: 'Property created!' });
      } else {
        const { error } = await supabase
          .from('properties')
          .update(dbData)
          .eq('id', id);
        if (error) throw error;
        setAlert({ type: 'success', message: 'Property updated!' });
      }
      setTimeout(() => navigate('/admin/hotels'), 1000);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Failed to save property.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-topbar">
        <h1>{isNew ? 'Add New Property' : `Edit: ${form.name}`}</h1>
        <div className="admin-topbar-actions">
          {!isNew && (
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => window.open(`/hotels/${id}`, '_blank')}
            >
              Preview Live
            </button>
          )}
        </div>
      </div>

      <div className="admin-content">
        {alert && (
          <div className={`admin-alert ${alert.type}`} style={alert.type === 'info' ? { background: '#e0f2fe', color: '#0369a1', borderLeft: '4px solid #0284c7' } : {}}>
            {alert.message}
          </div>
        )}

        <div className="admin-form-container">
          {/* Basic Info */}
          <div className="admin-form-section">
            <h3>Basic Information</h3>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Property Name</label>
                <input
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="e.g. Baan Rabiang Dao Homestay"
                />
              </div>
              <div className="admin-form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => handleChange('type', e.target.value)}>
                  <option value="Homestay">Homestay</option>
                  <option value="Resort">Resort</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Villa">Villa</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Price Per Night (THB)</label>
                <input
                  type="number"
                  value={form.pricePerNight}
                  onChange={e => handleChange('pricePerNight', Number(e.target.value))}
                  placeholder="800"
                />
              </div>
              <div className="admin-form-group">
                <label>Price Type</label>
                <select value={form.priceType} onChange={e => handleChange('priceType', e.target.value)}>
                  <option value="per_night">Per Night</option>
                  <option value="per_person">Per Person</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => handleChange('status', e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="admin-form-section">
            <h3>Location</h3>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Province</label>
                <input
                  value={form.province}
                  onChange={e => handleChange('province', e.target.value)}
                  placeholder="Chiang Mai"
                />
              </div>
              <div className="admin-form-group">
                <label>District</label>
                <input
                  value={form.district}
                  onChange={e => handleChange('district', e.target.value)}
                  placeholder="Chiang Dao"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="admin-form-section">
            <h3>Description</h3>
            <div className="admin-form-grid single">
              <div className="admin-form-group">
                <label>Property Description</label>
                <textarea
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Describe the property, its surroundings, and what makes it special..."
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="admin-form-section">
            <h3>Images</h3>
            <div className="admin-form-grid single">
              <div className="admin-form-group">
                <label>Cover Image</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={form.imageUrl}
                    onChange={e => handleChange('imageUrl', e.target.value)}
                    placeholder="https://..."
                    style={{ flex: 1 }}
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {uploading ? '⏳ Uploading...' : '📁 Upload'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'imageUrl')} disabled={uploading} />
                  </label>
                </div>
              </div>
              <div className="admin-form-group">
                <label>Gallery Images (comma-separated URLs)</label>
                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <textarea
                    value={form.images.join(', ')}
                    onChange={e => handleArrayChange('images', e.target.value)}
                    placeholder="https://img1.jpg, https://img2.jpg, ..."
                  />
                  <label className="admin-btn admin-btn-secondary" style={{ width: 'fit-content', cursor: 'pointer' }}>
                    {uploading ? '⏳ Uploading...' : '📁 Upload More Images'}
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'images')} disabled={uploading} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Features & Amenities */}
          <div className="admin-form-section">
            <h3>Features & Amenities</h3>
            <div className="admin-form-grid single">
              <div className="admin-form-group">
                <label>Key Features (comma-separated)</label>
                <input
                  value={form.features.join(', ')}
                  onChange={e => handleArrayChange('features', e.target.value)}
                  placeholder="Doi Luang View, Breakfast Included, ..."
                />
              </div>
              <div className="admin-form-group">
                <label>Amenities (comma-separated)</label>
                <input
                  value={form.amenities.join(', ')}
                  onChange={e => handleArrayChange('amenities', e.target.value)}
                  placeholder="Wi-Fi, Parking, Hot Shower, ..."
                />
              </div>
            </div>
          </div>

          {/* Check-in/out */}
          <div className="admin-form-section">
            <h3>House Rules</h3>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Check-in Time</label>
                <input value={form.checkIn} onChange={e => handleChange('checkIn', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label>Check-out Time</label>
                <input value={form.checkOut} onChange={e => handleChange('checkOut', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Host & Contact */}
          <div className="admin-form-section">
            <h3>Host, Contact & Verified Bank Information</h3>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Host Name (ชื่อเจ้าของ/ผู้ดูแล)</label>
                <input
                  value={form.hostName}
                  onChange={e => handleChange('hostName', e.target.value)}
                  placeholder="เช่น น.ส. อรัญญา แซ่ล้อ"
                />
              </div>
              <div className="admin-form-group">
                <label>Host Since (Year)</label>
                <input
                  value={form.hostSince}
                  onChange={e => handleChange('hostSince', e.target.value)}
                  placeholder="2019"
                />
              </div>
              <div className="admin-form-group">
                <label>Primary Phone (เบอร์โทรหลัก)</label>
                <input
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="086-189-9275"
                />
              </div>
              <div className="admin-form-group">
                <label>All Phone Numbers (เบอร์โทรทั้งหมด คั่นด้วย comma)</label>
                <input
                  value={form.phones}
                  onChange={e => handleChange('phones', e.target.value)}
                  placeholder="086-189-9275, 061-056-6617, 093-225-1344"
                />
              </div>
              <div className="admin-form-group">
                <label>Facebook Page (ชื่อเพจ Facebook)</label>
                <input
                  value={form.facebook}
                  onChange={e => handleChange('facebook', e.target.value)}
                  placeholder="เช่น บ้านระเบียงดาว"
                />
              </div>
              <div className="admin-form-group">
                <label>Bank Name (ธนาคารรับโอน)</label>
                <input
                  value={form.bank}
                  onChange={e => handleChange('bank', e.target.value)}
                  placeholder="เช่น ไทยพาณิชย์ (SCB), กรุงไทย (KTB)"
                />
              </div>
              <div className="admin-form-group">
                <label>Bank Account Number (เลขที่บัญชี)</label>
                <input
                  value={form.accountNumber}
                  onChange={e => handleChange('accountNumber', e.target.value)}
                  placeholder="เช่น 093-2-25134-4"
                />
              </div>
              <div className="admin-form-group">
                <label>Account Owner Name (ชื่อเจ้าของบัญชี)</label>
                <input
                  value={form.accountName}
                  onChange={e => handleChange('accountName', e.target.value)}
                  placeholder="เช่น นางสาว อรัญญา แซ่ล้อ"
                />
              </div>
              <div className="admin-form-group">
                <label>Email</label>
                <input
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>
              <div className="admin-form-group">
                <label>LINE ID (optional)</label>
                <input
                  value={form.line}
                  onChange={e => handleChange('line', e.target.value)}
                  placeholder="@lineid"
                />
              </div>
              <div className="admin-form-group">
                <label>Verified</label>
                <select
                  value={form.isVerified ? 'true' : 'false'}
                  onChange={e => handleChange('isVerified', e.target.value === 'true')}
                >
                  <option value="true">Verified (ยืนยันแล้ว)</option>
                  <option value="false">Not Verified</option>
                </select>
              </div>
            </div>
          </div>


          {/* Actions */}
          <div className="admin-form-actions">
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Saving...' : isNew ? 'Create Property' : 'Save Changes'}
            </button>
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => navigate('/admin/hotels')}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
