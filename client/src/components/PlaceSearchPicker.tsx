import React, { useState, useEffect, useRef, useMemo } from 'react';
import { verifiedChiangDaoList } from '../data/chiangDaoData';
import { supabase } from '../utils/supabase';
import './PlaceSearchPicker.css';

export interface PlaceResult {
  id: string;
  name: string;
  subTitle?: string;
  category: 'property' | 'popular' | 'map' | 'custom';
  categoryLabel: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  propertyId?: string;
}

// Curated Popular Thai Travel Destinations & Attractions
const POPULAR_DESTINATIONS: PlaceResult[] = [
  {
    id: 'pop-1',
    name: 'ดอยหลวงเชียงดาว (Doi Luang Chiang Dao)',
    subTitle: 'อ.เชียงดาว, จ.เชียงใหม่ • จุดชมวิวยอดดอยและทะเลหมอก',
    category: 'popular',
    categoryLabel: '🏔️ ยอดดอย & ธรรมชาติ',
    lat: 19.3963,
    lng: 98.8928
  },
  {
    id: 'pop-2',
    name: 'บ้านนาเลาใหม่ เชียงดาว',
    subTitle: 'ต.เชียงดาว, อ.เชียงดาว, จ.เชียงใหม่ • หมู่บ้านโฮมสเตย์วิวดอยหลวง',
    category: 'popular',
    categoryLabel: '🏔️ ยอดดอย & ธรรมชาติ',
    lat: 19.4182,
    lng: 98.8890
  },
  {
    id: 'pop-3',
    name: 'เมืองคอง เชียงดาว (Muang Khong)',
    subTitle: 'ต.เมืองคอง, อ.เชียงดาว, จ.เชียงใหม่ • ชุมชนริมแม่น้ำคองและทุ่งนาเขียวขจี',
    category: 'popular',
    categoryLabel: '🏔️ ยอดดอย & ธรรมชาติ',
    lat: 19.3512,
    lng: 98.7183
  },
  {
    id: 'pop-4',
    name: 'ถ้ำเชียงดาว (Chiang Dao Cave)',
    subTitle: 'ต.เชียงดาว, อ.เชียงดาว, จ.เชียงใหม่ • ถ้ำหินงอกหินย้อยโบราณ',
    category: 'popular',
    categoryLabel: '📍 สถานที่ท่องเที่ยว',
    lat: 19.3951,
    lng: 98.9287
  },
  {
    id: 'pop-5',
    name: 'แม่กำปอง (Mae Kampong)',
    subTitle: 'อ.แม่ออน, จ.เชียงใหม่ • หมู่บ้านกลางหุบเขาและลำธาร',
    category: 'popular',
    categoryLabel: '🏔️ ยอดดอย & ธรรมชาติ',
    lat: 18.8653,
    lng: 99.3503
  },
  {
    id: 'pop-6',
    name: 'ม่อนแจ่ม (Mon Cham)',
    subTitle: 'อ.แม่ริม, จ.เชียงใหม่ • ทุ่งดอกไม้และจุดชมวิวทะเลหมอก',
    category: 'popular',
    categoryLabel: '🏔️ ยอดดอย & ธรรมชาติ',
    lat: 18.9355,
    lng: 98.8227
  },
  {
    id: 'pop-7',
    name: 'ดอยอินทนนท์ (Doi Inthanon)',
    subTitle: 'อ.จอมทอง, จ.เชียงใหม่ • ยอดเขาที่สูงที่สุดในประเทศไทย',
    category: 'popular',
    categoryLabel: '🏔️ ยอดดอย & ธรรมชาติ',
    lat: 18.5888,
    lng: 98.4871
  },
  {
    id: 'pop-8',
    name: 'ประตูท่าแพ เชียงใหม่ (Tha Phae Gate)',
    subTitle: 'อ.เมืองเชียงใหม่, จ.เชียงใหม่ • แลนด์มาร์กกำแพงเมืองเก่า',
    category: 'popular',
    categoryLabel: '🏛️ ตัวเมือง & วัฒนธรรม',
    lat: 18.7877,
    lng: 98.9931
  },
  {
    id: 'pop-9',
    name: 'ถนนนิมมานเหมินท์ เชียงใหม่ (Nimmanhaemin Road)',
    subTitle: 'อ.เมืองเชียงใหม่, จ.เชียงใหม่ • ย่านคาเฟ่ ช้อปปิ้ง และสตรีทฟู้ด',
    category: 'popular',
    categoryLabel: '☕ คาเฟ่ & ช้อปปิ้ง',
    lat: 18.7968,
    lng: 98.9691
  },
  {
    id: 'pop-10',
    name: 'ปาย (Pai)',
    subTitle: 'อ.ปาย, จ.แม่ฮ่องสอน • เมืองแห่งสายหมอกและวิถีชีวิตสโลว์ไลฟ์',
    category: 'popular',
    categoryLabel: '🏔️ ยอดดอย & ธรรมชาติ',
    lat: 19.3582,
    lng: 98.4405
  },
  {
    id: 'pop-11',
    name: 'ปางอุ๋ง (Pang Oung)',
    subTitle: 'อ.เมืองแม่ฮ่องสอน, จ.แม่ฮ่องสอน • อ่างเก็บน้ำกลางป่าสนสวิตเซอร์แลนด์เมืองไทย',
    category: 'popular',
    categoryLabel: '🏔️ ยอดดอย & ธรรมชาติ',
    lat: 19.5002,
    lng: 97.9100
  },
  {
    id: 'pop-12',
    name: 'ดอยเสมอดาว (Doi Samer Dao)',
    subTitle: 'อุทยานแห่งชาติศรีน่าน, จ.น่าน • จุดชมวิวทะเลหมอกและกางเต็นท์ดูดาว',
    category: 'popular',
    categoryLabel: '🏔️ ยอดดอย & ธรรมชาติ',
    lat: 18.3742,
    lng: 100.8290
  },
  {
    id: 'pop-13',
    name: 'สะปัน (Sapan)',
    subTitle: 'อ.บ่อเกลือ, จ.น่าน • หมู่บ้านโอโซนบริสุทธิ์กลางหุบเขา',
    category: 'popular',
    categoryLabel: '🏔️ ยอดดอย & ธรรมชาติ',
    lat: 19.1918,
    lng: 101.1969
  },
  {
    id: 'pop-14',
    name: 'ภูทับเบิก (Phu Thap Boek)',
    subTitle: 'อ.หล่มเก่า, จ.เพชรบูรณ์ • แปลงกะหล่ำปลีและทะเลหมอก 360 องศา',
    category: 'popular',
    categoryLabel: '🏔️ ยอดดอย & ธรรมชาติ',
    lat: 16.9022,
    lng: 101.1042
  },
  {
    id: 'pop-15',
    name: 'เขาใหญ่ (Khao Yai)',
    subTitle: 'อ.ปากช่อง, จ.นครราชสีมา • ผืนป่ามรดกโลกและธรรมชาติสมบูรณ์',
    category: 'popular',
    categoryLabel: '🏔️ ยอดดอย & ธรรมชาติ',
    lat: 14.4392,
    lng: 101.3723
  },
  {
    id: 'pop-16',
    name: 'สังขละบุรี (Sangkhla Buri)',
    subTitle: 'อ.สังขละบุรี, จ.กาญจนบุรี • สะพานไม้มอญและวัฒนธรรมสองฝั่งน้ำ',
    category: 'popular',
    categoryLabel: '🏛️ วัฒนธรรม & ประวัติศาสตร์',
    lat: 15.1554,
    lng: 98.4526
  }
];

