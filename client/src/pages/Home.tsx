import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useTranslation } from 'react-i18next';
import './Home.css';
import { AirbnbCard } from '../components/AirbnbCard';
import { VerifiedBadge } from '../components/VerifiedBadge';

interface Property {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  price?: number | string;
  price_per_night?: number;
  pricePerNight: number;
  price_type?: 'per_night' | 'per_person';
  priceType?: 'per_night' | 'per_person';
  currency: string;
  imageUrl: string;
  images?: string[];
  isVerified: boolean;
  features: string[];
  amenities?: string[];
  description?: string;
  location: string;
  district?: string;
  province?: string;
  status?: string;
}

interface JournalPreview {
  id: string;
  imageUrl: string;
  content: string;
  authorName: string;
  authorAvatar?: string;
  locationTag: string;
  likesCount: number;
}

type AtmosphereMode = 'dawn' | 'daylight' | 'starlight';

const ATMOSPHERE_MODES: {
  id: AtmosphereMode;
  label: string;
  temp: string;
  condition: string;
}[] = [
    { id: 'dawn', label: 'Dawn Mist', temp: '16°C', condition: 'Golden Sunrise' },
    { id: 'daylight', label: 'Forest Noon', temp: '23°C', condition: 'Clear Ridge' },
    { id: 'starlight', label: 'Starlight', temp: '13°C', condition: 'Night Sanctuary' },
  ];

