import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Map as MLMap, Marker as MLMarker, StyleSpecification } from 'maplibre-gl';
import { type Property } from '../types';
import { CHIANG_DAO_ATLAS_STAYS, type ChiangDaoZoneId } from '../utils/chiangDaoStays';
import { useSavedStays } from '../hooks/useSavedStays';
import './ChiangDaoArtMap.css';

interface ChiangDaoArtMapProps {
  properties: Property[];
  loading?: boolean;
}

type ZoneFilterId = 'all' | ChiangDaoZoneId;
type ViewMode = 'map' | 'illustrated';
type MapLibreModule = typeof import('maplibre-gl');

interface ZoneMeta {
  id: ZoneFilterId;
  label: string;
  camera: { center: [number, number]; zoom: number };
  artLabelPos?: { x: number; y: number };
  artFocus: { x: number; y: number; zoom: number };
}

const ZONES: ZoneMeta[] = [
  { id: 'all', label: 'All areas', camera: { center: [98.86, 19.37], zoom: 11.2 }, artFocus: { x: 50, y: 50, zoom: 1 } },
  { id: 'nalao', label: 'Ban Na Lao Mai', camera: { center: [98.8672, 19.3712], zoom: 14.6 }, artLabelPos: { x: 23, y: 26 }, artFocus: { x: 23, y: 36, zoom: 2.1 } },
  { id: 'muangkong', label: 'Muang Kong', camera: { center: [98.7095, 19.3832], zoom: 14 }, artLabelPos: { x: 14, y: 66 }, artFocus: { x: 14, y: 77, zoom: 2.2 } },
  { id: 'maemae', label: 'Ban Mae Mae', camera: { center: [98.8878, 19.3228], zoom: 14.6 }, artLabelPos: { x: 84, y: 12 }, artFocus: { x: 84, y: 27, zoom: 2.1 } },
  { id: 'tham', label: 'Ban Tham', camera: { center: [98.9272, 19.3925], zoom: 14.2 }, artLabelPos: { x: 55, y: 42 }, artFocus: { x: 56, y: 60, zoom: 2.1 } },
  { id: 'town', label: 'Town & Riverside', camera: { center: [98.9665, 19.3642], zoom: 14 }, artLabelPos: { x: 74, y: 92 }, artFocus: { x: 75, y: 76, zoom: 2.1 } },
];

const PITCH_3D = 55;
const TERRAIN = { source: 'terrainDem', exaggeration: 1.5 };
const DEM_TILES = ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'];

const buildMapStyle = (): StyleSpecification => ({
  version: 8,
  sources: {
    base: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
    terrainDem: { type: 'raster-dem', tiles: DEM_TILES, encoding: 'terrarium', tileSize: 256, maxzoom: 14 },
    hillshadeDem: { type: 'raster-dem', tiles: DEM_TILES, encoding: 'terrarium', tileSize: 256, maxzoom: 14 },
  },
  layers: [
    { id: 'base', type: 'raster', source: 'base' },
    {
      id: 'hillshade',
      type: 'hillshade',
      source: 'hillshadeDem',
      layout: { visibility: 'none' },
      paint: {
        'hillshade-shadow-color': '#28463A',
        'hillshade-highlight-color': '#FFF8EE',
        'hillshade-exaggeration': 0.28,
      },
    },
  ],
  sky: {
    'sky-color': '#DCE9E2',
    'horizon-color': '#F5EFE5',
    'fog-color': '#EEF4EE',
    'sky-horizon-blend': 0.5,
    'horizon-fog-blend': 0.6,
    'fog-ground-blend': 0.2,
  },
});

const MIN_ART_ZOOM = 1;
const MAX_ART_ZOOM = 2.8;
const clampPan = (val: number, zoom: number) => Math.min(0, Math.max(100 - 100 * zoom, val));

const ZONE_ART_DEFAULTS: Record<ChiangDaoZoneId, { x: number; y: number }> = {
  nalao: { x: 24, y: 44 },
  muangkong: { x: 18, y: 74 },
  maemae: { x: 64, y: 48 },
  tham: { x: 52, y: 72 },
  town: { x: 84, y: 82 },
};