interface PlaceSearchPickerProps {
  value: string;
  coordinates: { lat: number; lng: number } | null;
  onChange: (locationTag: string, coordinates: { lat: number; lng: number } | null, propertyId?: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;
}

export const PlaceSearchPicker: React.FC<PlaceSearchPickerProps> = ({
  value,
  coordinates,
  onChange,
  inputRef: externalInputRef,
  placeholder = 'เพิ่มสถานที่...'
}) => {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [onlineResults, setOnlineResults] = useState<PlaceResult[]>([]);
  const [dbProperties, setDbProperties] = useState<PlaceResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  // Sync external value with query state
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Load database properties and combine with static Chiang Dao data
  useEffect(() => {
    const loadProperties = async () => {
      try {
        // Base from static verified list
        const staticList: PlaceResult[] = verifiedChiangDaoList.map(h => ({
          id: `prop-${h.id}`,
          name: h.nameTh || h.name,
          subTitle: `${h.district ? `${h.district}, ` : ''}${h.province || 'เชียงใหม่'} • โฮมสเตย์พร้อมวิวธรรมชาติ`,
          category: 'property',
          categoryLabel: '🏡 ที่พักใน Pakjai',
          lat: 19.4180 + (Math.random() * 0.04 - 0.02),
          lng: 98.8890 + (Math.random() * 0.04 - 0.02),
          imageUrl: h.imageUrl,
          propertyId: h.id
        }));

        // Fetch from Supabase
        const { data } = await supabase
          .from('properties')
          .select('id, name, name_th, district, province, image_url, location')
          .limit(100);

        if (data && data.length > 0) {
          const supabaseList: PlaceResult[] = (data as any[]).map(p => ({
            id: `sb-${p.id}`,
            name: p.name_th || p.name,
            subTitle: `${p.district ? `${p.district}, ` : ''}${p.province || p.location || 'เชียงใหม่'} • ที่พักที่ได้รับการรับรอง`,
            category: 'property',
            categoryLabel: '🏡 ที่พักใน Pakjai',
            lat: 19.4180,
            lng: 98.8890,
            imageUrl: p.image_url,
            propertyId: p.id
          }));

          // Deduplicate by name
          const map = new Map<string, PlaceResult>();
          [...staticList, ...supabaseList].forEach(item => {
            if (!map.has(item.name.toLowerCase())) {
              map.set(item.name.toLowerCase(), item);
            }
          });
          setDbProperties(Array.from(map.values()));
        } else {
          setDbProperties(staticList);
        }
      } catch (err) {
        console.warn('Could not load properties for search:', err);
      }
    };

    loadProperties();
  }, []);

  // Filter local properties and popular spots
  const filteredLocalResults = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      // Show top curated spots when query is empty
      return POPULAR_DESTINATIONS.slice(0, 6);
    }