const MARQUEE_MOMENTS = [
  { title: 'Doi Luang Sunrise', tag: 'Chiang Dao', query: 'Chiang Dao', img: '/doiluangbg.jpg' },
  { title: 'Misty Valley Homestays', tag: 'Local Stays', query: 'Homestay', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
  { title: 'Forest Canopy Retreats', tag: 'Mae Rim', query: 'Mae Rim', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80' },
  { title: 'Artisan Mountain Cafes', tag: 'Slow Living', query: 'Chiang Dao', img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80' },
  { title: 'Stargazing Cabins', tag: 'Highlands', query: 'Cabin', img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80' },
];

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [journalPosts, setJournalPosts] = useState<JournalPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const [atmosphere, setAtmosphere] = useState<AtmosphereMode>('dawn');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'rating'>('recommended');
  const [mobileQuery, setMobileQuery] = useState('');

  const heroRef = useRef<HTMLElement>(null);

  // Subtle interactive 3D mouse parallax on the Hero stage
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--mx', `${(x * 18).toFixed(2)}px`);
    el.style.setProperty('--my', `${(y * 12).toFixed(2)}px`);
  };

  const handleHeroMouseLeave = () => {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty('--mx', '0px');
    el.style.setProperty('--my', '0px');
  };

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'published');

      if (error) {
        console.error("Failed to fetch properties:", error);
      } else {
        const formatted = (data || []).map(p => ({
          ...p,
          pricePerNight: p.price_per_night,
          imageUrl: p.image_url,
          images: p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
          isVerified: p.is_verified,
          location: p.location || `${p.district || 'Chiang Dao'}, ${p.province || 'Chiang Mai'}`
        }));
        setProperties(formatted);
      }
      setLoading(false);
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    const fetchJournal = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, image_url, author_name, author_avatar, location_tag, likes, created_at')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error("Failed to fetch community posts:", error);
        return;
      }

      const mapped: JournalPreview[] = (data || []).map(p => ({
        id: p.id,
        imageUrl: p.image_url,
        content: p.content || '',
        authorName: p.author_name || 'Traveler',
        authorAvatar: p.author_avatar,
        locationTag: p.location_tag || 'Chiang Dao',
        likesCount: (p.likes || []).length
      }));

      setJournalPosts(mapped);
    };

    fetchJournal();
  }, []);

  const formatPrice = (prop: Property) =>
    `฿${Number(prop.pricePerNight || prop.price_per_night || prop.price || 0).toLocaleString()}`;

  const categories = [
    { id: 'all', label: t('home.moods.all') },
    { id: 'homestay', label: 'Homestays' },
    { id: 'forest', label: t('home.moods.forest') },
    { id: 'boutique', label: t('home.moods.boutique') },
    { id: 'verified', label: 'Verified Stays' },
  ];

  const filteredProperties = useMemo(() => {
    let list = [...properties];

    if (selectedMood === 'verified') {
      list = list.filter(p => p.isVerified);
    } else if (selectedMood === 'homestay') {
      const m = list.filter(p => ['homestay', 'guesthouse'].some(k => (p.type || '').toLowerCase().includes(k)));
      if (m.length > 0) list = m;
    } else if (selectedMood === 'forest') {
      const m = list.filter(p => ['cabin', 'glamping', 'eco', 'nature', 'homestay'].some(k => (p.type || '').toLowerCase().includes(k)));
      if (m.length > 0) list = m;
    } else if (selectedMood === 'boutique') {
      const m = list.filter(p => ['resort', 'villa', 'hotel', 'boutique'].some(k => (p.type || '').toLowerCase().includes(k)));
      if (m.length > 0) list = m;
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => Number(a.pricePerNight || a.price || 0) - Number(b.pricePerNight || b.price || 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return list;
  }, [properties, selectedMood, sortBy]);

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(mobileQuery.trim() ? `/hotels?q=${encodeURIComponent(mobileQuery.trim())}` : '/hotels');
  };

  const mobileDeals = [...properties]
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 6);

  const featuredStay = properties[0];
  const activeAtmoObj = ATMOSPHERE_MODES.find(m => m.id === atmosphere) || ATMOSPHERE_MODES[0];

  // Combine verified stays + curated destinations for the calm destination strip (no duplicate loop)
  const filmstripItems = useMemo(() => {
    const stayItems = properties.map(p => ({
      title: p.name,
      tag: `${formatPrice(p)} / night`,
      href: `/hotels/${p.id}`,
      img: p.imageUrl || '/doiluangbg.jpg'
    }));
    const staticItems = MARQUEE_MOMENTS.map(m => ({
      title: m.title,
      tag: m.tag,
      href: `/hotels?q=${encodeURIComponent(m.query)}`,
      img: m.img
    }));
    return [...stayItems, ...staticItems].slice(0, 5);
  }, [properties]);

  return (
    <div className="home-page animate-fade-in">

      {/* ── Mobile app-style hero + search card (shown ≤768px) ── */}
      <section className="mobile-app-hero" aria-label="Quick search">
        <div className="mobile-hero-inner">
          <p className="mobile-hero-kicker">{t('home.hero.subtitle')}</p>
          <h2 className="mobile-hero-title">
            {t('home.hero.titlePart1')} {t('home.hero.titlePart2')}
          </h2>
        </div>

        <div className="mobile-search-card">
          <div className="msc-tabs" role="tablist">
            <button className="msc-tab active" onClick={() => navigate('/hotels')}>
              {t('header.mobile.hotels')}
            </button>
            <button className="msc-tab" onClick={() => navigate('/hotels?type=Nature')}>
              {t('home.mobileSearch.nature')}
            </button>
            <button className="msc-tab" onClick={() => navigate('/hotels?type=Cafe')}>
              {t('home.mobileSearch.cafe')}
            </button>
            <button className="msc-tab" onClick={() => navigate('/community')}>
              {t('home.mobileSearch.community')}
            </button>
          </div>

          <form className="msc-search" onSubmit={handleMobileSearch}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#9aa5a0" aria-hidden="true">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="text"
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              placeholder={t('header.searchPlaceholder')}
              aria-label={t('header.searchPlaceholder')}
            />
            <button type="submit" className="msc-search-btn" aria-label="Search">
              <svg viewBox="0 0 32 32" width="14" height="14" aria-hidden="true" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 3 }}>
                <path d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9" />
              </svg>
            </button>
          </form>

          <div className="msc-meta" onClick={() => navigate('/hotels')} role="button" tabIndex={0}>
            <div className="msc-meta-item">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#2C4C3B" aria-hidden="true">
                <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
              </svg>
              <span>{t('home.mobileSearch.anyDate')}</span>
            </div>
            <div className="msc-divider"></div>
            <div className="msc-meta-item">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#2C4C3B" aria-hidden="true">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              <span>{t('home.mobileSearch.anyGuest')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile deals carousel (shown ≤768px) ── */}
      {mobileDeals.length > 0 && (
        <section className="mobile-promo-section" aria-label="Top deals">
          <div className="mobile-section-head">
            <h2>{t('home.promo.title')}</h2>
          </div>
          <div className="promo-scroll">
            {mobileDeals.map(prop => (
              <div key={prop.id} className="promo-card" onClick={() => navigate(`/hotels/${prop.id}`)}>
                <div className="promo-img-wrap">
                  <img src={prop.imageUrl} alt={prop.name} loading="lazy" />
                  {Number(prop.rating || 0) >= 4.8 && (
                    <span className="promo-badge">{t('home.promo.badge')}</span>
                  )}
                </div>
                <div className="promo-info">
                  <span className="promo-name">{prop.name}</span>
                  <span className="promo-loc">{prop.location}</span>
                  <span className="promo-price">
                    {formatPrice(prop)}
                    <em> /{t('home.promo.perNight')}</em>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          DESKTOP HERO — Borderless Living Panorama with Parallax,
          Drifting Mountain Mist, Fireflies & Atmosphere Switcher
      ══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className={`hero luxury-hero atmo-${atmosphere}`}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
        <div className="hero-stage">
          {/* Parallax Mountain Layer */}
          <div className="hero-photo active">
            <img src="/doiluangbg.jpg" alt="Doi Luang Chiang Dao" fetchPriority="high" />
          </div>

          {/* Animated Drifting Mist Clouds */}
          <div className="hero-mist-container" aria-hidden="true">
            <div className="mist-band mist-band-1" />
            <div className="mist-band mist-band-2" />
          </div>

          {/* Floating Golden Sun-Motes / Starlight Fireflies */}
          <div className="hero-particles" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, idx) => (
              <span key={idx} className={`hero-mote mote-${idx + 1}`} />
            ))}
          </div>

          {/* Seamless Bottom Mist Melt into Page Background */}
          <div className="hero-bottom-melt" aria-hidden="true" />

          <div className="hero-stage-inner">
            <div className="hero-copy">
              <h1 className="hero-title">
                <span className="hero-title-reveal">{t('home.hero.titlePart1')}</span>{' '}
                <em className="hero-title-place">{t('home.hero.titlePart2')}</em>
              </h1>
              <p className="hero-lede">{t('home.hero.description')}</p>

              <div className="hero-actions">
                <button className="hero-cta" onClick={() => navigate('/hotels')}>
                  <span>{t('home.hero.exploreBtn')}</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                  </svg>
                </button>
                <button className="hero-link" onClick={() => navigate('/community')}>
                  {t('home.hero.sharePhoto', 'Share your photo')}
                </button>
              </div>
            </div>

            {/* Right Interactive Stack: Atmosphere Switcher + Floating Stay Pill */}
            <div className="hero-right-dock">
              {/* Interactive Time-of-Day Atmosphere Switcher */}
              <div className="atmo-widget" role="group" aria-label="Mountain atmosphere">
                <div className="atmo-status-line">
                  <span className="atmo-temp">{activeAtmoObj.temp}</span>
                  <span className="atmo-cond">Chiang Dao · {activeAtmoObj.condition}</span>
                </div>
                <div className="atmo-Segmented">
                  {ATMOSPHERE_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`atmo-btn ${atmosphere === m.id ? 'active' : ''}`}
                      onClick={() => setAtmosphere(m.id)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {featuredStay && (
                <div
                  className="mh-featured-pill"
                  onClick={() => navigate(`/hotels/${featuredStay.id}`)}
                >
                  <img src={featuredStay.imageUrl} alt={featuredStay.name} />
                  <div className="mh-pill-text">
                    <span className="mh-pill-kicker">{featuredStay.type || 'Featured Stay'}</span>
                    <strong>{featuredStay.name}</strong>
                    <span>{formatPrice(featuredStay)} {t('common.perNight')}</span>
                  </div>
                  <span className="mh-pill-arrow" aria-hidden="true">↗</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          GLIDING FILMSTRIP MARQUEE — Continuous Motion Ribbon
      ══════════════════════════════════════════════════════════ */}
      <section className="gliding-ribbon-section" aria-label="Discover Chiang Dao moments">
        <div className="gliding-track">
          {filmstripItems.map((item, idx) => (
            <div
              key={`${item.title}-${idx}`}
              className="gliding-card"
              onClick={() => navigate(item.href)}
            >
              <div className="gliding-thumb">
                <img src={item.img} alt={item.title} loading="lazy" />
              </div>
              <div className="gliding-meta">
                <strong>{item.title}</strong>
                <span>{item.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          THE COLLECTION — Borderless Filter Bar + Modern Stays Grid
      ══════════════════════════════════════════════════════════ */}
      <section className="collection-section">
        <div className="container">
          <div className="collection-top-row">
            <div>
              <h2 className="section-heading">{t('home.heritageCollection.title')}</h2>
              <p className="section-subheading">{t('home.heritageCollection.subtitle')}</p>
            </div>

            <button
              type="button"
              className="directory-link-btn"
              onClick={() => navigate('/hotels')}
            >
              <span>{t('home.featured.viewAll', 'View all properties')}</span>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          <div className="collection-controls-bar">
            <div className="minimal-category-pills" role="tablist">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedMood === cat.id}
                  className={`min-cat-pill ${selectedMood === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedMood(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="collection-sort-wrap">
              <label htmlFor="home-sort-select">Sort by</label>
              <select
                id="home-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          <button className="mobile-see-all" onClick={() => navigate('/hotels')}>
            {t('home.seeAll')} <span aria-hidden="true">›</span>
          </button>

          {loading ? (
            <div className="editorial-loading">{t('home.curatorsEdit.loading')}</div>
          ) : (
            <div className="destinations-grid">
              {filteredProperties.slice(0, 8).map(prop => (
                <AirbnbCard
                  key={prop.id}
                  title={prop.name}
                  subtitle={`${prop.type} • ${(prop.features || []).slice(0, 2).join(' • ') || prop.location || 'Local Stay'}`}
                  image={prop.imageUrl || '/assets/placeholder-hotel.jpg'}
                  price={`฿${Number(prop.pricePerNight || prop.price_per_night || prop.price || 0).toLocaleString()}`}
                  priceType={prop.price_type || prop.priceType as any}
                  rating={Number(prop.rating || 0)}
                  reviews={Number(prop.reviews || 0)}
                  isGuestFavorite={Number(prop.rating || 0) >= 4.8}
                  onClick={() => navigate(`/hotels/${prop.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CURATOR'S SPOTLIGHT — Calm Editorial Split Feature
      ══════════════════════════════════════════════════════════ */}
      {!loading && featuredStay && (
        <section className="curator-split-section">
          <div className="container">
            <div
              className="curator-split-card"
              onClick={() => navigate(`/hotels/${featuredStay.id}`)}
            >
              <div className="csc-media">
                <img src={featuredStay.imageUrl} alt={featuredStay.name} loading="lazy" />
              </div>

              <div className="csc-content">
                <div className="csc-top">
                  <div className="csc-eyebrow">
                    <span>{t('home.curatorsEdit.title')}</span>
                    {featuredStay.isVerified && <VerifiedBadge />}
                  </div>

                  <h2 className="csc-title">{featuredStay.name}</h2>
                  <p className="csc-location">
                    {featuredStay.type || 'Homestay'} in {featuredStay.location}
                  </p>

                  <p className="csc-description">
                    {featuredStay.description && featuredStay.description.trim().length > 0
                      ? featuredStay.description
                      : 'Handpicked for its authentic Northern Thai character, serene mountain setting, and direct connection with local hosts.'}
                  </p>

                  {featuredStay.features && featuredStay.features.length > 0 && (
                    <div className="csc-tags">
                      {featuredStay.features.slice(0, 4).map((feat, idx) => (
                        <span key={idx} className="csc-tag">{feat}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="csc-footer">
                  <div className="csc-price">
                    <strong>{formatPrice(featuredStay)}</strong>
                    <span>{t('common.perNight')}</span>
                  </div>

                  <span className="csc-cta">
                    <span>{t('home.hero.viewStay', 'View this stay')}</span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          COMMUNITY JOURNAL — Real Traveler Photography
      ══════════════════════════════════════════════════════════ */}
      {journalPosts.length > 0 && (
        <section className="home-journal-section">
          <div className="container">
            <div className="collection-top-row">
              <div>
                <h2 className="section-heading">{t('home.community.title')}</h2>
                <p className="section-subheading">
                  Real moments, mountain views, and stories shared by our community.
                </p>
              </div>
              <button
                type="button"
                className="directory-link-btn"
                onClick={() => navigate('/community')}
              >
                <span>{t('home.hero.viewPost', 'View in Community')}</span>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>

            <div className="home-journal-grid">
              {journalPosts.slice(0, 3).map((post) => (
                <article
                  key={post.id}
                  className="home-journal-card"
                  onClick={() => navigate('/community')}
                >
                  <div className="hjc-image-wrap">
                    <img src={post.imageUrl} alt={post.content || post.locationTag} loading="lazy" />
                    {post.locationTag && (
                      <span className="hjc-location-tag">{post.locationTag}</span>
                    )}
                  </div>
                  <div className="hjc-body">
                    <p className="hjc-caption">
                      {post.content || `Captured in ${post.locationTag}`}
                    </p>
                    <div className="hjc-author-row">
                      <span className="hjc-author-name">{post.authorName}</span>
                      <span className="hjc-likes">{post.likesCount} likes</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
};