const inferZone = (prop: Property, index: number): ChiangDaoZoneId => {
  const hay = `${prop.name || ''} ${prop.location || ''} ${prop.district || ''} ${prop.description || ''}`.toLowerCase();
  if (hay.includes('na lao') || hay.includes('นาเลา')) return 'nalao';
  if (hay.includes('muang kong') || hay.includes('เมืองคอง')) return 'muangkong';
  if (hay.includes('mae mae') || hay.includes('แม่แมะ')) return 'maemae';
  if (hay.includes('tham') || hay.includes('ถ้ำ')) return 'tham';
  if (hay.includes('town') || hay.includes('ping') || hay.includes('ปิง')) return 'town';
  const cycle: ChiangDaoZoneId[] = ['tham', 'nalao', 'town', 'maemae', 'muangkong'];
  return cycle[index % cycle.length];
};

const splitName = (fullName: string) => {
  const match = fullName.match(/^([^(]+)\(([^)]+)\)/);
  return match ? { primary: match[1].trim(), secondary: match[2].trim() } : { primary: fullName, secondary: '' };
};

const formatPrice = (prop: Property) =>
  `฿${Number(prop.pricePerNight ?? prop.price_per_night ?? prop.price ?? 0).toLocaleString()}`;

interface MappedStay {
  prop: Property;
  zoneId: ChiangDaoZoneId;
  zoneLabel: string;
  lat: number;
  lng: number;
  artX: number;
  artY: number;
}

