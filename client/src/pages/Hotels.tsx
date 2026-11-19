import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import { VerifiedBadge } from '../components/VerifiedBadge';
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
  images?: string[];
  features?: string[];
  amenities?: string[];
  description?: string;
  isVerified: boolean;
  location: string;
  province: string;
  district: string;
  status?: string;
}

export const Hotels: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const typeParam = searchParams.get('type') || '';

  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState(qParam);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(typeParam ? typeParam.toLowerCase() : 'all');
  const [priceRange, setPriceRange] = useState<'all' | 'under2000' | '2000to4500' | 'luxury'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating'>('recommended');

  useEffect(() => {
    setLocalSearch(qParam);
  }, [qParam]);

  useEffect(() => {
    if (typeParam) {
      setSelectedCategory(typeParam.toLowerCase());
    }
  }, [typeParam]);

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to fetch properties:', error);
        } else {
          const formatted: Hotel[] = (data || []).map(p => ({
            ...p,
            pricePerNight: Number(p.price_per_night || p.price || 0),
            imageUrl: p.image_url || (Array.isArray(p.images) && p.images[0]) || '/doiluangbg.jpg',
            images: p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
            features: p.features || [],
            amenities: p.amenities || [],
            isVerified: Boolean(p.is_verified),
            province: p.province || 'Chiang Mai',
            district: p.district || 'Chiang Dao',
            location: p.location || `${p.district || 'Chiang Dao'}, ${p.province || 'Chiang Mai'}`,
          }));
          setAllHotels(formatted);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  const districts = useMemo(() => {
    return Array.from(new Set(allHotels.map(h => h.district).filter(Boolean)));
  }, [allHotels]);

  const categories = [
    { id: 'all', label: t('hotels.categories.all') },
    { id: 'homestay', label: t('hotels.categories.homestay') },
    { id: 'resort', label: t('hotels.categories.resort') },
    { id: 'nature', label: t('hotels.categories.nature') },
    { id: 'verified', label: t('hotels.categories.verified') },
  ];

  const filteredHotels = useMemo(() => {
    let list = [...allHotels];

    // Search query filter
    const activeQ = localSearch.trim().toLowerCase();
    if (activeQ) {
      list = list.filter(h =>
        h.name?.toLowerCase().includes(activeQ) ||
        h.location?.toLowerCase().includes(activeQ) ||
        h.district?.toLowerCase().includes(activeQ) ||
        h.province?.toLowerCase().includes(activeQ) ||
        h.type?.toLowerCase().includes(activeQ) ||
        (h.features || []).some(f => f.toLowerCase().includes(activeQ))
      );
    }

    // District filter
    if (selectedDistrict) {
      list = list.filter(h => h.district === selectedDistrict);
    }

    // Category pill filter
    if (selectedCategory === 'verified') {
      list = list.filter(h => h.isVerified);
    } else if (selectedCategory === 'homestay') {
      list = list.filter(h => ['homestay', 'guesthouse'].some(k => (h.type || '').toLowerCase().includes(k)));
    } else if (selectedCategory === 'resort') {
      list = list.filter(h => ['resort', 'villa', 'hotel', 'boutique'].some(k => (h.type || '').toLowerCase().includes(k)));
    } else if (selectedCategory === 'nature' || selectedCategory === 'glamping') {
      list = list.filter(h => ['cabin', 'glamping', 'eco', 'nature', 'homestay'].some(k => (h.type || '').toLowerCase().includes(k)));
    } else if (selectedCategory !== 'all') {
      list = list.filter(h => (h.type || '').toLowerCase().includes(selectedCategory));
    }

    // Price range filter
    if (priceRange === 'under2000') {
      list = list.filter(h => h.pricePerNight <= 2000);
    } else if (priceRange === '2000to4500') {
      list = list.filter(h => h.pricePerNight > 2000 && h.pricePerNight <= 4500);
    } else if (priceRange === 'luxury') {
      list = list.filter(h => h.pricePerNight > 4500);
    }

    // Sort
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return list;
  }, [allHotels, localSearch, selectedDistrict, selectedCategory, priceRange, sortBy]);

  const hasActiveFilters = Boolean(
    localSearch.trim() || selectedDistrict || selectedCategory !== 'all' || priceRange !== 'all'
  );

  const handleResetFilters = () => {
    setLocalSearch('');
    setSelectedDistrict('');
    setSelectedCategory('all');
    setPriceRange('all');
    setSortBy('recommended');
    if (qParam || typeParam) {
      setSearchParams({});
    }
  };

  return (
    <div className="hotels-page animate-fade-in">
      <div className="hotels-wide-shell">
        {/* ── Editorial Directory Header ── */}
        <header className="hotels-hero-header">
          <div className="hhh-left">
            <h1 className="hhh-title">
              {qParam ? t('hotels.titleSearch', { query: qParam }) : t('hotels.title')}
            </h1>
            <p className="hhh-subtitle">
              {t('hotels.subtitle')}
            </p>
          </div>

          <button
            type="button"
            className="hhh-host-pill"
            onClick={() => navigate('/become-host')}
          >
            <span>{t('hotels.ownPlace')}</span>
            <strong>{t('hotels.listYourPlace')}</strong>
          </button>
        </header>

        {/* ── Borderless Unified Filter & Search Toolbar ── */}
        <section className="hotels-toolbar" aria-label={t('hotels.title')}>
          {/* Category Pills */}
          <div className="hotels-category-pills" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                className={`h-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right Filter Controls */}
          <div className="hotels-filter-controls">
            <div className="h-search-inline">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={t('hotels.searchPlaceholder')}
              />
              {localSearch && (
                <button
                  type="button"
                  className="h-clear-input"
                  onClick={() => {
                    setLocalSearch('');
                    if (qParam) setSearchParams({});
                  }}
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            {districts.length > 0 && (
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="h-tonal-select"
                aria-label={t('hotels.allAreas')}
              >
                <option value="">{t('hotels.allAreas')}</option>
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as any)}
              className="h-tonal-select"
              aria-label={t('hotels.priceAll')}
            >
              <option value="all">{t('hotels.priceAll')}</option>
              <option value="under2000">{t('hotels.priceUnder2000')}</option>
              <option value="2000to4500">{t('hotels.price2000to4500')}</option>
              <option value="luxury">{t('hotels.priceLuxury')}</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-tonal-select"
              aria-label={t('hotels.sortRecommended')}
            >
              <option value="recommended">{t('hotels.sortRecommended')}</option>
              <option value="price_asc">{t('hotels.sortPriceAsc')}</option>
              <option value="price_desc">{t('hotels.sortPriceDesc')}</option>
              <option value="rating">{t('hotels.sortRating')}</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                className="h-reset-btn"
                onClick={handleResetFilters}
              >
                {t('hotels.reset')}
              </button>
            )}
          </div>
        </section>

        {/* ── Results Summary Row ── */}
        <div className="hotels-results-meta">
          <span>
            {t('hotels.showing', { count: filteredHotels.length })}
            {selectedDistrict ? ` ${t('hotels.inArea', { area: selectedDistrict })}` : ''}
          </span>
        </div>

        {/* ── Stays Grid ── */}
        {loading ? (
          <div className="hotels-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="hotel-skeleton-card">
                <div className="hsc-sk-img" />
                <div className="hsc-sk-line w70" />
                <div className="hsc-sk-line w45" />
              </div>
            ))}
          </div>
        ) : filteredHotels.length > 0 ? (
          <div className="hotels-grid">
            {filteredHotels.map((hotel) => {
              const isPerPerson = hotel.price_type === 'per_person' || hotel.priceType === 'per_person';
              return (
                <article
                  key={hotel.id}
                  className="directory-stay-card"
                  onClick={() => navigate(`/hotels/${hotel.id}`)}
                >
                  <div className="dsc-media">
                    <img src={hotel.imageUrl} alt={hotel.name} loading="lazy" />
                    <span className="dsc-type-pill">{hotel.type || 'Stay'}</span>
                    {hotel.isVerified && (
                      <div className="dsc-verified-wrap">
                        <VerifiedBadge />
                      </div>
                    )}
                  </div>

                  <div className="dsc-body">
                    <div className="dsc-top-row">
                      <span className="dsc-location">{hotel.location}</span>
                      {Number(hotel.rating || 0) > 0 && (
                        <span className="dsc-rating">
                          <span className="dsc-star">★</span> {Number(hotel.rating).toFixed(1)}
                        </span>
                      )}
                    </div>

                    <h2 className="dsc-title">{hotel.name}</h2>

                    {hotel.features && hotel.features.length > 0 && (
                      <div className="dsc-features">
                        {hotel.features.slice(0, 3).map((feat, idx) => (
                          <span key={idx} className="dsc-feat-tag">{feat}</span>
                        ))}
                      </div>
                    )}

                    <div className="dsc-footer">
                      <div className="dsc-price">
                        <strong>฿{hotel.pricePerNight.toLocaleString()}</strong>
                        <span>{isPerPerson ? t('common.perPerson') : t('common.perNight')}</span>
                      </div>
                      <span className="dsc-explore-link">{t('hotels.viewStay')}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="hotels-empty-state">
            <h3>{t('hotels.emptyTitle')}</h3>
            <p>
              {t('hotels.emptyBody')}
            </p>
            <button
              type="button"
              className="h-empty-reset-btn"
              onClick={handleResetFilters}
            >
              {t('hotels.showAll')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
