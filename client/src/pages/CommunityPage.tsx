import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import JournalModal from '../components/JournalModal';
import { type Post } from '../types';
import './CommunityPage.css';

type FeedTab = 'latest' | 'top' | 'reviews';

interface Place {
  name: string;
  count: number;
}

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerPhoto, setViewerPhoto] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  const locationFilter = searchParams.get('location');
  const tab: FeedTab = (['latest', 'top', 'reviews'] as const).includes(searchParams.get('tab') as FeedTab)
    ? (searchParams.get('tab') as FeedTab)
    : 'latest';

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, comments(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(p => ({
        ...p,
        userId: p.user_id,
        authorName: p.author_name,
        authorAvatar: p.author_avatar,
        imageUrl: p.image_url,
        locationTag: p.location_tag,
        priceRating: p.price_rating,
        propertyId: p.property_id,
        joinPotw: p.join_potw,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        comments: (p.comments || [])
          .map((c: { id: string; user_id: string; author_name: string; author_avatar: string; text: string; created_at: string }) => ({
            id: c.id,
            userId: c.user_id,
            authorName: c.author_name,
            authorAvatar: c.author_avatar,
            text: c.text,
            createdAt: c.created_at,
          }))
          .sort((a: { createdAt: string }, b: { createdAt: string }) => a.createdAt.localeCompare(b.createdAt)),
      }));
      setPosts(formatted);
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleCreateClick = () => {
    if (!user) {
      alert(t('journal.loginToPost'));
      return;
    }
    setIsModalOpen(true);
  };

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  // Places = every location tag in the journal, busiest first
  const places: Place[] = useMemo(() => {
    const map = new Map<string, Place>();
    for (const p of posts) {
      if (!p.locationTag) continue;
      const place = map.get(p.locationTag) || { name: p.locationTag, count: 0 };
      place.count += 1;
      map.set(p.locationTag, place);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [posts]);

  const feed = useMemo(() => {
    let list = posts.filter(p => !locationFilter || p.locationTag === locationFilter);
    if (tab === 'reviews') list = list.filter(p => p.rating || p.priceRating);
    if (tab === 'top') list = [...list].sort((a, b) => (b.likes || []).length - (a.likes || []).length);
    return list;
  }, [posts, locationFilter, tab]);

  const pictureOfWeek = useMemo(() =>
    posts
      .filter(p => p.joinPotw && p.imageUrl)
      .sort((a, b) => (b.likes || []).length - (a.likes || []).length)
      .slice(0, 3),
  [posts]);

  const openPostById = (id: string) => {
    setViewerPhoto(0);
    const idx = feed.findIndex(p => p.id === id);
    if (idx >= 0) {
      setViewerIndex(idx);
      return;
    }
    // Not in the current filter: reset filters, then open from the full list
    setSearchParams({});
    const fullIdx = posts.findIndex(p => p.id === id);
    if (fullIdx >= 0) setViewerIndex(fullIdx);
  };

  const userAvatar = user
    ? user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2C4C3B&color=fff`
    : null;

  const tabs: { id: FeedTab; label: string }[] = [
    { id: 'latest', label: t('journal.tabs.latest') },
    { id: 'top', label: t('journal.tabs.top') },
    { id: 'reviews', label: t('journal.tabs.reviews') },
  ];

  return (
    <div className="journal-page">
      <div className="journal-layout">
        <main className="journal-main">
          <h1 className="journal-title">{t('journal.title')}</h1>

          {/* Place filter chips — stand in for the right rail on tablet and mobile */}
          {places.length > 0 && (
            <nav className="journal-chips" aria-label={t('journal.placesLabel')}>
              <button
                className={`journal-chip ${!locationFilter ? 'active' : ''}`}
                onClick={() => setParam('location', null)}
                aria-pressed={!locationFilter}
              >
                {t('journal.allPlaces')}
              </button>
              {places.map(place => (
                <button
                  key={place.name}
                  className={`journal-chip ${locationFilter === place.name ? 'active' : ''}`}
                  onClick={() => setParam('location', locationFilter === place.name ? null : place.name)}
                  aria-pressed={locationFilter === place.name}
                >
                  {place.name}
                </button>
              ))}
            </nav>
          )}

          {/* Composer — Facebook "What's on your mind?" */}
          <section className="journal-composer" aria-label={t('journal.composerLabel')}>
            <div className="journal-composer-top">
              {userAvatar ? (
                <img src={userAvatar} alt="" className="journal-composer-avatar" />
              ) : (
                <span className="journal-composer-avatar journal-composer-avatar--guest" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z"/></svg>
                </span>
              )}
              <button className="journal-composer-prompt" onClick={handleCreateClick}>
                {user
                  ? t('journal.composerPrompt', { name: user.name.split(' ')[0] })
                  : t('journal.composerPromptGuest')}
              </button>
            </div>
            <div className="journal-composer-actions">
              <button onClick={handleCreateClick}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2F7D4F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/></svg>
                {t('journal.photo')}
              </button>
              <button onClick={handleCreateClick}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#E0A21B" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>
                {t('journal.review')}
              </button>
              <button onClick={handleCreateClick}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#C2563A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
                {t('journal.place')}
              </button>
            </div>
          </section>

          {/* Feed tabs */}
          <div className="journal-tabs" role="tablist" aria-label={t('journal.tabsLabel')}>
            {tabs.map(tb => (
              <button
                key={tb.id}
                role="tab"
                aria-selected={tab === tb.id}
                className={`journal-tab ${tab === tb.id ? 'active' : ''}`}
                onClick={() => setParam('tab', tb.id === 'latest' ? null : tb.id)}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {locationFilter && (
            <div className="journal-filter">
              <span>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
                {t('journal.showingPlace', { place: locationFilter })}
              </span>
              <button onClick={() => setParam('location', null)}>{t('journal.clear')}</button>
            </div>
          )}

          <div className="journal-feed">
            {loading ? (
              <div className="journal-skeleton" aria-label={t('journal.loading')} role="status">
                {[0, 1].map(i => (
                  <div key={i} className="journal-skeleton-card">
                    <div className="sk-head"><span className="sk-avatar" /><span className="sk-line" /></div>
                    <div className="sk-media" />
                  </div>
                ))}
              </div>
            ) : feed.length > 0 ? (
              feed.map((post, idx) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdate={handlePostUpdate}
                  onDelete={handlePostDelete}
                  onTagClick={(tag) => setParam('location', tag)}
                  onOpen={(photo) => { setViewerPhoto(photo ?? 0); setViewerIndex(idx); }}
                />
              ))
            ) : (
              <div className="journal-empty">
                <h2>{locationFilter || tab !== 'latest' ? t('journal.emptyFilteredTitle') : t('journal.emptyTitle')}</h2>
                <p>{locationFilter || tab !== 'latest' ? t('journal.emptyFilteredBody') : t('journal.emptyBody')}</p>
                <button className="journal-primary-btn" onClick={handleCreateClick}>
                  {t('journal.sharePost')}
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Right rail — Instagram-style suggestions column */}
        <aside className="journal-rail">
          {user && userAvatar && (
            <div className="rail-me">
              <img src={userAvatar} alt="" />
              <div>
                <strong>{user.name}</strong>
                <span>{t('journal.postsCount', { count: posts.filter(p => p.userId === user.id).length })}</span>
              </div>
            </div>
          )}

          {pictureOfWeek.length > 0 && (
            <section className="rail-block">
              <h2>{t('journal.potw')}</h2>
              <ol className="rail-potw">
                {pictureOfWeek.map((p, i) => (
                  <li key={p.id}>
                    <button onClick={() => openPostById(p.id)}>
                      <span className="rail-potw-rank" aria-hidden="true">{i + 1}</span>
                      <img src={p.imageUrl!} alt="" loading="lazy" />
                      <span className="rail-potw-text">
                        <span className="rail-potw-name">{p.authorName}</span>
                        <span className="rail-potw-meta">
                          {p.locationTag && <>{p.locationTag} · </>}
                          {t('post.likes', { count: (p.likes || []).length })}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {places.length > 0 && (
            <section className="rail-block">
              <h2>{t('journal.topPlaces')}</h2>
              <ul className="rail-places">
                {places.slice(0, 6).map(place => (
                  <li key={place.name}>
                    <button
                      className={locationFilter === place.name ? 'active' : ''}
                      onClick={() => setParam('location', place.name)}
                    >
                      <span>{place.name}</span>
                      <span className="rail-places-count">{t('journal.postsCount', { count: place.count })}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <button className="journal-primary-btn rail-cta" onClick={handleCreateClick}>
            {t('journal.sharePost')}
          </button>
        </aside>
      </div>

      {isModalOpen && (
        <CreatePostModal
          onClose={() => setIsModalOpen(false)}
          onPostCreated={() => {
            setIsModalOpen(false);
            fetchPosts(); // Refresh feed
          }}
        />
      )}

      {viewerIndex !== null && feed[viewerIndex] && (
        <JournalModal
          posts={feed}
          index={viewerIndex}
          photoIndex={viewerPhoto}
          onClose={() => setViewerIndex(null)}
          onNavigate={(i) => { setViewerPhoto(0); setViewerIndex(i); }}
          onUpdate={handlePostUpdate}
        />
      )}
    </div>
  );
};

export default CommunityPage;
