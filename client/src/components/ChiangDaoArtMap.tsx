import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Property } from '../types';
import { CHIANG_DAO_ATLAS_STAYS, type ChiangDaoZoneId } from '../utils/chiangDaoStays';
import './ChiangDaoArtMap.css';

interface ChiangDaoArtMapProps {
  properties: Property[];
  loading?: boolean;
}

type ZoneFilterId = 'all' | ChiangDaoZoneId;

interface ZoneMeta {
  id: ZoneFilterId;
  label: string;
  labelTh: string;
  elevation: string;
  subtitle: string;
  anchor: { x: number; y: number };
  radius: number;
}

const ZONES: ZoneMeta[] = [
  {
    id: 'all',
    label: 'All Chiang Dao',
    labelTh: 'ทั้งอำเภอเชียงดาว',
    elevation: '405 – 2,175 m',
    subtitle: 'Click any homestay pin on the map to preview its view, host, and nightly rate',
    anchor: { x: 50, y: 50 },
    radius: 0,
  },
  {
    id: 'nalao',
    label: 'Ban Na Lao Mai',
    labelTh: 'บ้านนาเลาใหม่',
    elevation: '1,150 m · High Ridge',
    subtitle: 'Iconic wooden balcony homestays looking directly at Doi Luang’s limestone peak',
    anchor: { x: 27, y: 31 },
    radius: 135,
  },
  {
    id: 'muangkong',
    label: 'Muang Kong',
    labelTh: 'เมืองคอง',
    elevation: '680 m · Hidden Valley',
    subtitle: 'Quiet back-valley behind Doi Luang with riverside cabins, rice paddies & morning fog',
    anchor: { x: 22, y: 66 },
    radius: 105,
  },
  {
    id: 'maemae',
    label: 'Ban Mae Mae',
    labelTh: 'บ้านแม่แมะ',
    elevation: '790 m · Forest Canopy',
    subtitle: 'Evergreen rainforest village famous for treehouses and cool mountain streams',
    anchor: { x: 63, y: 26 },
    radius: 115,
  },
  {
    id: 'tham',
    label: 'Ban Tham',
    labelTh: 'บ้านถ้ำ',
    elevation: '465 m · Foothills',
    subtitle: 'Garden bungalows, earthen domes & forest stays near Wat Tham Chiang Dao',
    anchor: { x: 46, y: 52 },
    radius: 110,
  },
  {
    id: 'town',
    label: 'Town & Riverside',
    labelTh: 'ตัวเมือง & ริมปิง',
    elevation: '410 m · Mae Ping Basin',
    subtitle: 'Boutique resorts, riverside villas & artisan cafes along the upper Mae Ping River',
    anchor: { x: 74, y: 66 },
    radius: 110,
  },
];

const inferZone = (prop: Property, index: number): ChiangDaoZoneId => {
  const hay = `${prop.name || ''} ${prop.location || ''} ${prop.district || ''} ${prop.description || ''}`.toLowerCase();
  if (hay.includes('na lao') || hay.includes('นาเลา') || hay.includes('ระเบียงดาว') || hay.includes('สายหมอก')) return 'nalao';
  if (hay.includes('muang kong') || hay.includes('เมืองคอง')) return 'muangkong';
  if (hay.includes('mae mae') || hay.includes('แม่แมะ') || hay.includes('ต้นไม้')) return 'maemae';
  if (hay.includes('tham') || hay.includes('ถ้ำ') || hay.includes('nest') || hay.includes('roundhouse')) return 'tham';
  if (hay.includes('town') || hay.includes('ping') || hay.includes('ปิง')) return 'town';
  const cycle: ChiangDaoZoneId[] = ['tham', 'nalao', 'town', 'maemae', 'muangkong'];
  return cycle[index % cycle.length];
};

const shortDisplayName = (fullName: string) => {
  // If formatted like "บ้านระเบียงดาว (Baan Rabiang Dao)", keep the primary title clean
  const match = fullName.match(/^([^(]+)\(([^)]+)\)/);
  if (match) {
    return { primary: match[1].trim(), secondary: match[2].trim() };
  }
  return { primary: fullName, secondary: '' };
};

