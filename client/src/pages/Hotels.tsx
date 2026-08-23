import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Card } from '../components/Card';
import './Hotels.css';

interface Hotel {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  price_type?: 'per_night' | 'per_person';
  priceType?: 'per_night' | 'per_person';
  currency: string;
  imageUrl: string;
  isVerified: boolean;
  location: string;
  province: string;
  district: string;
  status?: string;
}

export const Hotels: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Fetch from API instead of static data
  useEffect(() => {
    const fetchHotels = async () => {
      let query = supabase.from('properties').select('*').eq('status', 'published');
      
      if (q) {
        query = query.or(`name.ilike.%${q}%,location.ilike.%${q}%,province.ilike.%${q}%,district.ilike.%${q}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Failed to fetch properties:', error);
      } else {
        const formatted = (data || []).map(p => ({
          ...p,
          pricePerNight: p.price_per_night,
          imageUrl: p.image_url,
          isVerified: p.is_verified
        }));
        setAllHotels(formatted);
      }
    };
    
    fetchHotels();
  }, [q]);

  // Extract unique provinces
  const provinces = useMemo(() => Array.from(new Set(allHotels.map(h => h.province).filter(Boolean))), [allHotels]);
  
  // Extract unique districts based on selected province or all
  const districts = useMemo(() => {
    const pool = selectedProvince ? allHotels.filter(h => h.province === selectedProvince) : allHotels;
    return Array.from(new Set(pool.map(h => h.district).filter(Boolean)));
  }, [selectedProvince, allHotels]);
  
  // Extract unique types based on selected district or all
  const types = useMemo(() => {
    let pool = allHotels;
    if (selectedProvince) pool = pool.filter(h => h.province === selectedProvince);
    if (selectedDistrict) pool = pool.filter(h => h.district === selectedDistrict);
    return Array.from(new Set(pool.map(h => h.type).filter(Boolean)));
  }, [selectedProvince, selectedDistrict, allHotels]);

  // Filter hotels
  const filteredHotels = useMemo(() => {
    return allHotels.filter(hotel => {
      const matchProv = selectedProvince ? hotel.province === selectedProvince : true;
      const matchDist = selectedDistrict ? hotel.district === selectedDistrict : true;
      const matchType = selectedType ? hotel.type === selectedType : true;
      return matchProv && matchDist && matchType;
    });
  }, [selectedProvince, selectedDistrict, selectedType, allHotels]);

  return (
    <div className="hotels-page container section-padding animate-fade-in">
      <div className="hotels-header">
        <h1 className="section-title">Discover Accommodations</h1>
        <p className="section-subtitle">Find the perfect verified stay tailored to your destination.</p>
      </div>

      <div className="hotels-layout">
        {/* Sidebar Filters */}
        <aside className="hotels-sidebar">
          <h3>Filter Stays</h3>
          
          <div className="filter-group">
            <label>Province</label>
            <select 
              value={selectedProvince} 
              onChange={(e) => {
                setSelectedProvince(e.target.value);
                setSelectedDistrict('');
                setSelectedType('');
              }}
            >
              <option value="">All Provinces</option>
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>District / Area</label>
            <select 
              value={selectedDistrict} 
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
              }}
            >
              <option value="">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Property Type</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {(selectedProvince || selectedDistrict || selectedType) && (
            <button 
              className="btn btn-outline" 
              style={{ width: '100%', marginTop: '12px', fontSize: '0.85rem' }}
              onClick={() => {
                setSelectedProvince('');
                setSelectedDistrict('');
                setSelectedType('');
              }}
            >
              Reset Filters
            </button>
          )}

          {/* Host Promo Box */}
          <div className="host-sidebar-cta" style={{
            marginTop: '30px',
            padding: '20px',
            background: '#f4f8f6',
            borderRadius: '16px',
            border: '1px solid #d1ded7',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>🏡</span>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#2c4c3b' }}>Own an Accommodation?</h4>
            <p style={{ fontSize: '0.8rem', color: '#555', margin: '0 0 14px 0', lineHeight: 1.4 }}>
              List your homestay, resort, or villa to connect directly with travelers across Thailand.
            </p>
            <button 
              onClick={() => navigate('/become-host')}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.85rem', padding: '10px 14px' }}
            >
              List Your Place ↗
            </button>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="hotels-results">
          <div className="results-info">
            <h2>{selectedDistrict && selectedType ? `${selectedType}s in ${selectedDistrict}` : 'All Stays'}</h2>
            <span>{filteredHotels.length} properties verified</span>
          </div>

          {filteredHotels.length > 0 ? (
            <div className="destinations-grid">
              {filteredHotels.map(hotel => (
                <Card 
                  key={hotel.id}
                  title={hotel.name}
                  subtitle={hotel.type}
                  image={hotel.imageUrl}
                  price={`${hotel.pricePerNight} ${hotel.currency}`}
                  priceType={hotel.price_type || hotel.priceType as any}
                  rating={hotel.rating}
                  isVerified={hotel.isVerified}
                  onClick={() => navigate(`/hotels/${hotel.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No verified accommodations found matching your filters. Try checking a different district or type.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
