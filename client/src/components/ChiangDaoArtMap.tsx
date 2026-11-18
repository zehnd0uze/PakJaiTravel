import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Property } from '../types';
import './ChiangDaoArtMap.css';

interface ChiangDaoArtMapProps {
  properties: Property[];
  loading?: boolean;
}

type ZoneId = 'all' | 'nalao' | 'tham' | 'maemae' | 'muangkong' | 'town';

interface ZoneMeta {
  id: ZoneId;
  label: string;
  elevation: string;
  subtitle: string;
  anchor: { x: number; y: number };
}

const ZONES: ZoneMeta[] = [
  {
    id: 'all',
    label: 'All Chiang Dao',
    elevation: '400 – 2,175 m',
    subtitle: 'Every verified homestay & nature retreat across the Chiang Dao basin',
    anchor: { x: 50, y: 50 },
  },
  {
    id: 'nalao',
    label: 'Ban Na Lao Mai',
    elevation: '1,150 m',
    subtitle: 'Cliffside balconies directly facing Doi Luang’s limestone massif',
    anchor: { x: 26, y: 31 },
  },
  {
    id: 'muangkong',
    label: 'Muang Kong',
    elevation: '680 m',
    subtitle: 'Secluded valley behind the mountain, misty mornings & river bends',
    anchor: { x: 22, y: 63 },
  },
  {
    id: 'maemae',
    label: 'Ban Mae Mae',
    elevation: '790 m',
    subtitle: 'Forest stream treehouses & slow-living wooden cabins in the canopy',
    anchor: { x: 64, y: 24 },
  },
  {
    id: 'tham',
    label: 'Ban Tham',
    elevation: '460 m',
    subtitle: 'Foothill homestays near Chiang Dao Cave & ancient teak groves',
    anchor: { x: 46, y: 49 },
  },
  {
    id: 'town',
    label: 'Town & Riverside',
    elevation: '410 m',
    subtitle: 'Artisan cafes, morning markets & quiet retreats along the Mae Ping',
    anchor: { x: 74, y: 66 },
  },
];

// Deterministic offsets so multiple stays in the same zone never overlap
const PIN_OFFSETS = [
  { dx: 0, dy: 0 },
  { dx: 7.5, dy: -6 },
  { dx: -7.5, dy: 6.5 },
  { dx: 8, dy: 6 },
  { dx: -8, dy: -6 },
  { dx: 0, dy: 10 },
];

const inferZone = (prop: Property, index: number): ZoneId => {
  const hay = `${prop.name || ''} ${prop.location || ''} ${prop.district || ''} ${prop.description || ''}`.toLowerCase();
  if (hay.includes('na lao') || hay.includes('นาเลา')) return 'nalao';
  if (hay.includes('muang kong') || hay.includes('เมืองคอง')) return 'muangkong';
  if (hay.includes('mae mae') || hay.includes('แม่แมะ')) return 'maemae';
  if (hay.includes('tham') || hay.includes('ถ้ำ')) return 'tham';
  if (hay.includes('town') || hay.includes('ping') || hay.includes('ในเมือง') || hay.includes('ปิง')) return 'town';

  // Distribute general Chiang Dao stays naturally across the main scenic zones
  const cycle: ZoneId[] = ['tham', 'nalao', 'town', 'maemae', 'muangkong'];
  return cycle[index % cycle.length];
};

const formatPrice = (prop: Property) => {
  const raw = Number(prop.pricePerNight ?? prop.price_per_night ?? prop.price ?? 0);
  return `฿${raw.toLocaleString()}`;
};

