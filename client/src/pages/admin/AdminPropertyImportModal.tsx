import React, { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { verifiedChiangDaoList } from '../../data/chiangDaoData';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentProperties?: any[];
}

interface ParsedProperty {
  name: string;
  type?: string;
  price_per_night?: number;
  currency?: string;
  rating?: number;
  reviews?: number;
  image_url?: string;
  is_verified?: boolean;
  features?: string[];
  amenities?: string[];
  location?: string;
  province?: string;
  district?: string;
  description?: string;
  check_in?: string;
  check_out?: string;
  host_info?: { name?: string; since?: string };
  contact?: {
    phone?: string;
    phones?: string[];
    facebook?: string;
    bank?: string;
    accountNumber?: string;
    accountName?: string;
  };
  status?: string;
}

export const AdminPropertyImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentProperties = []
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste' | 'templates'>('file');
  const [pastedText, setPastedText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedProperty[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to parse standard CSV format
  const parseCSV = (csvText: string): ParsedProperty[] => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) throw new Error('CSV must contain at least a header row and one data row.');

    // Simple regex-based CSV splitter to handle quoted cells
    const splitCSVLine = (text: string) => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
          if (inQuotes && text[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

    const records: ParsedProperty[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = splitCSVLine(lines[i]);
      if (row.length === 0 || row.every(cell => cell === '')) continue;

      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] || '';
      });

      const name = obj.name || obj.property_name || obj.title || '';
      if (!name) continue;

      const phonesList = (obj.phones || obj.phone || '')
        .split(/[,;|]/)
        .map(p => p.trim())
        .filter(Boolean);

      const featuresList = (obj.features || '')
        .split(/[,;|]/)
        .map(f => f.trim())
        .filter(Boolean);

      const amenitiesList = (obj.amenities || 'Wi-Fi,Breakfast,Mountain View,Balcony,Hot Shower')
        .split(/[,;|]/)
        .map(a => a.trim())
        .filter(Boolean);

      records.push({
        name,
        type: obj.type || 'Homestay',
        price_per_night: parseFloat(obj.price_per_night || obj.price || '800') || 800,
        currency: obj.currency || 'THB',
        rating: parseFloat(obj.rating || '4.8') || 4.8,
        reviews: parseInt(obj.reviews || '50', 10) || 50,
        image_url: obj.image_url || obj.image || obj.imageurl || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop',
        is_verified: obj.is_verified === 'true' || obj.verified === 'true' || obj.is_verified === '1' || true,
        features: featuresList.length > 0 ? featuresList : ['Scenic View', 'Authentic Homestay'],
        amenities: amenitiesList,
        location: obj.location || [obj.district, obj.province].filter(Boolean).join(', ') || 'Thailand',
        province: obj.province || 'เชียงใหม่',
        district: obj.district || 'เชียงดาว',
        description: obj.description || `${name} โฮมสเตย์บรรยากาศธรรมชาติ`,
        check_in: obj.check_in || '14:00',
        check_out: obj.check_out || '11:00',
        host_info: {
          name: obj.host_name || obj.host || '',
          since: obj.host_since || '2020'
        },
        contact: {
          phone: phonesList[0] || obj.phone || '',
          phones: phonesList,
          facebook: obj.facebook || obj.facebook_page || '',
          bank: obj.bank || obj.bank_name || '',
          accountNumber: obj.account_number || obj.accountnumber || '',
          accountName: obj.account_name || obj.accountname || obj.host_name || ''
        },
        status: obj.status || 'published'
      });
    }

    return records;
  };

  // Helper to parse JSON array format
  const parseJSON = (jsonText: string): ParsedProperty[] => {
    const raw = JSON.parse(jsonText);
    const arr = Array.isArray(raw) ? raw : [raw];

    return arr.map(item => ({
      name: item.name || item.nameTh || item.title || 'Untitled Property',
      type: item.type || 'Homestay',
      price_per_night: item.price_per_night ?? item.pricePerNight ?? item.price ?? 800,
      currency: item.currency || 'THB',
      rating: item.rating ?? 4.8,
      reviews: item.reviews ?? 50,
      image_url: item.image_url || item.imageUrl || (Array.isArray(item.images) && item.images[0]) || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop',
      is_verified: item.is_verified ?? item.isVerified ?? true,
      features: Array.isArray(item.features) ? item.features : ['Mountain View', 'Real Owner Verified'],
      amenities: Array.isArray(item.amenities) ? item.amenities : ['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
      location: item.location || [item.district, item.province].filter(Boolean).join(', ') || 'Thailand',
      province: item.province || 'เชียงใหม่',
      district: item.district || 'เชียงดาว',
      description: item.description || `${item.name || 'Accomodation'} วิวธรรมชาติ`,
      check_in: item.check_in || item.checkIn || '14:00',
      check_out: item.check_out || item.checkOut || '11:00',
      host_info: {
        name: item.host_info?.name || item.host?.name || item.hostName || '',
        since: item.host_info?.since || item.host?.since || item.hostSince || '2020'
      },
      contact: {
        phone: item.contact?.phone || item.phone || (item.contact?.phones && item.contact.phones[0]) || '',
        phones: item.contact?.phones || item.phones || (item.phone ? [item.phone] : []),
        facebook: item.contact?.facebook || item.contact?.facebookPage || item.facebookPage || '',
        bank: item.contact?.bank || item.contact?.bankAccount?.bank || item.bank || '',
        accountNumber: item.contact?.accountNumber || item.contact?.bankAccount?.accountNumber || item.accountNumber || '',
        accountName: item.contact?.accountName || item.contact?.bankAccount?.accountName || item.accountName || item.host?.name || ''
      },
      status: item.status || 'published'
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewError(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        let data: ParsedProperty[] = [];
        if (file.name.endsWith('.json') || text.trim().startsWith('[') || text.trim().startsWith('{')) {
          data = parseJSON(text);
        } else {
          data = parseCSV(text);
        }

        if (data.length === 0) {
          throw new Error('No valid accommodation records found in file.');
        }

        setParsedData(data);
      } catch (err: any) {
        setPreviewError(`File Parse Error: ${err.message || 'Invalid format'}`);
        setParsedData([]);
      }
    };
    reader.readAsText(file);
  };

  const handleParsePasted = () => {
    setPreviewError(null);
    setSuccessMessage(null);
    if (!pastedText.trim()) {
      setPreviewError('Please paste your CSV or JSON data.');
      return;
    }

    try {
      let data: ParsedProperty[] = [];
      const trimmed = pastedText.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        data = parseJSON(trimmed);
      } else {
        data = parseCSV(trimmed);
      }

      if (data.length === 0) {
        throw new Error('No valid accommodation records found.');
      }

      setParsedData(data);
    } catch (err: any) {
      setPreviewError(`Parse Error: ${err.message || 'Check your format'}`);
      setParsedData([]);
    }
  };

  const handleLoadSampleChiangDao = () => {
    setPreviewError(null);
    setSuccessMessage(null);
    const sample = verifiedChiangDaoList.map(item => ({
      name: item.name,
      type: item.type,
      price_per_night: item.pricePerNight,
      currency: item.currency,
      rating: item.rating,
      reviews: item.reviews,
      image_url: item.imageUrl,
      is_verified: item.isVerified,
      features: item.features,
      amenities: item.amenities,
      location: item.location,
      province: item.province,
      district: item.district,
      description: item.description,
      check_in: item.checkIn,
      check_out: item.checkOut,
      host_info: {
        name: item.hostName,
        since: item.hostSince
      },
      contact: {
        phone: item.phone,
        phones: item.phones,
        facebook: item.facebookPage,
        bank: item.bankAccount?.bank,
        accountNumber: item.bankAccount?.accountNumber,
        accountName: item.bankAccount?.accountName
      },
      status: item.status
    }));

    setParsedData(sample);
  };

  const handleDownloadCSVTemplate = () => {
    const csvContent = `name,type,price_per_night,currency,rating,reviews,province,district,location,host_name,host_since,phone,phones,facebook,bank,account_number,account_name,is_verified,features,amenities,description,image_url,status
"บ้านระเบียงดาว (Baan Rabiang Dao)","Homestay",800,"THB",4.9,320,"เชียงใหม่","เชียงดาว","Chiang Dao, Chiang Mai","นางสาว อรัญญา แซ่ล้อ","2019","086-189-9275","086-189-9275; 061-056-6617","บ้านระเบียงดาว","ไทยพาณิชย์ (SCB)","093-2-25134-4","นางสาว อรัญญา แซ่ล้อ",true,"Doi Luang View; Breakfast Included","Wi-Fi,Breakfast,Mountain View,Balcony,Hot Shower","โฮมสเตย์ยอดนิยมวิวหน้าดอยหลวงเชียงดาว","https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop","published"
"บ้านตัวอย่างโฮมสเตย์","Homestay",750,"THB",4.8,100,"น่าน","ปัว","Pua, Nan","นายสมชาย ใจดี","2021","081-234-5678","081-234-5678","บ้านตัวอย่างโฮมสเตย์","กสิกรไทย","123-4-56789-0","นายสมชาย ใจดี",true,"วิวทุ่งนา; อาหารเหนือ","Wi-Fi,Breakfast,Parking","โฮมสเตย์วิวทุ่งนาเขียวขจี","https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop","published"`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pakjai_properties_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSONTemplate = () => {
    const jsonContent = JSON.stringify([
      {
        name: "บ้านระเบียงดาว (Baan Rabiang Dao)",
        type: "Homestay",
        price_per_night: 800,
        currency: "THB",
        rating: 4.9,
        reviews: 320,
        province: "เชียงใหม่",
        district: "เชียงดาว",
        location: "Chiang Dao, Chiang Mai",
        image_url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop",
        is_verified: true,
        features: ["Doi Luang View", "Breakfast Included", "Private Balcony"],
        amenities: ["Wi-Fi", "Breakfast", "Mountain View", "Balcony", "Hot Shower"],
        description: "โฮมสเตย์ยอดนิยมวิวหน้าดอยหลวงเชียงดาว",
        check_in: "14:00",
        check_out: "11:00",
        host_info: {
          name: "นางสาว อรัญญา แซ่ล้อ",
          since: "2019"
        },
        contact: {
          phone: "086-189-9275",
          phones: ["086-189-9275", "061-056-6617"],
          facebook: "บ้านระเบียงดาว",
          bank: "ไทยพาณิชย์ (SCB)",
          accountNumber: "093-2-25134-4",
          accountName: "นางสาว อรัญญา แซ่ล้อ"
        },
        status: "published"
      }
    ], null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pakjai_properties_template.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCurrentToCSV = () => {
    if (!currentProperties || currentProperties.length === 0) {
      alert('No properties available to export.');
      return;
    }

    const headers = ['name', 'type', 'price_per_night', 'currency', 'rating', 'reviews', 'province', 'district', 'location', 'host_name', 'phone', 'bank', 'account_number', 'account_name', 'is_verified', 'status', 'image_url'];
    
    const rows = currentProperties.map(p => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.type || '').replace(/"/g, '""')}"`,
      p.price_per_night ?? p.pricePerNight ?? 0,
      `"${p.currency || 'THB'}"`,
      p.rating || 4.5,
      p.reviews || 0,
      `"${(p.province || '').replace(/"/g, '""')}"`,
      `"${(p.district || '').replace(/"/g, '""')}"`,
      `"${(p.location || '').replace(/"/g, '""')}"`,
      `"${(p.host_info?.name || '').replace(/"/g, '""')}"`,
      `"${(p.contact?.phone || '').replace(/"/g, '""')}"`,
      `"${(p.contact?.bank || '').replace(/"/g, '""')}"`,
      `"${(p.contact?.accountNumber || '').replace(/"/g, '""')}"`,
      `"${(p.contact?.accountName || '').replace(/"/g, '""')}"`,
      p.is_verified ?? p.isVerified ?? true,
      `"${p.status || 'published'}"`,
      `"${(p.image_url || p.imageUrl || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pakjai_properties_backup_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setPreviewError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      let ownerId = user?.id;

      if (!ownerId) {
        const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
        ownerId = profile?.id;
      }

      if (!ownerId) {
        ownerId = '00000000-0000-0000-0000-000000000000';
      }

      const rowsToInsert = parsedData.map(item => ({
        name: item.name,
        type: item.type || 'Homestay',
        price_per_night: item.price_per_night || 800,
        currency: item.currency || 'THB',
        rating: item.rating || 4.8,
        reviews: item.reviews || 0,
        image_url: item.image_url,
        is_verified: item.is_verified ?? true,
        features: item.features || [],
        amenities: item.amenities || [],
        location: item.location || '',
        province: item.province || '',
        district: item.district || '',
        description: item.description || '',
        check_in: item.check_in || '14:00',
        check_out: item.check_out || '11:00',
        host_info: item.host_info || {},
        contact: item.contact || {},
        owner_id: ownerId,
        status: item.status || 'published'
      }));

      // Insert in chunks of 50 to avoid payload limit
      const chunkSize = 50;
      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('properties').insert(chunk);
        if (error) throw error;
      }

      setSuccessMessage(`🎉 Successfully imported ${rowsToInsert.length} properties to database!`);
      setParsedData([]);
      setPastedText('');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Batch import failed:', err);
      setPreviewError(`Database Insert Failed: ${err.message || 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="import-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 25, 35, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="import-modal-content" style={{
        background: '#fff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #EAECEE',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FAFBFC'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1C2833' }}>
              📥 Batch Import & Export Accommodations
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#666' }}>
              Import any list of homestays or resorts from CSV/JSON into Supabase anytime
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#888',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          background: '#fff',
          borderBottom: '1px solid #EAECEE'
        }}>
          <button
            onClick={() => setActiveTab('file')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: activeTab === 'file' ? '#0F1923' : '#F1F3F5',
              color: activeTab === 'file' ? '#fff' : '#555'
            }}
          >
            📁 Upload CSV / JSON
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: activeTab === 'paste' ? '#0F1923' : '#F1F3F5',
              color: activeTab === 'paste' ? '#fff' : '#555'
            }}
          >
            📋 Paste CSV / JSON Text
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: activeTab === 'templates' ? '#0F1923' : '#F1F3F5',
              color: activeTab === 'templates' ? '#fff' : '#555'
            }}
          >
            📑 Templates & Export
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {successMessage && (
            <div style={{
              padding: '12px 16px',
              background: '#dcfce7',
              color: '#15803d',
              borderRadius: '8px',
              marginBottom: '16px',
              fontWeight: 600
            }}>
              {successMessage}
            </div>
          )}

          {previewError && (
            <div style={{
              padding: '12px 16px',
              background: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.9rem'
            }}>
              {previewError}
            </div>
          )}

          {activeTab === 'file' && (
            <div>
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #05B0A6',
                borderRadius: '12px',
                padding: '36px 20px',
                cursor: 'pointer',
                background: '#F0FDFA',
                textAlign: 'center',
                transition: 'background 0.2s ease'
              }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📂</span>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0F1923' }}>
                  Click to select CSV or JSON file
                </span>
                <span style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                  Supports .csv, .json with homestay details, host contact & bank account info
                </span>
                <input
                  type="file"
                  accept=".csv, .json, text/csv, application/json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {activeTab === 'paste' && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#666' }}>
                Paste CSV formatted text (with headers) or a JSON array of accommodation objects:
              </p>
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder='name,type,price_per_night,phone,bank,account_number... OR [{"name": "My Homestay", "price_per_night": 800}]'
                rows={8}
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleParsePasted}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#05B0A6',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🔍 Parse & Preview
                </button>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
                background: '#FAFBFC'
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>📄 Standard CSV Template</h4>
                <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#666' }}>
                  Download a pre-formatted Excel / Google Sheets compatible CSV template with all columns.
                </p>
                <button
                  onClick={handleDownloadCSVTemplate}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#fff',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  ⬇️ Download CSV Template
                </button>
              </div>

              <div style={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
                background: '#FAFBFC'
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>📦 Standard JSON Template</h4>
                <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#666' }}>
                  Download structured JSON template with complete schema for developers or API feeds.
                </p>
                <button
                  onClick={handleDownloadJSONTemplate}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#fff',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  ⬇️ Download JSON Template
                </button>
              </div>

              <div style={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
                background: '#FAFBFC'
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>💾 Backup / Export Properties</h4>
                <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#666' }}>
                  Export all currently active listings in your database to CSV for backup or bulk editing.
                </p>
                <button
                  onClick={handleExportCurrentToCSV}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#0F1923',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  📤 Export Database ({currentProperties.length}) to CSV
                </button>
              </div>

              <div style={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
                background: '#FAFBFC'
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>🏔️ Chiang Dao Verified List</h4>
                <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#666' }}>
                  Load 34 verified homestay directory records into the preview.
                </p>
                <button
                  onClick={handleLoadSampleChiangDao}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#05B0A6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  ✨ Load Chiang Dao Directory (34)
                </button>
              </div>
            </div>
          )}

          {/* Data Preview Section */}
          {parsedData.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1C2833' }}>
                  🔍 Preview Parsed Data ({parsedData.length} records ready)
                </h3>
                <button
                  onClick={() => setParsedData([])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#e11d48',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  Clear Preview
                </button>
              </div>

              <div style={{
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid #E2E8F0',
                borderRadius: '8px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>#</th>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Name</th>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Price</th>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Host Name</th>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Phone</th>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Bank & Account</th>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0' }}>Province / District</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#fff' : '#FAFCFF' }}>
                        <td style={{ padding: '8px 12px', color: '#888' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1E293B' }}>{item.name}</td>
                        <td style={{ padding: '8px 12px', color: '#05B0A6', fontWeight: 700 }}>฿{item.price_per_night?.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px' }}>{item.host_info?.name || '-'}</td>
                        <td style={{ padding: '8px 12px' }}>{item.contact?.phone || '-'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          {item.contact?.bank ? `${item.contact.bank} ${item.contact.accountNumber || ''}` : '-'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>{[item.district, item.province].filter(Boolean).join(', ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #EAECEE',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FAFBFC'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#666' }}>
            {parsedData.length > 0 ? `${parsedData.length} records ready to import` : 'No file loaded yet'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              disabled={importing}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={importing || parsedData.length === 0}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: parsedData.length > 0 ? '#05B0A6' : '#94A3B8',
                color: '#fff',
                cursor: parsedData.length > 0 && !importing ? 'pointer' : 'not-allowed',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {importing ? '⏳ Importing...' : `🚀 Import ${parsedData.length > 0 ? `(${parsedData.length})` : ''} to Database`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
