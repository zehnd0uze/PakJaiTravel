import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import { useSavedStays } from '../hooks/useSavedStays';
import { CHIANG_DAO_ATLAS_STAYS } from '../utils/chiangDaoStays';
import { getStayPracticalInfo } from '../utils/stayPracticalInfo';
import './SavedStaysPage.css';

interface SavedStayItem {
  id: string;
  name: string;
  type: string;
  location: string;
  district?: string;
  pricePerNight: number;
  priceType?: 'per_night' | 'per_person';
  rating: number;
  reviews: number;
  imageUrl: string;
  features?: string[];
  amenities?: string[];
  description?: string;
}

export const SavedStaysPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { savedIds, toggleSaved, clearSaved } = useSavedStays();
  const [liveMap, setLiveMap] = useState<Record<string, SavedStayItem>>({});
  const [loading, setLoading] = useState(false);

  // Fetch any saved IDs that aren't in the static Chiang Dao atlas
  useEffect(() => {
    const atlasSet = new Set(CHIANG_DAO_ATLAS_STAYS.map((s) => s.id));
    const missingIds = savedIds.filter((id) => !atlasSet.has(id));
    if (missingIds.length === 0) return;

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await supabase
          .from('properties')
          .select('*')
          .in('id', missingIds);

        if (!cancelled && data) {
          const next: Record<string, SavedStayItem> = {};
          data.forEach((p: any) => {
            next[p.id] = {
              id: p.id,
              name: p.name,
              type: p.type || 'Homestay',
              location: p.location || `${p.district || 'Chiang Dao'}, ${p.province || 'Chiang Mai'}`,
              district: p.district,
              pricePerNight: Number(p.price_per_night || p.price || 0),
              priceType: p.price_type || 'per_night',
              rating: Number(p.rating || 0),
              reviews: Number(p.reviews || 0),
              imageUrl: p.image_url || (Array.isArray(p.images) && p.images[0]) || '/doiluangbg.jpg',
              features: p.features || [],
              amenities: p.amenities || [],
              description: p.description || '',
            };
          });
          setLiveMap(next);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [savedIds]);

  const savedStays = useMemo<SavedStayItem[]>(() => {
    const atlasLookup = new Map(CHIANG_DAO_ATLAS_STAYS.map((s) => [s.id, s]));
    const result: SavedStayItem[] = [];
    savedIds.forEach((id) => {
      const atlas = atlasLookup.get(id);
      if (atlas) {
        result.push({
          id: atlas.id,
          name: atlas.name,
          type: atlas.type,
          location: atlas.location || atlas.zoneLabel,
          district: atlas.district,
          pricePerNight: Number(atlas.pricePerNight || 0),
          priceType: atlas.price_type || 'per_night',
          rating: Number(atlas.rating || 0),
          reviews: Number(atlas.reviews || 0),
          imageUrl: atlas.imageUrl || '/doiluangbg.jpg',
          features: atlas.features || [],
          amenities: atlas.amenities || [],
          description: atlas.description || '',
        });
      } else if (liveMap[id]) {
        result.push(liveMap[id]);
      }
    });
    return result;
  }, [savedIds, liveMap]);

  return (
    <div className="saved-page animate-fade-in">
      <div className="container saved-shell">
        <header className="saved-header">
          <div>
            <h1>{t('saved.title')}</h1>
            <p>{t('saved.subtitle')}</p>
          </div>
          {savedStays.length > 0 && (
            <div className="saved-header-actions">
              <span className="saved-count-pill">{t('saved.count', { count: savedStays.length })}</span>
              <button type="button" className="saved-clear-btn" onClick={clearSaved}>
                {t('saved.clearAll')}
              </button>
            </div>
          )}
        </header>

        {loading && savedStays.length === 0 ? (
          <div className="saved-empty">
            <p>{t('hotelDetail.loading')}</p>
          </div>
        ) : savedStays.length === 0 ? (
          <div className="saved-empty">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M12 21s-7-4.5-9.2-8.4C1.1 9.5 2.7 5.5 6.5 5.5c2.1 0 3.7 1.1 5.5 3.1 1.8-2 3.4-3.1 5.5-3.1 3.8 0 5.4 4 3.7 7.1C19 16.5 12 21 12 21z" />
            </svg>
            <h2>{t('saved.emptyTitle')}</h2>
            <p>{t('saved.emptyBody')}</p>
            <button type="button" className="saved-explore-btn" onClick={() => navigate('/hotels')}>
              {t('saved.exploreBtn')}
            </button>
          </div>
        ) : (
          <>
            {/* Saved Stays Grid */}
            <div className="saved-grid">
              {savedStays.map((stay) => (
                <article key={stay.id} className="saved-card" onClick={() => navigate(`/hotels/${stay.id}`)}>
                  <div className="saved-card-media">
                    <img src={stay.imageUrl} alt={stay.name} loading="lazy" />
                    <button
                      type="button"
                      className="saved-card-heart active"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaved(stay.id);
                      }}
                      aria-label={t('saved.remove')}
                      title={t('saved.remove')}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div>
                  <div className="saved-card-body">
                    <div className="saved-card-top">
                      <span className="saved-card-loc">{stay.location}</span>
                      {stay.reviews > 0 && stay.rating > 0 && (
                        <span className="saved-card-rating">★ {stay.rating.toFixed(1)}</span>
                      )}
                    </div>
                    <h3>{stay.name}</h3>
                    <div className="saved-card-footer">
                      <div className="saved-card-price">
                        <strong>฿{stay.pricePerNight.toLocaleString()}</strong>
                        <span>{stay.priceType === 'per_person' ? t('common.perPerson') : t('common.perNight')}</span>
                      </div>
                      <span className="saved-card-link">{t('saved.viewStay')} →</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Side-by-Side Comparison Table (when 2+ stays are saved) */}
            {savedStays.length >= 2 && (
              <section className="saved-compare-section" aria-label={t('saved.compareTitle')}>
                <h2>{t('saved.compareTitle')}</h2>
                <div className="saved-compare-wrap">
                  <table className="saved-compare-table">
                    <thead>
                      <tr>
                        <th>{t('saved.colStay')}</th>
                        <th>{t('saved.colPrice')}</th>
                        <th>{t('saved.colArea')}</th>
                        <th>{t('saved.colRating')}</th>
                        <th>{t('saved.colAccess')}</th>
                        <th>{t('saved.colPower')}</th>
                        <th>{t('saved.colMeals')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedStays.map((stay) => {
                        const info = getStayPracticalInfo(stay);
                        const byKey = Object.fromEntries(info.map((i) => [i.key, i]));
                        return (
                          <tr key={stay.id} onClick={() => navigate(`/hotels/${stay.id}`)}>
                            <td className="cmp-stay-cell">
                              <img src={stay.imageUrl} alt="" />
                              <strong>{stay.name}</strong>
                            </td>
                            <td className="cmp-price-cell">
                              <strong>฿{stay.pricePerNight.toLocaleString()}</strong>
                              <span> {stay.priceType === 'per_person' ? t('common.perPerson') : t('common.perNight')}</span>
                            </td>
                            <td>{stay.location}</td>
                            <td>
                              {stay.reviews > 0 && stay.rating > 0
                                ? `★ ${stay.rating.toFixed(1)} (${stay.reviews})`
                                : t('hotelDetail.noReviewsYet')}
                            </td>
                            <td>{t(byKey.access.valueKey)}</td>
                            <td>{t(byKey.power.valueKey)}</td>
                            <td>{t(byKey.meals.valueKey)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SavedStaysPage;