export const ChiangDaoArtMap: React.FC<ChiangDaoArtMapProps> = ({ properties, loading = false }) => {
  const navigate = useNavigate();
  const [activeZone, setActiveZone] = useState<ZoneId>('all');

  // Filter for Chiang Dao stays (falls back to all published stays if none explicitly tagged)
  const chiangDaoStays = useMemo(() => {
    const matched = properties.filter(p => {
      const text = `${p.district || ''} ${p.location || ''} ${p.province || ''} ${p.name || ''}`.toLowerCase();
      return text.includes('chiang dao') || text.includes('เชียงดาว');
    });
    return matched.length > 0 ? matched : properties;
  }, [properties]);

  const mappedPins = useMemo(() => {
    const zoneCounters: Record<string, number> = {};
    return chiangDaoStays.map((prop, idx) => {
      const zoneId = inferZone(prop, idx);
      const countInZone = zoneCounters[zoneId] || 0;
      zoneCounters[zoneId] = countInZone + 1;

      const zoneMeta = ZONES.find(z => z.id === zoneId) || ZONES[4];
      const offset = PIN_OFFSETS[countInZone % PIN_OFFSETS.length];

      return {
        prop,
        zoneId,
        zoneLabel: zoneMeta.label,
        x: Math.min(88, Math.max(12, zoneMeta.anchor.x + offset.dx)),
        y: Math.min(86, Math.max(14, zoneMeta.anchor.y + offset.dy)),
      };
    });
  }, [chiangDaoStays]);

  const visiblePins = useMemo(
    () => (activeZone === 'all' ? mappedPins : mappedPins.filter(p => p.zoneId === activeZone)),
    [mappedPins, activeZone]
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

  return (
    <section className="cd-map-section" aria-label="Chiang Dao Valley Homestay Map">
      <div className="container">
        {/* ── Section Header ── */}
        <div className="cd-map-header">
          <div>
            <h2 className="section-heading">
              Chiang Dao <em>Valley Atlas</em>
            </h2>
            <p className="section-subheading">
              {chiangDaoStays.length > 0
                ? `Explore ${chiangDaoStays.length} homestays & nature retreats nestled around Doi Luang Chiang Dao.`
                : 'Explore the villages & homestay valleys nestled around Doi Luang Chiang Dao.'}
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
                {zone.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Split Art Map + Selected Homestay Card ── */}
        <div className="cd-map-layout">
          {/* Left: Custom Illustrated Topographic Art Map */}
          <div className="cd-art-canvas">
            <svg
              className="cd-topo-svg"
              viewBox="0 0 1000 620"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="cdPaperBg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5F7F2" />
                  <stop offset="55%" stopColor="#ECF2EC" />
                  <stop offset="100%" stopColor="#F7EFE7" />
                </linearGradient>
                <linearGradient id="cdMountainRidge" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2C4C3B" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2C4C3B" stopOpacity="0.04" />
                </linearGradient>
                <linearGradient id="cdMistGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F3DCCB" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#F3DCCB" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Soft Botanical Paper Base */}
              <rect width="1000" height="620" fill="url(#cdPaperBg)" />

              {/* Warm Sunrise / Mist Wash behind Doi Luang */}
              <circle cx="290" cy="185" r="220" fill="url(#cdMistGlow)" />

              {/* Topographic Elevation Contours around Doi Luang (2,175m) */}
              <g fill="none" stroke="#2C4C3B" strokeOpacity="0.11" strokeWidth="1.2">
                <path d="M-40,260 C70,220 130,110 250,95 C370,80 430,180 410,275 C390,370 250,410 120,390 C30,375 -20,320 -40,260 Z" />
                <path d="M10,245 C95,210 155,125 250,115 C345,105 390,185 372,262 C354,338 235,368 135,352 C55,338 15,295 10,245 Z" />
                <path d="M75,235 C135,205 180,145 250,138 C320,131 350,192 336,248 C322,305 225,326 155,314 C100,304 70,270 75,235 Z" />
                <path d="M145,225 C180,198 208,165 252,162 C296,159 312,198 302,232 C292,265 228,280 184,272 C152,265 135,244 145,225 Z" />
              </g>

              {/* Eastern Forest Foothills Contour (Ban Mae Mae) */}
              <g fill="none" stroke="#2C4C3B" strokeOpacity="0.09" strokeWidth="1.2">
                <path d="M560,20 C650,40 730,10 820,55 C910,100 940,200 860,255 C780,310 640,285 575,210 C510,135 510,10 560,20 Z" />
                <path d="M605,55 C675,70 735,48 800,82 C865,116 882,188 825,225 C768,262 662,244 612,190 C562,135 568,45 605,55 Z" />
              </g>

              {/* Doi Luang Chiang Dao Illustrated Mountain Peak */}
              <g>
                <path
                  d="M65,248 L175,132 L245,186 L310,112 L405,248 Z"
                  fill="url(#cdMountainRidge)"
                />
                <path
                  d="M95,246 L178,148 L238,195 L306,124 L388,246"
                  fill="none"
                  stroke="#2C4C3B"
                  strokeOpacity="0.45"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M178,148 L196,192 M306,124 L290,175"
                  fill="none"
                  stroke="#2C4C3B"
                  strokeOpacity="0.22"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </g>

              {/* Mae Ping River Winding Through the Valley */}
              <path
                d="M845,-10 C820,95 765,140 785,240 C805,340 730,425 765,525 C782,575 815,610 835,640"
                fill="none"
                stroke="#6E998B"
                strokeOpacity="0.34"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <path
                d="M845,-10 C820,95 765,140 785,240 C805,340 730,425 765,525 C782,575 815,610 835,640"
                fill="none"
                stroke="#2C4C3B"
                strokeOpacity="0.28"
                strokeWidth="1.6"
                strokeLinecap="round"
              />

              {/* Scenic Valley Roads (Route 107 & Mountain Trails) */}
              <g fill="none" stroke="#C2704E" strokeOpacity="0.42" strokeWidth="1.8" strokeDasharray="6 6" strokeLinecap="round">
                {/* Route 107 North-South Spine */}
                <path d="M510,630 C525,520 570,455 615,395 C660,335 715,275 730,190 C745,105 710,45 685,-10" />
                {/* Spur to Ban Tham & Ban Na Lao Mai */}
                <path d="M595,415 C525,380 480,330 430,295 C365,250 315,215 260,195" />
                {/* Spur to Muang Kong */}
                <path d="M430,295 C375,355 290,375 220,395" />
                {/* Spur to Ban Mae Mae */}
                <path d="M675,295 C655,235 645,195 640,150" />
              </g>

              {/* Editorial Map Labels */}
              <g fontFamily="Outfit, Inter, sans-serif" fill="#2C4C3B">
                <text x="242" y="96" fontSize="13" fontWeight="700" letterSpacing="0.12em" opacity="0.78">
                  DOI LUANG CHIANG DAO
                </text>
                <text x="242" y="114" fontSize="11" fontWeight="500" opacity="0.52">
                  2,175 m · Limestone Massif
                </text>

                <text x="795" y="455" fontSize="11" fontWeight="600" letterSpacing="0.08em" opacity="0.52" transform="rotate(-74 795 455)">
                  MAE PING RIVER
                </text>
              </g>

              {/* Zone Landmark Labels */}
              <g fontFamily="Inter, sans-serif" fontSize="11.5" fontWeight="600" fill="#465D50" opacity="0.72">
                <text x="200" y="232">Ban Na Lao Mai</text>
                <text x="155" y="438">Muang Kong</text>
                <text x="580" y="122">Ban Mae Mae</text>
                <text x="415" y="346">Ban Tham</text>
                <text x="680" y="468">Chiang Dao Town</text>
              </g>

              {/* Minimalist Compass Rose (Bottom Left) */}
              <g transform="translate(56, 558)" stroke="#2C4C3B" strokeOpacity="0.45" fill="none">
                <circle cx="0" cy="0" r="22" strokeWidth="1" />
                <path d="M0,-28 L4,-4 L28,0 L4,4 L0,28 L-4,4 L-28,0 L-4,-4 Z" strokeWidth="1.1" />
                <polygon points="0,-24 3.5,-3.5 -3.5,-3.5" fill="#C2704E" stroke="none" />
                <text x="-4" y="-33" fontSize="10" fontWeight="700" fill="#2C4C3B" stroke="none" fontFamily="Outfit, sans-serif">N</text>
              </g>
            </svg>

            {/* Zone Context Pill (Top Left Overlay) */}
            <div className="cd-map-legend">
              <span className="cd-legend-elev">{activeZoneMeta.elevation}</span>
              <span className="cd-legend-desc">{activeZoneMeta.subtitle}</span>
            </div>

            {/* Interactive Homestay Price Pins */}
            {visiblePins.map(pin => {
              const isSelected = selectedPin?.prop.id === pin.prop.id;
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
                  <span className="cd-pin-price">{formatPrice(pin.prop)}</span>
                  <span className="cd-pin-tooltip">{pin.prop.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Selected Homestay Card + Quick Directory */}
          <div className="cd-map-sidebar">
            {selectedPin ? (
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
                        {selectedPin.prop.type || 'Homestay'}
                      </span>
                      <h3>{selectedPin.prop.name}</h3>
                    </div>
                    <div className="cd-selected-price">
                      <strong>{formatPrice(selectedPin.prop)}</strong>
                      <span>/ night</span>
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

                  <button
                    type="button"
                    className="cd-selected-cta"
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/hotels/${selectedPin.prop.id}`);
                    }}
                  >
                    <span>Explore This Stay</span>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              </article>
            ) : (
              <div className="cd-selected-card cd-empty-card">
                <div className="cd-selected-media">
                  <img src="/doiluangbg.jpg" alt="Doi Luang Chiang Dao" loading="lazy" />
                  <span className="cd-selected-zone">{activeZoneMeta.label}</span>
                </div>
                <div className="cd-selected-body">
                  <div className="cd-selected-top">
                    <div>
                      <span className="cd-selected-type">{activeZoneMeta.elevation}</span>
                      <h3>{activeZoneMeta.label}</h3>
                    </div>
                  </div>
                  <p className="cd-selected-desc">
                    {loading
                      ? 'Loading homestays in the Chiang Dao valley...'
                      : activeZoneMeta.subtitle}
                  </p>
                  <button
                    type="button"
                    className="cd-selected-cta"
                    onClick={() => navigate('/hotels')}
                  >
                    <span>Browse All Stays</span>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Compact Switcher List of Chiang Dao Homestays */}
            <div className="cd-stay-list">
              <div className="cd-stay-list-head">
                <span>Homestays in View ({visiblePins.length})</span>
                <button type="button" onClick={() => navigate('/hotels?q=Chiang%20Dao')}>
                  See All
                </button>
              </div>
              <div className="cd-stay-list-items">
                {visiblePins.map(pin => {
                  const isSelected = selectedPin?.prop.id === pin.prop.id;
                  return (
                    <button
                      key={pin.prop.id}
                      type="button"
                      className={`cd-stay-row ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedId(pin.prop.id)}
                    >
                      <img src={pin.prop.imageUrl || '/doiluangbg.jpg'} alt="" />
                      <div className="cd-stay-row-info">
                        <strong>{pin.prop.name}</strong>
                        <span>{pin.zoneLabel}</span>
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
