import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import './Hotels.css';

interface Hotel {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
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
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Fetch from API instead of static data
  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then(data => {
        // Only show published properties on public site
        const published = data.filter((h: Hotel) => h.status !== 'draft');
        setAllHotels(published);
      })
      .catch(err => console.error('Failed to fetch properties:', err));
  }, []);

  // Extract unique provinces
  const provinces = useMemo(() => Array.from(new Set(allHotels.map(h => h.province))), [allHotels]);
  
  // Extract unique districts based on selected province
  const districts = useMemo(() => {
    if (!selectedProvince) return [];
    return Array.from(new Set(allHotels.filter(h => h.province === selectedProvince).map(h => h.district)));
  }, [selectedProvince, allHotels]);
  
  // Extract unique types based on selected district
  const types = useMemo(() => {
    if (!selectedDistrict) return [];
    return Array.from(new Set(allHotels.filter(h => h.district === selectedDistrict).map(h => h.type)));
  }, [selectedDistrict, allHotels]);

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
          <h3>Categories</h3>
          
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
            <label>District</label>
            <select 
              value={selectedDistrict} 
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedType('');
              }}
              disabled={!selectedProvince}
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
              disabled={!selectedDistrict}
            >
              <option value="">All Types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
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