const formatPrice = (prop: Property) => {
  const raw = Number(prop.pricePerNight ?? prop.price_per_night ?? prop.price ?? 0);
  return `฿${raw.toLocaleString()}`;
};

export const ChiangDaoArtMap: React.FC<ChiangDaoArtMapProps> = ({ properties }) => {
  const navigate = useNavigate();
  const [activeZone, setActiveZone] = useState<ZoneFilterId>('all');

  // Combine live Supabase stays with the curated Chiang Dao Valley Atlas directory
  const allMappedStays = useMemo(() => {
    const liveChiangDao = properties.filter(p => {
      const text = `${p.district || ''} ${p.location || ''} ${p.province || ''} ${p.name || ''}`.toLowerCase();
      return text.includes('chiang dao') || text.includes('เชียงดาว') || properties.length <= 6;
    });

    const seenNames = new Set<string>();
    const combined: {
      prop: Property;
      zoneId: ChiangDaoZoneId;
      zoneLabel: string;
      x: number;
      y: number;
    }[] = [];

    // 1. Place live Supabase properties first
    liveChiangDao.forEach((p, idx) => {
      const normName = (p.name || '').trim().toLowerCase();
      seenNames.add(normName);
      const zId = inferZone(p, idx);
      const zMeta = ZONES.find(z => z.id === zId) || ZONES[4];
      combined.push({
        prop: p,
        zoneId: zId,
        zoneLabel: zMeta.label,
        x: zMeta.anchor.x + ((idx % 3) - 1) * 5,
        y: zMeta.anchor.y + (Math.floor(idx / 3) - 0.5) * 6,
      });
    });

    // 2. Include all curated Chiang Dao Atlas accommodations not already duplicated
    CHIANG_DAO_ATLAS_STAYS.forEach(stay => {
      const normName = stay.name.trim().toLowerCase();
      if (seenNames.has(normName)) return;
      seenNames.add(normName);
      combined.push({
        prop: stay,
        zoneId: stay.zoneId,
        zoneLabel: stay.zoneLabel,
        x: stay.mapX,
        y: stay.mapY,
      });
    });

    return combined;
  }, [properties]);

  const visiblePins = useMemo(
    () => (activeZone === 'all' ? allMappedStays : allMappedStays.filter(p => p.zoneId === activeZone)),
    [allMappedStays, activeZone]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (visiblePins.length > 0 && !visiblePins.some(p => p.prop.id === selectedId)) {
      setSelectedId(visiblePins[0].prop.id);
    }
  }, [visiblePins, selectedId]);

  const selectedPin = useMemo(
    () => visiblePins.find(p => p.prop.id === selectedId) || visiblePins[0] || null,
    [visiblePins, selectedId]
  );

  const activeZoneMeta = ZONES.find(z => z.id === activeZone) || ZONES[0];

  const zoneCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allMappedStays.length };
    ZONES.forEach(z => {
      if (z.id !== 'all') {
        counts[z.id] = allMappedStays.filter(p => p.zoneId === z.id).length;
      }
    });
    return counts;
  }, [allMappedStays]);

  return (
    <section className="cd-map-section" aria-label="Chiang Dao Valley Homestay Map">
      <div className="container">
        {/* ── Section Header & Zone Filter Pills ── */}
        <div className="cd-map-header">
          <div>
            <h2 className="section-heading">
              Chiang Dao <em>Valley Atlas</em>
            </h2>
            <p className="section-subheading">
              Interactive illustrated map of {allMappedStays.length} verified homestays, treehouses & mountain retreats across all 5 Chiang Dao valleys.
            </p>
          </div>

          <div className="cd-zone-pills" role="tablist" aria-label="Chiang Dao Areas">
            {ZONES.map(zone => (
              <button
                key={zone.id}
                type="button"
                role="tab"
                aria-selected={activeZone === zone.id}
                className={`cd-zone-pill ${activeZone === zone.id ? 'active' : ''}`}
                onClick={() => setActiveZone(zone.id)}
              >
                <span>{zone.label}</span>
                <small className="cd-zone-count">{zoneCounts[zone.id] ?? 0}</small>
              </button>
            ))}
          </div>
        </div>

        {/* ── Split Art Map + Selected Homestay Inspector ── */}
        <div className="cd-map-layout">
          {/* Left: Hand-Crafted Botanical & Topographic Illustrated Map */}
          <div className="cd-art-canvas">
            <svg
              className="cd-topo-svg"
              viewBox="0 0 1000 640"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="cdSkyPaper" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E6EFE8" />
                  <stop offset="45%" stopColor="#EFF4EE" />
                  <stop offset="100%" stopColor="#F5ECE2" />
                </linearGradient>

                <radialGradient id="cdSunriseAura" cx="28%" cy="24%" r="42%">
                  <stop offset="0%" stopColor="#F4C095" stopOpacity="0.55" />
                  <stop offset="55%" stopColor="#F3DCCB" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#F3DCCB" stopOpacity="0" />
                </radialGradient>

                <linearGradient id="cdDistantRange" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#5D7B6B" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#5D7B6B" stopOpacity="0.03" />
                </linearGradient>

                <linearGradient id="cdDoiLuangLit" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2C4C3B" stopOpacity="0.42" />
                  <stop offset="65%" stopColor="#3B624E" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#2C4C3B" stopOpacity="0.06" />
                </linearGradient>

                <linearGradient id="cdDoiLuangShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1B3326" stopOpacity="0.52" />
                  <stop offset="100%" stopColor="#2C4C3B" stopOpacity="0.12" />
                </linearGradient>

                <linearGradient id="cdForestCanopy" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3D6B52" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#3D6B52" stopOpacity="0.04" />
                </linearGradient>

                <pattern id="cdCartoGrid" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path
                    d="M 80 0 L 0 0 0 80"
                    fill="none"
                    stroke="#2C4C3B"
                    strokeWidth="0.6"
                    strokeOpacity="0.05"
                  />
                </pattern>
              </defs>

              {/* 1. Botanical Parchment Base + Subtle Cartographic Grid */}
              <rect width="1000" height="640" fill="url(#cdSkyPaper)" />
              <rect width="1000" height="640" fill="url(#cdCartoGrid)" />

              {/* 2. Golden Sunrise Glow Behind Doi Luang */}
              <rect width="1000" height="640" fill="url(#cdSunriseAura)" />
              <circle cx="295" cy="128" r="38" fill="#E8996E" fillOpacity="0.28" />

              {/* 3. Distant Northern Horizon Mountain Range */}
              <path
                d="M-20,175 L75,110 L155,148 L245,78 L345,135 L445,88 L560,145 L675,72 L795,128 L915,82 L1020,140 L1020,260 L-20,260 Z"
                fill="url(#cdDistantRange)"
              />

              {/* 4. Shaded Forest Valleys (Ban Mae Mae & Muang Kong) */}
              <path
                d="M490,90 C590,50 740,65 820,145 C890,215 830,335 720,350 C610,365 495,310 475,215 C455,120 440,110 490,90 Z"
                fill="url(#cdForestCanopy)"
              />
              <path
                d="M45,355 C120,320 265,330 335,405 C405,480 365,585 245,600 C125,615 35,545 25,455 C15,365 5,375 45,355 Z"
                fill="url(#cdForestCanopy)"
              />

              {/* 5. Topographic Elevation Contours */}
              <g fill="none" stroke="#2C4C3B" strokeOpacity="0.13" strokeWidth="1.2">
                <path d="M-30,285 C65,230 120,95 265,80 C410,65 470,190 440,300 C410,410 250,450 110,425 C20,408 -15,345 -30,285 Z" />
                <path d="M15,270 C95,220 148,115 265,102 C382,89 428,195 402,285 C376,375 242,408 130,388 C48,372 22,320 15,270 Z" />
                <path d="M68,255 C132,212 175,138 266,128 C357,118 388,200 368,270 C348,340 236,366 155,350 C92,338 62,295 68,255 Z" />
                <path d="M525,65 C625,45 735,62 795,132 C855,202 825,295 732,312 C639,329 535,282 512,202 C489,122 475,75 525,65 Z" />
              </g>

              {/* 6. Illustrated Doi Luang Chiang Dao Limestone Massif (3D Faceted Peaks) */}
              <g>
                {/* Left Peak (Doi Sam Phi Nong) */}
                <polygon points="55,265 162,126 232,205 155,265" fill="url(#cdDoiLuangShadow)" />
                <polygon points="162,126 248,205 292,265 155,265" fill="url(#cdDoiLuangLit)" />

                {/* Main Summit (Doi Luang 2,175m) */}
                <polygon points="185,265 295,92 318,265" fill="url(#cdDoiLuangShadow)" />
                <polygon points="295,92 435,265 318,265" fill="url(#cdDoiLuangLit)" />

                {/* Right Foothill Peak (Doi Nang) */}
                <polygon points="335,265 398,154 468,265" fill="url(#cdDoiLuangLit)" />

                {/* Crisp Ridge Outlines & Limestone Crags */}
                <path
                  d="M55,265 L162,126 L218,188 L295,92 L372,184 L398,154 L468,265"
                  fill="none"
                  stroke="#1E382A"
                  strokeOpacity="0.68"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M162,126 L155,265 M295,92 L318,265 M295,92 L262,178 M398,154 L382,225"
                  fill="none"
                  stroke="#1E382A"
                  strokeOpacity="0.28"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />

                {/* Drifting Valley Cloud Bands Across Base of Doi Luang */}
                <path
                  d="M42,252 Q145,238 248,252 T455,248"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeOpacity="0.75"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M88,268 Q210,256 332,268 T485,264"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeOpacity="0.55"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </g>

              {/* 7. Illustrated Botanical Pine & Teak Tree Clusters */}
              <g stroke="#2C4C3B" strokeOpacity="0.38" strokeWidth="1.4" fill="#3B624E" fillOpacity="0.22" strokeLinecap="round" strokeLinejoin="round">
                {/* Ban Mae Mae Forest */}
                <path d="M545,175 L553,155 L561,175 Z M565,182 L575,158 L585,182 Z M588,174 L595,156 L602,174 Z" />
                <path d="M685,165 L694,142 L703,165 Z M708,172 L716,152 L724,172 Z" />
                {/* Ban Tham Forest */}
                <path d="M368,318 L376,298 L384,318 Z M388,324 L396,304 L404,324 Z" />
                {/* Muang Kong Valley Trees */}
                <path d="M125,455 L133,435 L141,455 Z M146,462 L154,442 L162,462 Z" />
              </g>

              {/* 8. Winding Mae Ping River & Kong River Tributaries */}
              <g fill="none" strokeLinecap="round">
                {/* Main Mae Ping River */}
                <path
                  d="M845,-15 C820,95 760,145 782,250 C804,355 728,435 765,535 C785,585 815,615 835,650"
                  stroke="#6CA092"
                  strokeOpacity="0.38"
                  strokeWidth="16"
                />
                <path
                  d="M845,-15 C820,95 760,145 782,250 C804,355 728,435 765,535 C785,585 815,615 835,650"
                  stroke="#2C4C3B"
                  strokeOpacity="0.35"
                  strokeWidth="2"
                />
                {/* Mae Mae Mountain Stream joining Mae Ping */}
                <path
                  d="M585,145 C635,195 695,220 780,245"
                  stroke="#6CA092"
                  strokeOpacity="0.32"
                  strokeWidth="6"
                />
                {/* Kong River in Muang Kong Valley */}
                <path
                  d="M85,595 C145,515 215,475 265,395 C305,335 295,285 280,255"
                  stroke="#6CA092"
                  strokeOpacity="0.32"
                  strokeWidth="8"
                />
              </g>

              {/* 9. Active Zone Highlight Ring */}
              {activeZone !== 'all' && (
                <circle
                  cx={activeZoneMeta.anchor.x * 10}
                  cy={activeZoneMeta.anchor.y * 6.4}
                  r={activeZoneMeta.radius}
                  fill="#C2704E"
                  fillOpacity="0.08"
                  stroke="#C2704E"
                  strokeOpacity="0.45"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
              )}

              {/* 10. Scenic Roads (Route 107 & Mountain Trails) */}
              <g fill="none" stroke="#C2704E" strokeOpacity="0.52" strokeWidth="2.2" strokeDasharray="7 6" strokeLinecap="round">
                {/* Route 107 Spine */}
                <path d="M510,640 C530,525 585,455 635,390 C685,325 725,265 738,180 C750,95 715,35 690,-10" />
                {/* Mountain Road to Ban Tham & Ban Na Lao Mai */}
                <path d="M612,420 C535,385 480,340 425,295 C365,245 315,215 255,195" />
                {/* Trail from Ban Na Lao Mai to Muang Kong */}
                <path d="M255,195 C215,265 205,345 215,435" />
                {/* Forest Road to Ban Mae Mae */}
                <path d="M675,325 C655,255 642,205 632,160" />
              </g>

              {/* Route 107 Highway Shield */}
              <g transform="translate(558, 520)">
                <rect x="-20" y="-11" width="40" height="22" rx="6" fill="#FFFFFF" stroke="#C2704E" strokeWidth="1.5" />
                <text x="0" y="4" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#C2704E" fontFamily="Outfit, sans-serif">
                  107
                </text>
              </g>

              {/* 11. Cartographic Titles & Valley Region Banners */}
              <g fontFamily="Outfit, Inter, sans-serif">
                {/* Doi Luang Summit Label */}
                <text x="295" y="62" textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="0.14em" fill="#1E382A">
                  DOI LUANG CHIANG DAO
                </text>
                <text x="295" y="79" textAnchor="middle" fontSize="11" fontWeight="600" fill="#C2704E">
                  ▲ 2,175 m · UNESCO Biosphere Reserve
                </text>

                {/* Mae Ping River Label */}
                <text x="805" y="455" fontSize="10.5" fontWeight="700" letterSpacing="0.1em" fill="#3B624E" opacity="0.75" transform="rotate(-74 805 455)">
                  MAE PING RIVER
                </text>

                {/* Sub-Region Place Labels */}
                <g fontSize="12" fontWeight="700" fill="#1E382A" opacity="0.78">
                  <text x="135" y="185">BAN NA LAO MAI</text>
                  <text x="115" y="515">MUANG KONG VALLEY</text>
                  <text x="585" y="105">BAN MAE MAE FOREST</text>
                  <text x="415" y="385">BAN THAM &amp; CAVE</text>
                  <text x="645" y="545">CHIANG DAO TOWN</text>
                </g>
              </g>

              {/* Minimalist Compass Rose (Bottom Left) */}
              <g transform="translate(54, 576)" stroke="#2C4C3B" strokeOpacity="0.55" fill="none">
                <circle cx="0" cy="0" r="22" fill="#FFFFFF" fillOpacity="0.6" strokeWidth="1.2" />
                <path d="M0,-28 L4,-4 L28,0 L4,4 L0,28 L-4,4 L-28,0 L-4,-4 Z" strokeWidth="1.2" />
                <polygon points="0,-24 4,-4 -4,-4" fill="#C2704E" stroke="none" />
                <text x="-4" y="-32" fontSize="10" fontWeight="800" fill="#2C4C3B" stroke="none" fontFamily="Outfit, sans-serif">
                  N
                </text>
              </g>
            </svg>

            {/* Interactive Homestay Pins (Shows Name + Price Directly on Map) */}
            {visiblePins.map(pin => {
              const isSelected = selectedPin?.prop.id === pin.prop.id;
              const { primary } = shortDisplayName(pin.prop.name);
              return (
                <button
                  key={pin.prop.id}
                  type="button"
                  className={`cd-map-pin ${isSelected ? 'active' : ''}`}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  onClick={() => setSelectedId(pin.prop.id)}
                  aria-label={`${pin.prop.name} - ${formatPrice(pin.prop)}`}
                >
                  <span className="cd-pin-dot" />
                  <span className="cd-pin-name">{primary}</span>
                  <span className="cd-pin-price">{formatPrice(pin.prop)}</span>
                </button>
              );
            })}

            {/* Bottom-Right Floating Legend Pill (Never blocks Doi Luang peak) */}
            <div className="cd-map-legend">
              <div className="cd-legend-top">
                <strong>{activeZoneMeta.label}</strong>
                <span className="cd-legend-elev">{activeZoneMeta.elevation}</span>
              </div>
              <span className="cd-legend-desc">{activeZoneMeta.subtitle}</span>
            </div>
          </div>

          {/* Right: Selected Homestay Card + Scrollable Directory of All Chiang Dao Stays */}
          <div className="cd-map-sidebar">
            {selectedPin && (
              <article
                className="cd-selected-card"
                onClick={() => navigate(`/hotels/${selectedPin.prop.id}`)}
              >
                <div className="cd-selected-media">
                  <img
                    src={selectedPin.prop.imageUrl || '/doiluangbg.jpg'}
                    alt={selectedPin.prop.name}
                    loading="lazy"
                  />
                  <span className="cd-selected-zone">{selectedPin.zoneLabel}</span>
                  {selectedPin.prop.isVerified && (
                    <span className="cd-selected-verified">Verified Stay</span>
                  )}
                </div>

                <div className="cd-selected-body">
                  <div className="cd-selected-top">
                    <div>
                      <span className="cd-selected-type">
                        {selectedPin.prop.type || 'Homestay'} · ★ {selectedPin.prop.rating || 4.8}
                      </span>
                      <h3>{shortDisplayName(selectedPin.prop.name).primary}</h3>
                      {shortDisplayName(selectedPin.prop.name).secondary && (
                        <small className="cd-selected-subname">
                          {shortDisplayName(selectedPin.prop.name).secondary}
                        </small>
                      )}
                    </div>
                    <div className="cd-selected-price">
                      <strong>{formatPrice(selectedPin.prop)}</strong>
                      <span>
                        {selectedPin.prop.price_type === 'per_person' ? '/ person' : '/ night'}
                      </span>
                    </div>
                  </div>

                  <p className="cd-selected-desc">
                    {selectedPin.prop.description && selectedPin.prop.description.trim().length > 0
                      ? selectedPin.prop.description
                      : `Peaceful ${selectedPin.prop.type?.toLowerCase() || 'homestay'} tucked in ${selectedPin.zoneLabel}, Chiang Dao.`}
                  </p>

                  {selectedPin.prop.features && selectedPin.prop.features.length > 0 && (
                    <div className="cd-selected-tags">
                      {selectedPin.prop.features.slice(0, 3).map((feat, i) => (
                        <span key={i}>{feat}</span>
                      ))}
                    </div>
                  )}

                  <div className="cd-selected-actions">
                    <button
                      type="button"
                      className="cd-selected-cta"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/hotels/${selectedPin.prop.id}`);
                      }}
                    >
                      <span>View Stay Details</span>
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>

                    {selectedPin.prop.contact?.phone && (
                      <a
                        href={`tel:${selectedPin.prop.contact.phone}`}
                        className="cd-selected-call"
                        onClick={e => e.stopPropagation()}
                        title={`Call Host: ${selectedPin.prop.contact.phone}`}
                      >
                        Call {selectedPin.prop.contact.phone}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            )}

            {/* Complete Clickable List of Chiang Dao Accommodations */}
            <div className="cd-stay-list">
              <div className="cd-stay-list-head">
                <span>
                  {activeZone === 'all'
                    ? `All Chiang Dao Stays (${visiblePins.length})`
                    : `${activeZoneMeta.label} Stays (${visiblePins.length})`}
                </span>
                <button type="button" onClick={() => navigate('/hotels?q=Chiang%20Dao')}>
                  Full Directory →
                </button>
              </div>
              <div className="cd-stay-list-items">
                {visiblePins.map(pin => {
                  const isSelected = selectedPin?.prop.id === pin.prop.id;
                  const { primary } = shortDisplayName(pin.prop.name);
                  return (
                    <button
                      key={pin.prop.id}
                      type="button"
                      className={`cd-stay-row ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedId(pin.prop.id)}
                    >
                      <img src={pin.prop.imageUrl || '/doiluangbg.jpg'} alt="" loading="lazy" />
                      <div className="cd-stay-row-info">
                        <strong>{primary}</strong>
                        <span>
                          {pin.zoneLabel} · ★ {pin.prop.rating || 4.8}
                        </span>
                      </div>
                      <span className="cd-stay-row-price">{formatPrice(pin.prop)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChiangDaoArtMap;