export const ChiangDaoArtMap: React.FC<ChiangDaoArtMapProps> = ({ properties }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isSaved, toggleSaved } = useSavedStays();
  const [activeZone, setActiveZone] = useState<ZoneFilterId>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [is3D, setIs3D] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getZoneLabel = useCallback((id: ZoneFilterId) => t(`chiangDaoMap.zones.${id}`), [t]);
  const getPriceUnit = useCallback(
    (prop: Property) => (prop.price_type === 'per_person' ? t('chiangDaoMap.perPerson') : t('chiangDaoMap.perNight')),
    [t]
  );

  // MapLibre map
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const mlRef = useRef<MapLibreModule | null>(null);
  const markersRef = useRef<MLMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Illustrated map pan / zoom / pinch
  const [artZoom, setArtZoom] = useState(1);
  const [artPan, setArtPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const artStateRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ dist: number; zoom: number; panX: number; panY: number; midX: number; midY: number } | null>(null);

  useEffect(() => {
    artStateRef.current = { zoom: artZoom, panX: artPan.x, panY: artPan.y };
  }, [artZoom, artPan]);

  // ── Data: live Supabase stays + curated Chiang Dao directory ──
  const allStays = useMemo<MappedStay[]>(() => {
    const live = properties.filter(p => {
      const text = `${p.district || ''} ${p.location || ''} ${p.province || ''} ${p.name || ''}`.toLowerCase();
      return text.includes('chiang dao') || text.includes('เชียงดาว') || properties.length <= 6;
    });

    const seen = new Set<string>();
    const combined: MappedStay[] = [];

    live.forEach((p, idx) => {
      seen.add((p.name || '').trim().toLowerCase());
      const zoneId = inferZone(p, idx);
      const zone = ZONES.find(z => z.id === zoneId)!;
      const art = ZONE_ART_DEFAULTS[zoneId];
      combined.push({
        prop: p,
        zoneId,
        zoneLabel: zone.label,
        lat: Number((p as any).lat) || zone.camera.center[1] + ((idx % 3) - 1) * 0.004,
        lng: Number((p as any).lng) || zone.camera.center[0] + (Math.floor(idx / 3) - 0.5) * 0.004,
        artX: Math.min(88, Math.max(14, art.x + ((idx % 3) - 1) * 4)),
        artY: Math.min(86, Math.max(22, art.y + (Math.floor(idx / 3) - 0.5) * 4)),
      });
    });

    CHIANG_DAO_ATLAS_STAYS.forEach(stay => {
      const key = stay.name.trim().toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      combined.push({
        prop: stay,
        zoneId: stay.zoneId,
        zoneLabel: stay.zoneLabel,
        lat: stay.lat,
        lng: stay.lng,
        artX: stay.artX,
        artY: stay.artY,
      });
    });

    return combined;
  }, [properties]);

  const visibleStays = useMemo(() => {
    const byZone = activeZone === 'all' ? allStays : allStays.filter(s => s.zoneId === activeZone);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byZone;
    return byZone.filter(s => {
      const zoneTh = getZoneLabel(s.zoneId).toLowerCase();
      return (
        s.prop.name.toLowerCase().includes(q) ||
        s.zoneLabel.toLowerCase().includes(q) ||
        zoneTh.includes(q)
      );
    });
  }, [allStays, activeZone, searchQuery, getZoneLabel]);

  const selectedStay = useMemo(() => allStays.find(s => s.prop.id === selectedId) || null, [allStays, selectedId]);
  const activeZoneMeta = ZONES.find(z => z.id === activeZone) || ZONES[0];

  // Close the preview if its stay is filtered out
  useEffect(() => {
    if (selectedId && !visibleStays.some(s => s.prop.id === selectedId)) setSelectedId(null);
  }, [visibleStays, selectedId]);

  // Esc closes the preview
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Illustrated map helpers ──
  const focusArtPoint = useCallback((x: number, y: number, zoom: number) => {
    const z = Math.min(MAX_ART_ZOOM, Math.max(MIN_ART_ZOOM, zoom));
    setArtZoom(z);
    setArtPan({ x: clampPan(50 - x * z, z), y: clampPan(50 - y * z, z) });
  }, []);

  const stepArtZoom = (delta: number) => {
    const next = Number(Math.min(MAX_ART_ZOOM, Math.max(MIN_ART_ZOOM, artZoom + delta)).toFixed(2));
    const cx = (50 - artPan.x) / artZoom;
    const cy = (50 - artPan.y) / artZoom;
    setArtZoom(next);
    setArtPan({ x: clampPan(50 - cx * next, next), y: clampPan(50 - cy * next, next) });
  };

  // Mouse-wheel & trackpad pinch zoom on the illustrated map (zooms toward cursor)
  useEffect(() => {
    if (viewMode !== 'illustrated') return;
    const stage = stageRef.current;
    if (!stage) return;
    let wheelTimer: number | undefined;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      const cursorX = ((e.clientX - rect.left) / rect.width) * 100;
      const cursorY = ((e.clientY - rect.top) / rect.height) * 100;

      const { zoom, panX, panY } = artStateRef.current;
      const factor = e.ctrlKey ? -e.deltaY * 0.01 : -e.deltaY * 0.0022;
      const nextZoom = Number(Math.min(MAX_ART_ZOOM, Math.max(MIN_ART_ZOOM, zoom * (1 + factor))).toFixed(3));
      if (nextZoom === zoom) return;

      const mapX = (cursorX - panX) / zoom;
      const mapY = (cursorY - panY) / zoom;
      const nextPanX = clampPan(cursorX - mapX * nextZoom, nextZoom);
      const nextPanY = clampPan(cursorY - mapY * nextZoom, nextZoom);

      artStateRef.current = { zoom: nextZoom, panX: nextPanX, panY: nextPanY };
      setIsDragging(true);
      setArtZoom(nextZoom);
      setArtPan({ x: nextPanX, y: nextPanY });
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => setIsDragging(false), 120);
    };

    stage.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.clearTimeout(wheelTimer);
      stage.removeEventListener('wheel', handleWheel);
    };
  }, [viewMode]);

  const onStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const rect = stageRef.current?.getBoundingClientRect();
      if (rect && dist > 0) {
        const midX = (((pts[0].x + pts[1].x) / 2 - rect.left) / rect.width) * 100;
        const midY = (((pts[0].y + pts[1].y) / 2 - rect.top) / rect.height) * 100;
        pinchStartRef.current = { dist, zoom: artZoom, panX: artPan.x, panY: artPan.y, midX, midY };
        dragStartRef.current = null;
        setIsDragging(true);
      }
      return;
    }

    if (e.button === 0 && artZoom > 1.01) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY, panX: artPan.x, panY: artPan.y };
    }
  };

  const onStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Two-finger pinch zoom
    const pinch = pinchStartRef.current;
    if (pinch && activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const nextZoom = Number(Math.min(MAX_ART_ZOOM, Math.max(MIN_ART_ZOOM, pinch.zoom * (dist / pinch.dist))).toFixed(3));
      const mapX = (pinch.midX - pinch.panX) / pinch.zoom;
      const mapY = (pinch.midY - pinch.panY) / pinch.zoom;
      setArtZoom(nextZoom);
      setArtPan({
        x: clampPan(pinch.midX - mapX * nextZoom, nextZoom),
        y: clampPan(pinch.midY - mapY * nextZoom, nextZoom),
      });
      return;
    }

    // Single-finger / mouse grab-hand pan
    const start = dragStartRef.current;
    if (!start) return;
    const rect = stage.getBoundingClientRect();
    setArtPan({
      x: clampPan(start.panX + ((e.clientX - start.x) / rect.width) * 100, artZoom),
      y: clampPan(start.panY + ((e.clientY - start.y) / rect.height) * 100, artZoom),
    });
  };

  const onStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) pinchStartRef.current = null;
    if (activePointersRef.current.size === 0) {
      dragStartRef.current = null;
      setIsDragging(false);
    }
  };

  const onStageDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    const mapX = (clickX - artPan.x) / artZoom;
    const mapY = (clickY - artPan.y) / artZoom;
    const nextZoom = artZoom < 1.9 ? 2.1 : MIN_ART_ZOOM;
    focusArtPoint(mapX, mapY, nextZoom);
  };

  const resetArtView = () => {
    setActiveZone('all');
    setSelectedId(null);
    focusArtPoint(50, 50, MIN_ART_ZOOM);
  };

  // ── Selection actions (shared by list, pins, clusters) ──
  const selectZone = useCallback(
    (zoneId: ZoneFilterId) => {
      setActiveZone(zoneId);
      const meta = ZONES.find(z => z.id === zoneId) || ZONES[0];
      focusArtPoint(meta.artFocus.x, meta.artFocus.y, meta.artFocus.zoom);
    },
    [focusArtPoint]
  );

  const selectStay = useCallback(
    (stay: MappedStay) => {
      setSelectedId(stay.prop.id);
      if (viewMode === 'illustrated') {
        focusArtPoint(stay.artX, stay.artY, Math.max(artZoom, 2.1));
      } else if (mapRef.current) {
        mapRef.current.easeTo({
          center: [stay.lng, stay.lat],
          zoom: Math.max(mapRef.current.getZoom(), 14.2),
          duration: 800,
        });
      }
    },
    [viewMode, artZoom, focusArtPoint]
  );

  // ── 3D map: lazy-load MapLibre only when the map view is shown ──
  useEffect(() => {
    if (viewMode !== 'map') return;
    let cancelled = false;
    let map: MLMap | null = null;

    (async () => {
      const ml = await import('maplibre-gl');
      await import('maplibre-gl/dist/maplibre-gl.css');
      if (cancelled || !mapContainerRef.current) return;

      mlRef.current = ml;
      const zone = ZONES.find(z => z.id === activeZone) || ZONES[0];
      map = new ml.Map({
        container: mapContainerRef.current,
        style: buildMapStyle(),
        center: zone.camera.center,
        zoom: zone.camera.zoom,
        pitch: is3D ? PITCH_3D : 0,
        bearing: is3D ? -15 : 0,
        maxPitch: 70,
        minZoom: 9.5,
        maxZoom: 17,
        attributionControl: { compact: true },
      });

      // Enable smooth mouse-wheel zoom, grab-hand drag pan, and touch pinch gestures
      map.scrollZoom.enable();
      map.dragPan.enable();
      map.touchZoomRotate.enable();
      map.addControl(new ml.NavigationControl({ visualizePitch: true }), 'bottom-right');

      map.on('load', () => {
        if (!cancelled) setMapReady(true);
      });
      map.on('click', () => setSelectedId(null));

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // Fly to the chosen area
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.flyTo({ center: activeZoneMeta.camera.center, zoom: activeZoneMeta.camera.zoom, duration: 900, essential: true });
  }, [activeZoneMeta, mapReady]);

  // 3D on/off
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer('hillshade')) {
      map.setLayoutProperty('hillshade', 'visibility', is3D ? 'visible' : 'none');
    }
    map.setTerrain(is3D ? TERRAIN : null);
    map.easeTo({ pitch: is3D ? PITCH_3D : 0, bearing: is3D ? -15 : 0, duration: 600 });
  }, [is3D, mapReady]);

  // Agoda-style price pins: always visible so users can scan prices & locations immediately
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (!map || !ml || !mapReady) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    visibleStays.forEach(stay => {
      const isActive = stay.prop.id === selectedId;
      const isHovered = stay.prop.id === hoveredId;
      const { primary } = splitName(stay.prop.name);
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `cd-pin cd-map-pin${isActive ? ' is-active' : ''}${isHovered ? ' is-hovered' : ''}`;
      el.setAttribute('aria-label', `${primary}, ${formatPrice(stay.prop)}`);

      if (isActive || isHovered) {
        el.style.zIndex = '20';
        const tip = document.createElement('span');
        tip.className = 'cd-pin-tip';
        tip.textContent = `${primary} · ★ ${stay.prop.rating || 4.8}`;
        el.appendChild(tip);
      }

      const priceNode = document.createElement('span');
      priceNode.textContent = formatPrice(stay.prop);
      el.appendChild(priceNode);

      el.addEventListener('mouseenter', () => setHoveredId(stay.prop.id));
      el.addEventListener('mouseleave', () => setHoveredId(prev => (prev === stay.prop.id ? null : prev)));
      el.addEventListener('click', e => {
        e.stopPropagation();
        selectStay(stay);
      });
      markersRef.current.push(new ml.Marker({ element: el, anchor: 'bottom' }).setLngLat([stay.lng, stay.lat]).addTo(map));
    });
  }, [mapReady, visibleStays, selectedId, hoveredId, selectStay]);

  return (
    <section className="cd-map-section" aria-label={`${t('chiangDaoMap.titlePrefix')} ${t('chiangDaoMap.titlePlace')}`}>
      <div className="container">
        <div className="cd-map-header">
          <h2 className="section-heading">
            {t('chiangDaoMap.titlePrefix')} <em>{t('chiangDaoMap.titlePlace')}</em>
          </h2>
          <p className="section-subheading">{t('chiangDaoMap.subtitle')}</p>
        </div>

        <div className="cd-zone-chips" role="tablist" aria-label={t('chiangDaoMap.areasLabel')}>
          {ZONES.map(zone => (
            <button
              key={zone.id}
              type="button"
              role="tab"
              aria-selected={activeZone === zone.id}
              className={`cd-zone-chip ${activeZone === zone.id ? 'active' : ''}`}
              onClick={() => selectZone(zone.id)}
            >
              {getZoneLabel(zone.id)}
            </button>
          ))}
        </div>

        <div className="cd-map-layout">
          {/* ── Left: map ── */}
          <div className="cd-map-stage">
            <div className="cd-map-controls">
              <div className="cd-segmented" role="group" aria-label={t('chiangDaoMap.mapStyleLabel')}>
                <button type="button" className={viewMode === 'map' ? 'active' : ''} onClick={() => setViewMode('map')}>
                  {t('chiangDaoMap.modeMap')}
                </button>
                <button
                  type="button"
                  className={viewMode === 'illustrated' ? 'active' : ''}
                  onClick={() => setViewMode('illustrated')}
                >
                  {t('chiangDaoMap.modeIllustrated')}
                </button>
              </div>

              {viewMode === 'map' && (
                <button
                  type="button"
                  className={`cd-toggle ${is3D ? 'active' : ''}`}
                  aria-pressed={is3D}
                  onClick={() => setIs3D(v => !v)}
                >
                  {t('chiangDaoMap.mode3D')}
                </button>
              )}
            </div>

            {viewMode === 'map' ? (
              <div ref={mapContainerRef} className="cd-map-canvas" />
            ) : (
              <div
                ref={stageRef}
                className={`cd-art-stage ${artZoom > 1.01 ? 'can-pan' : ''} ${isDragging ? 'is-dragging' : ''}`}
                onPointerDown={onStagePointerDown}
                onPointerMove={onStagePointerMove}
                onPointerUp={onStagePointerUp}
                onPointerCancel={onStagePointerUp}
                onDoubleClick={onStageDoubleClick}
                onClick={e => {
                  if (!(e.target as HTMLElement).closest('button')) setSelectedId(null);
                }}
              >
                <div
                  className={`cd-art-viewport ${isDragging ? 'no-transition' : ''}`}
                  style={{ transform: `translate3d(${artPan.x}%, ${artPan.y}%, 0) scale(${artZoom})` }}
                >
                  <img src="/chiangdao-art-map.jpg" alt={t('chiangDaoMap.modeIllustrated')} className="cd-art-img" draggable={false} />

                  {/* Subtle crisp SVG cartographic layer (contours, drifting mist, scenic accents) */}
                  <svg className="cd-art-svg" viewBox="0 0 1000 562" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="cd-mist-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#FFFDF8" stopOpacity="0" />
                        <stop offset="50%" stopColor="#FFFDF8" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#FFFDF8" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <g fill="none" stroke="#2C4C3B" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="4 5">
                      <ellipse cx="220" cy="145" rx="145" ry="52" />
                      <ellipse cx="220" cy="145" rx="200" ry="78" />
                    </g>
                    <ellipse className="cd-art-mist cd-art-mist-1" cx="240" cy="162" rx="135" ry="14" fill="url(#cd-mist-grad)" />
                    <ellipse className="cd-art-mist cd-art-mist-2" cx="655" cy="185" rx="115" ry="12" fill="url(#cd-mist-grad)" />
                  </svg>

                  {/* Peak & River geographic landmarks */}
                  <div
                    className="cd-art-landmark cd-art-landmark-peak"
                    style={{ left: '20%', top: '8%', transform: `translate(-50%, -50%) scale(${1 / artZoom})` }}
                  >
                    <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M2 13L8 3l6 10H2z" />
                    </svg>
                    <span>{t('chiangDaoMap.doiLuangPeak')}</span>
                  </div>

                  <div
                    className="cd-art-landmark cd-art-landmark-river"
                    style={{ left: '89%', top: '69%', transform: `translate(-50%, -50%) scale(${1 / artZoom})` }}
                  >
                    <span>{t('chiangDaoMap.maePingRiver')}</span>
                  </div>

                  {ZONES.filter(z => z.artLabelPos).map(zone => {
                    const count = allStays.filter(s => s.zoneId === zone.id).length;
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        className={`cd-art-label ${activeZone === zone.id ? 'active' : ''}`}
                        style={{
                          left: `${zone.artLabelPos!.x}%`,
                          top: `${zone.artLabelPos!.y}%`,
                          transform: `translate(-50%, -50%) scale(${1 / artZoom})`,
                        }}
                        onClick={() => selectZone(activeZone === zone.id ? 'all' : zone.id)}
                      >
                        <span>{getZoneLabel(zone.id)}</span>
                        <em>{count}</em>
                      </button>
                    );
                  })}

                  {visibleStays.map(stay => {
                    const isActive = stay.prop.id === selectedId;
                    const isHovered = stay.prop.id === hoveredId;
                    const { primary } = splitName(stay.prop.name);
                    return (
                      <button
                        key={stay.prop.id}
                        type="button"
                        className={`cd-pin cd-art-pin${isActive ? ' is-active' : ''}${isHovered ? ' is-hovered' : ''}`}
                        style={{
                          left: `${stay.artX}%`,
                          top: `${stay.artY}%`,
                          transform: `translate(-50%, -100%) scale(${1 / artZoom})`,
                        }}
                        onClick={() => selectStay(stay)}
                        onMouseEnter={() => setHoveredId(stay.prop.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        aria-label={`${primary}, ${formatPrice(stay.prop)}`}
                      >
                        {(isHovered || isActive) && (
                          <span className="cd-art-pin-tip">{primary}</span>
                        )}
                        {formatPrice(stay.prop)}
                      </button>
                    );
                  })}
                </div>

                {/* Minimal editorial compass rose */}
                <div className="cd-art-compass" aria-hidden="true">
                  <svg viewBox="0 0 36 36" width="32" height="32" fill="none">
                    <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
                    <path d="M18 5L20.5 16L18 18L15.5 16L18 5Z" fill="#C2704E" />
                    <path d="M18 31L20.5 20L18 18L15.5 20L18 31Z" fill="currentColor" fillOpacity="0.45" />
                    <circle cx="18" cy="18" r="1.6" fill="#2C4C3B" />
                  </svg>
                  <span>N</span>
                </div>

                <div className="cd-art-zoom" aria-label="Zoom">
                  <button type="button" onClick={() => stepArtZoom(0.55)} disabled={artZoom >= MAX_ART_ZOOM} aria-label={t('chiangDaoMap.zoomIn')}>
                    +
                  </button>
                  <button type="button" onClick={() => stepArtZoom(-0.55)} disabled={artZoom <= MIN_ART_ZOOM} aria-label={t('chiangDaoMap.zoomOut')}>
                    −
                  </button>
                  {artZoom > 1.05 && (
                    <button type="button" onClick={resetArtView} aria-label={t('chiangDaoMap.resetView')} title={t('chiangDaoMap.resetView')}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Preview card: appears only after the user picks a stay ── */}
            {selectedStay && (
              <div className="cd-preview" role="dialog" aria-label={splitName(selectedStay.prop.name).primary}>
                <button type="button" className="cd-preview-close" onClick={() => setSelectedId(null)} aria-label={t('chiangDaoMap.close')}>
                  ×
                </button>
                <img src={selectedStay.prop.imageUrl || '/doiluangbg.jpg'} alt="" />
                <div className="cd-preview-body">
                  <span className="cd-preview-meta">
                    {getZoneLabel(selectedStay.zoneId)} · ★ {selectedStay.prop.rating || 4.8}
                  </span>
                  <h3>{splitName(selectedStay.prop.name).primary}</h3>
                  <span className="cd-preview-price">
                    {formatPrice(selectedStay.prop)} <em>/ {getPriceUnit(selectedStay.prop)}</em>
                  </span>
                  <div className="cd-preview-actions">
                    <button type="button" className="cd-btn-primary" onClick={() => navigate(`/hotels/${selectedStay.prop.id}`)}>
                      {t('chiangDaoMap.viewStay')}
                    </button>
                    <a
                      className="cd-btn-secondary"
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedStay.lat},${selectedStay.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('chiangDaoMap.directions')}
                    </a>
                    <button
                      type="button"
                      className="cd-btn-secondary"
                      onClick={() => toggleSaved(selectedStay.prop.id)}
                      aria-label={t('airbnbCard.saveFavorite')}
                      aria-pressed={isSaved(selectedStay.prop.id)}
                      style={{ flex: '0 0 auto', padding: '8px 10px', color: isSaved(selectedStay.prop.id) ? '#C2704E' : '#2C4C3B' }}
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill={isSaved(selectedStay.prop.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Agoda-style stay list with search ── */}
          <aside className="cd-list" aria-label={t('chiangDaoMap.areasLabel')}>
            <div className="cd-list-head">
              <span>
                {t('chiangDaoMap.staysInArea', { count: visibleStays.length, area: getZoneLabel(activeZoneMeta.id) })}
              </span>
              <button type="button" onClick={() => navigate('/hotels?q=Chiang%20Dao')}>
                {t('chiangDaoMap.seeAll')}
              </button>
            </div>

            <div className="cd-list-search">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <circle cx="11" cy="11" r="7.5" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('chiangDaoMap.searchPlaceholder')}
                aria-label={t('chiangDaoMap.searchPlaceholder')}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} aria-label={t('chiangDaoMap.close')}>
                  ×
                </button>
              )}
            </div>

            <ul className="cd-list-items">
              {visibleStays.map(stay => {
                const { primary } = splitName(stay.prop.name);
                const isActive = stay.prop.id === selectedId;
                return (
                  <li key={stay.prop.id}>
                    <button
                      type="button"
                      className={`cd-list-card ${isActive ? 'active' : ''}`}
                      onClick={() => selectStay(stay)}
                      onMouseEnter={() => setHoveredId(stay.prop.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onFocus={() => setHoveredId(stay.prop.id)}
                      onBlur={() => setHoveredId(null)}
                    >
                      <img src={stay.prop.imageUrl || '/doiluangbg.jpg'} alt="" loading="lazy" />
                      <span className="cd-list-info">
                        <strong>{primary}</strong>
                        <span className="cd-list-meta">
                          {getZoneLabel(stay.zoneId)} · ★ {stay.prop.rating || 4.8}
                        </span>
                        <span className="cd-list-price">
                          {formatPrice(stay.prop)} <em>/ {getPriceUnit(stay.prop)}</em>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default ChiangDaoArtMap;