    const matchedProps = dbProperties.filter(p =>
      p.name.toLowerCase().includes(cleanQuery) ||
      (p.subTitle && p.subTitle.toLowerCase().includes(cleanQuery))
    ).slice(0, 4);

    const matchedPopular = POPULAR_DESTINATIONS.filter(p =>
      p.name.toLowerCase().includes(cleanQuery) ||
      (p.subTitle && p.subTitle.toLowerCase().includes(cleanQuery))
    ).slice(0, 4);

    return [...matchedProps, ...matchedPopular];
  }, [query, dbProperties]);

  // Online Geocoding Search (Nominatim OpenStreetMap + Photon fallback)
  useEffect(() => {
    const cleanQuery = query.trim();
    if (!cleanQuery || cleanQuery.length < 2) {
      setOnlineResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        // Try OpenStreetMap Nominatim with Thailand focus
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&countrycodes=th&limit=5&addressdetails=1`;
        const res = await fetch(nominatimUrl, {
          headers: {
            'Accept-Language': 'th,en;q=0.8'
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: PlaceResult[] = data.map((item: any) => {
              const displayName = item.display_name || '';
              const parts = displayName.split(',').map((s: string) => s.trim());
              const title = parts[0] || item.name || cleanQuery;
              const sub = parts.slice(1, 4).join(', ');

              return {
                id: `osm-${item.place_id || Math.random()}`,
                name: title,
                subTitle: sub || 'ประเทศไทย',
                category: 'map',
                categoryLabel: '🗺️ แผนที่และสถานที่ตั้ง',
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
              };
            });

            // Filter out exact duplicates that exist in local results
            const localNames = new Set(filteredLocalResults.map(r => r.name.toLowerCase()));
            const uniqueOnline = mapped.filter(m => !localNames.has(m.name.toLowerCase()));

            setOnlineResults(uniqueOnline);
            setIsLoading(false);
            return;
          }
        }

        // Fallback to Photon Komoot API if Nominatim returns empty or throttled
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=5&lang=th`;
        const pRes = await fetch(photonUrl);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.features && pData.features.length > 0) {
            const pMapped: PlaceResult[] = pData.features.map((f: any, idx: number) => {
              const props = f.properties || {};
              const title = props.name || cleanQuery;
              const sub = [props.district, props.city, props.state, props.country].filter(Boolean).join(', ');
              const coords = f.geometry?.coordinates || [0, 0];

              return {
                id: `photon-${idx}-${Math.random()}`,
                name: title,
                subTitle: sub || 'สถานที่ตั้ง',
                category: 'map',
                categoryLabel: '🗺️ แผนที่และสถานที่ตั้ง',
                lat: coords[1],
                lng: coords[0]
              };
            });

            const localNames = new Set(filteredLocalResults.map(r => r.name.toLowerCase()));
            setOnlineResults(pMapped.filter(m => !localNames.has(m.name.toLowerCase())));
          } else {
            setOnlineResults([]);
          }
        }
      } catch (err) {
        console.warn('Geocoding search warning:', err);
        setOnlineResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query, filteredLocalResults]);

  // Combine all items for rendering and keyboard navigation
  const allResults = useMemo(() => {
    const list = [...filteredLocalResults, ...onlineResults];
    const cleanQuery = query.trim();

    // If user has typed something that isn't an exact match, add "Custom Place" option
    if (cleanQuery && !list.some(item => item.name.toLowerCase() === cleanQuery.toLowerCase())) {
      list.push({
        id: 'custom-input',
        name: cleanQuery,
        subTitle: 'ใช้ชื่อสถานที่นี้โดยตรง',
        category: 'custom',
        categoryLabel: '✏️ สถานที่ที่กำหนดเอง'
      });
    }

    return list;
  }, [filteredLocalResults, onlineResults, query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPlace = (place: PlaceResult) => {
    setQuery(place.name);
    setIsOpen(false);
    const coords = (place.lat && place.lng) ? { lat: place.lat, lng: place.lng } : null;
    onChange(place.name, coords, place.propertyId);
  };

  const handleClear = () => {
    setQuery('');
    onChange('', null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < allResults.length) {
        handleSelectPlace(allResults[selectedIndex]);
      } else if (query.trim()) {
        handleSelectPlace({
          id: 'custom-enter',
          name: query.trim(),
          category: 'custom',
          categoryLabel: '✏️ สถานที่ที่กำหนดเอง'
        });
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="place-search-container" ref={containerRef}>
      <div className={`place-search-input-wrapper ${isOpen ? 'focused' : ''} ${value ? 'has-value' : ''}`}>
        <span className="place-pin-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#ef4444">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="text"
          className="place-search-input"
          placeholder={placeholder}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
            if (!e.target.value.trim()) {
              onChange('', null);
            }
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {isLoading && (
          <div className="place-search-spinner" title="กำลังค้นหา..." />
        )}

        {query && (
          <button
            type="button"
            className="place-clear-btn"
            onClick={handleClear}
            title="ลบสถานที่"
            aria-label="ลบสถานที่"
          >
            &times;
          </button>
        )}
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div className="place-dropdown-menu animate-fade-in">
          <div className="place-dropdown-header">
            <span>{!query.trim() ? '✨ สถานที่ยอดนิยม' : '🔍 ผลการค้นหาสถานที่'}</span>
            <span className="place-dropdown-hint">กด Enter หรือคลิกเพื่อเลือก</span>
          </div>

          <div className="place-dropdown-list">
            {allResults.length > 0 ? (
              allResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    className={`place-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectPlace(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="place-item-icon-wrapper">
                      {item.category === 'property' ? (
                        <span className="place-badge-emoji">🏡</span>
                      ) : item.category === 'popular' ? (
                        <span className="place-badge-emoji">📍</span>
                      ) : item.category === 'map' ? (
                        <span className="place-badge-emoji">🗺️</span>
                      ) : (
                        <span className="place-badge-emoji">✏️</span>
                      )}
                    </div>

                    <div className="place-item-info">
                      <div className="place-item-title-row">
                        <span className="place-item-name">{item.name}</span>
                        <span className={`place-item-badge badge-${item.category}`}>
                          {item.categoryLabel}
                        </span>
                      </div>
                      {item.subTitle && (
                        <span className="place-item-subtitle">{item.subTitle}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="place-empty-state">
                {isLoading ? (
                  <span>กำลังค้นหาสถานที่...</span>
                ) : (
                  <div>
                    <p>ไม่พบสถานที่ตามที่ค้นหา</p>
                    <button
                      type="button"
                      className="place-use-custom-btn"
                      onClick={() =>
                        handleSelectPlace({
                          id: 'custom-btn',
                          name: query.trim(),
                          category: 'custom',
                          categoryLabel: '✏️ สถานที่ที่กำหนดเอง'
                        })
                      }
                    >
                      ใช้ชื่อ "{query.trim()}" เป็นสถานที่เช็คอิน
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mini Interactive Map Preview when Location & Coordinates Selected */}
      {value && coordinates && (
        <div className="place-map-preview-card animate-fade-in">
          <div className="place-map-preview-header">
            <div className="place-map-info">
              <span className="place-map-title">📍 {value}</span>
              <span className="place-map-coords">
                พิกัด: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="place-map-link"
              title="เปิดใน Google Maps"
            >
              เปิดแผนที่ ↗
            </a>
          </div>

          <div className="place-map-iframe-container">
            <iframe
              title={`Map of ${value}`}
              width="100%"
              height="150"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng - 0.015}%2C${coordinates.lat - 0.015}%2C${coordinates.lng + 0.015}%2C${coordinates.lat + 0.015}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lng}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceSearchPicker;
